import { NextResponse } from 'next/server'
import { getTokenData } from '@/services/authService'
import https from 'node:https'
import zlib from 'node:zlib'
import { prisma } from '@/lib/prisma'
import fs from 'fs'
import path from 'path'

export async function POST(request: Request) {
  try {
    const user = await getTokenData(request as any)
    if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

    const body = await request.json().catch(() => null) as any
    const source: string = body?.pedidoRegistroEventoXmlGZipB64 || body?.eventoXmlGZipB64 || body?.evento || body?.pedidoRegistroEvento?.evento
    const chave: string = String(body?.chaveAcesso || '').replace(/\D+/g, '')
    const certificateId: string = String(body?.certificateId || '')
    const ambienteRaw = body?.ambiente
    const ambiente = ambienteRaw === 1 || ambienteRaw === 2 ? ambienteRaw : 2

    if (!source || typeof source !== 'string') {
      return NextResponse.json({ error: 'Evento do cancelamento ausente' }, { status: 400 })
    }
    if (!chave || ![44,50].includes(chave.length)) {
      return NextResponse.json({ error: 'chaveAcesso inválida (44 ou 50 dígitos)' }, { status: 400 })
    }
    if (!certificateId) {
      return NextResponse.json({ error: 'certificateId obrigatório' }, { status: 400 })
    }

    // Normalização do conteúdo: aceitar XML puro ou Base64 (gzip ou não) e produzir Base64+GZip
    let gzB64: string | undefined
    const toGzipB64 = (xml: string) => zlib.gzipSync(Buffer.from(xml, 'utf-8'), { level: 9 }).toString('base64')

    try {
      // Caso 1: veio XML puro
      if (/^\s*<\?xml|^\s*<\s*pedRegEvento[\s>]/i.test(source)) {
        gzB64 = toGzipB64(source)
      } else {
        // Caso 2: veio Base64. Tentar gunzip; se falhar, verificar se é XML plano em Base64
        const rawDec = Buffer.from(source, 'base64')
        try {
          const xmlFromGz = zlib.gunzipSync(rawDec).toString('utf-8')
          // se conseguiu gunzip, já está no formato esperado
          gzB64 = source
        } catch {
          const maybeXml = rawDec.toString('utf-8')
          if (/^\s*<\s*pedRegEvento[\s>]/i.test(maybeXml)) {
            gzB64 = toGzipB64(maybeXml)
          } else {
            // fallback: manter como veio (poderá falhar na API local, mas não bloquear)
            gzB64 = source
          }
        }
      }
    } catch {
      gzB64 = source
    }

    // Sem heurísticas: nenhuma validação/correção de Id ou estrutura.

    const baseUrl = process.env.NEXT_PUBLIC_NFSE_LOCAL_URL || 'https://localhost:5179'
    const url = `${String(baseUrl).replace(/\/$/, '')}/nfse/cancelar`

    const bodyStr = JSON.stringify({ pedidoRegistroEventoXmlGZipB64: gzB64, chaveAcesso: chave })

    return await new Promise<Response>((resolve) => {
      const req = https.request(url, {
        method: 'POST',
        rejectUnauthorized: false,
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          'Content-Length': Buffer.byteLength(bodyStr).toString(),
          'X-Certificate-Id': certificateId,
          'X-Ambiente': String(ambiente),
          'Accept': 'application/json, text/plain, */*',
        },
      }, (res) => {
        const status = res.statusCode || 502
        const contentType = res.headers['content-type'] || 'application/json; charset=utf-8'
        const chunks: Buffer[] = []
        res.on('data', (d: Buffer) => chunks.push(d))
        res.on('end', () => {
          const raw = Buffer.concat(chunks).toString('utf-8')
          const init: any = { status, headers: { 'Content-Type': String(contentType) } }
          if (status >= 200 && status < 300) {
            // Atualizar status local da NFSe para cancelada (best-effort)
            ;(async () => {
              try {
                let xmlCancelamento: string | undefined
                try {
                  const buf = Buffer.from(gzB64 || '', 'base64')
                  const xml = zlib.gunzipSync(buf).toString('utf-8')
                  if (xml && /<\s*pedRegEvento[\s>]/i.test(xml)) xmlCancelamento = xml
                } catch {}
                if (chave) {
                  const u = await prisma.notafiscal.updateMany({
                    where: { chaveAcesso: chave },
                    data: {
                      status: '2',
                      statusNfse: 'cancelada',
                      dataCancelamento: new Date(),
                      ...(xmlCancelamento ? { xmlCancelamento } : {}),
                    },
                  })
                  if (!u?.count) {
                    try {
                      const nf = await prisma.notafiscal.findFirst({ where: { nfseXML: { contains: chave } }, select: { id: true } })
                      if (nf?.id) {
                        await prisma.notafiscal.update({
                          where: { id: nf.id },
                          data: {
                            status: '2',
                            statusNfse: 'cancelada',
                            dataCancelamento: new Date(),
                            ...(xmlCancelamento ? { xmlCancelamento } : {}),
                            // opcional: sincronizar chave se ausente
                            ...(chave ? { chaveAcesso: chave } : {}),
                          },
                        })
                      }
                    } catch {}
                  }
                }
              } catch {}
            })().finally(() => {
              resolve(new NextResponse(raw, init))
            })
          } else {
            // Se a SEFIN indicar que já está cancelada (E0840), atualizar localmente como cancelada
            try {
              const j = JSON.parse(raw || '{}') as any
              const erros: any[] = Array.isArray(j?.erro) ? j.erro : []
              const temE0840 = erros.some(e => String(e?.codigo || '').toUpperCase() === 'E0840')
              const desc = (erros.map(e => String(e?.descricao || '')).join(' ') || '').toLowerCase()
              const indicaJaCancelada = temE0840 || /já\s*est(a|á)\s*cancelad/.test(desc) || /evento\s*de\s*cancelamento.+vinculado/i.test(desc)
              if (indicaJaCancelada && chave) {
                ;(async () => {
                  try {
                    const u = await prisma.notafiscal.updateMany({
                      where: { chaveAcesso: chave },
                      data: { status: '2', statusNfse: 'cancelada', dataCancelamento: new Date() },
                    })
                    if (!u?.count) {
                      const nf = await prisma.notafiscal.findFirst({ where: { nfseXML: { contains: chave } }, select: { id: true } })
                      if (nf?.id) {
                        await prisma.notafiscal.update({ where: { id: nf.id }, data: { status: '2', statusNfse: 'cancelada', dataCancelamento: new Date(), ...(chave ? { chaveAcesso: chave } : {}) } })
                      }
                    }
                  } catch {}
                })().finally(() => {
                  resolve(NextResponse.json({ success: true, alreadyCanceled: true, updatedLocal: true, relay: j }, { status: 200 }))
                })
                return
              }
            } catch {}
            // Retornar payload de diagnóstico junto com resposta do proxy quando falhar
            const diag = raw || JSON.stringify({ error: 'Falha no cancelamento local' })
            resolve(new NextResponse(diag, init))
          }
        })
      })
      req.on('error', (e) => {
        resolve(NextResponse.json({ error: 'Falha no cancelamento', details: (e as any)?.message || String(e) }, { status: 500 }))
      })
      req.write(bodyStr)
      req.end()
    })
  } catch (e: any) {
    return NextResponse.json({ error: 'Falha no cancelamento', details: e?.message || String(e) }, { status: 500 })
  }
}
