import { NextResponse } from 'next/server'
import https from 'node:https'
import { getTokenData } from '@/services/authService'

export async function POST(request: Request) {
  try {
    console.log('[api/nfse/assinar] Início');
    const user = await getTokenData(request as any).catch(() => null)
    if (!user) {
      // Fallback: permitir same-origin (Origin/Referer deve ser a mesma origem do request)
      const hdrs = (request as any).headers || new Headers()
      const origin = hdrs.get('origin') || ''
      const referer = hdrs.get('referer') || ''
      const reqUrl = new URL(request.url)
      const reqOrigin = `${reqUrl.protocol}//${reqUrl.host}`
      const same = (!!origin && origin === reqOrigin) || (!!referer && referer.startsWith(reqOrigin))
      console.log('[api/nfse/assinar] Sem token. origin, referer, reqOrigin, same =', origin, referer, reqOrigin, same)
      if (!same) {
        return NextResponse.json({ error: 'Não autorizado (origem inválida)' }, { status: 401 })
      }
    }

    const body = await request.json().catch(() => null) as any
    const xml = String(body?.xml || '')
    const tag = String(body?.tag || '')
    const certificateId = String(body?.certificateId || '')
    console.log('[api/nfse/assinar] Entrada:', {
      xmlLen: xml.length,
      tag,
      certSuffix: certificateId ? certificateId.slice(-8) : ''
    })

    if (!xml || !tag || !certificateId) {
      return NextResponse.json({ error: 'xml, tag e certificateId são obrigatórios' }, { status: 400 })
    }

    // Validação leve: tenta detectar a tag (com ou sem prefixo de namespace). Não bloqueia se não encontrar.
    const tagRegex = new RegExp(`<\\s*(?:[A-Za-z_][\\w\-.]*:)?${tag}\\b`, 'i')
    const hasTag = tagRegex.test(xml)
    console.log('[api/nfse/assinar] Tag detectada?', hasTag)

    const baseUrl = process.env.NEXT_PUBLIC_NFSE_LOCAL_URL || 'https://localhost:5179'
    const url = `${String(baseUrl).replace(/\/$/, '')}/assinatura`
    const bodyStr = JSON.stringify({ xml, tag, certificateId })

    return await new Promise<Response>((resolve) => {
      const req = https.request(url, {
        method: 'POST',
        rejectUnauthorized: false,
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          'Content-Length': Buffer.byteLength(bodyStr).toString(),
          'Accept': 'application/xml, text/plain, */*',
        },
      }, (res) => {
        const status = res.statusCode || 502
        const contentType = res.headers['content-type'] || 'application/xml; charset=utf-8'
        const chunks: Buffer[] = []
        res.on('data', (d: Buffer) => chunks.push(d))
        res.on('end', () => {
          const raw = Buffer.concat(chunks)
          console.log('[api/nfse/assinar] Resposta local:', status, String(contentType), 'len=', raw.length)
          if (status >= 200 && status < 300) {
            resolve(new Response(raw, { status, headers: { 'Content-Type': String(contentType) } }))
          } else {
            const txt = raw.toString('utf-8')
            console.warn('[api/nfse/assinar] Erro local body preview:', txt.slice(0, 400))
            resolve(NextResponse.json({ error: 'Falha na assinatura', status, body: txt }, { status }))
          }
        })
      })
      req.on('error', (e) => {
        console.error('[api/nfse/assinar] Erro na request local:', (e as any)?.message || String(e))
        resolve(NextResponse.json({ error: 'Falha na assinatura', details: (e as any)?.message || String(e) }, { status: 500 }))
      })
      req.write(bodyStr)
      req.end()
    })
  } catch (e: any) {
    console.error('[api/nfse/assinar] Exceção:', e?.message || String(e))
    return NextResponse.json({ error: 'Falha na assinatura', details: e?.message || String(e) }, { status: 500 })
  }
}
