import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import fs from 'fs'
import path from 'path'

export async function POST(request: NextRequest) {
  try {
    const { chaveAcesso } = await request.json().catch(() => ({})) as { chaveAcesso?: string }
    const chDigits = String(chaveAcesso || '').replace(/\D+/g, '')
    if (!(chDigits.length === 44 || chDigits.length === 50)) {
      return NextResponse.json({ error: 'chaveAcesso inválida (44 ou 50 dígitos)' }, { status: 400 })
    }
    const ch44 = chDigits.length === 50 ? chDigits.slice(0, 44) : chDigits

    // Procura em nfseXML contendo a chave (registro salvo na emissão/consulta)
    const nota = await prisma.notafiscal.findFirst({
      where: { nfseXML: { contains: ch44 } },
      select: { id: true, nfseXML: true }
    })
    if (nota?.nfseXML) {
      const xml = nota.nfseXML
      const m = xml.match(/<\s*infPedReg\b[^>]*\bId\s*=\s*\"([^\"]+)\"/)
      const idInfPedReg = m?.[1]
      if (idInfPedReg) {
        return NextResponse.json({ ok: true, idInfPedReg, notaId: nota.id })
      }
    }

    // Fallback 1: procurar na tabela nFSe (retornos de emissão)
    try {
      const registros = await (prisma as any).nFSe.findMany({
        where: {
          OR: [
            { xmlNfse: { contains: ch44 } },
            { rawResponse: { contains: ch44 } },
          ]
        },
        select: { id: true, xmlNfse: true, rawResponse: true, nfseBase64Gzip: true }
      })
      for (const reg of registros || []) {
        if (typeof reg.xmlNfse === 'string' && reg.xmlNfse.includes(ch44)) {
          const mm = reg.xmlNfse.match(/<\s*infPedReg\b[^>]*\bId\s*=\s*\"([^\"]+)\"/)
          if (mm?.[1]) return NextResponse.json({ ok: true, idInfPedReg: mm[1] })
        }
        if (typeof reg.rawResponse === 'string' && reg.rawResponse.includes('<infPedReg')) {
          const mm = reg.rawResponse.match(/<\s*infPedReg\b[^>]*\bId\s*=\s*\"([^\"]+)\"/)
          if (mm?.[1]) return NextResponse.json({ ok: true, idInfPedReg: mm[1] })
        }
        if (reg.nfseBase64Gzip) {
          try {
            const buf: Buffer = Buffer.isBuffer(reg.nfseBase64Gzip) ? reg.nfseBase64Gzip : Buffer.from(reg.nfseBase64Gzip as any)
            const xml = require('zlib').gunzipSync(buf).toString('utf-8')
            if (xml.includes(ch44)) {
              const mm = xml.match(/<\s*infPedReg\b[^>]*\bId\s*=\s*\"([^\"]+)\"/)
              if (mm?.[1]) return NextResponse.json({ ok: true, idInfPedReg: mm[1] })
            }
          } catch {}
        }
      }
    } catch {}

    // Fallback 2: procurar em arquivos XML na pasta 'nfse/**.xml'
    const baseDir = path.join(process.cwd(), 'nfse')
    let foundId: string | undefined
    try {
      if (fs.existsSync(baseDir)) {
        const stack: string[] = [baseDir]
        while (stack.length && !foundId) {
          const dir = stack.pop() as string
          const entries = fs.readdirSync(dir, { withFileTypes: true })
          for (const e of entries) {
            const full = path.join(dir, e.name)
            if (e.isDirectory()) {
              stack.push(full)
              continue
            }
            if (e.isFile() && /\.xml$/i.test(e.name)) {
              try {
                const content = fs.readFileSync(full, 'utf-8')
                if (content.includes(ch44) && /<\s*infPedReg\b/i.test(content)) {
                  const mm = content.match(/<\s*infPedReg\b[^>]*\bId\s*=\s*\"([^\"]+)\"/)
                  if (mm?.[1]) { foundId = mm[1]; break }
                }
              } catch {}
            }
          }
        }
      }
    } catch {}

    if (foundId) {
      return NextResponse.json({ ok: true, idInfPedReg: foundId })
    }

    return NextResponse.json({ error: 'infPedReg.Id não localizado no XML salvo' }, { status: 404 })
  } catch (e: any) {
    return NextResponse.json({ error: 'Falha ao obter Id do registro', details: e?.message || String(e) }, { status: 500 })
  }
}
