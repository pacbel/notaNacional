import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const xml = String(body?.xml || '')
    const tipo = String(body?.tipo || 'DPS')
    const versao = String(body?.versao || '1.00.02')
    if (!xml) {
      return NextResponse.json({ ok: false, errors: ['XML não informado para validação XSD.'] }, { status: 400 })
    }

    const baseUrl = process.env.NEXT_PUBLIC_NFSE_LOCAL_URL || process.env.NEXT_PUBLIC_NFSE_LOCAL_URL || 'https://localhost:5179'
    const url = `${String(baseUrl).replace(/\/$/, '')}/nfse/validar-xsd`

    try {
      const r = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json; charset=utf-8' },
        body: JSON.stringify({ xml, tipo, versao }),
      })
      const ct = r.headers.get('content-type') || 'application/json; charset=utf-8'
      const raw = await r.text()
      const init = { status: r.status, headers: { 'Content-Type': ct } } as any
      if (!r.ok) {
        return new NextResponse(raw || JSON.stringify({ ok: true, warnings: ['Validador XSD local indisponível.'] }), init)
      }
      return new NextResponse(raw, init)
    } catch (e: any) {
      // Fallback: não bloquear, mas retornar aviso
      return NextResponse.json({ ok: true, warnings: ['Validador XSD local inacessível. Prosseguindo.'] })
    }
  } catch (e: any) {
    return NextResponse.json({ ok: false, errors: [e?.message || 'Falha inesperada na validação XSD.'] }, { status: 500 })
  }
}
