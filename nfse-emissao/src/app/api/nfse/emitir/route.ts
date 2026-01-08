import { NextResponse } from 'next/server'
import { normalizeSignaturePlacement } from '@/lib/nfse-nacional/xmlUtils'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const xmlAssinado = String(body?.xmlAssinado || '')
    const ambiente = Number(body?.ambiente)
    const certificateId = String(body?.certificateId || '')
    const cnpjEmitente = body?.cnpjEmitente ? String(body.cnpjEmitente) : undefined
    if (!xmlAssinado || !ambiente || !certificateId) {
      return NextResponse.json({ message: 'xmlAssinado, ambiente e certificateId são obrigatórios' }, { status: 400 })
    }

    const baseUrl = process.env.NEXT_PUBLIC_NFSE_LOCAL_URL || process.env.NEXT_PUBLIC_NFSE_LOCAL_URL || 'https://localhost:5179'
    const xmlNorm = normalizeSignaturePlacement(xmlAssinado)

    const url = `${String(baseUrl).replace(/\/$/, '')}/nfse/emitir`
    console.log('[API /api/nfse/emitir] Enviando para serviço local', {
      url,
      ambiente,
      certificateIdPreview: certificateId ? certificateId.slice(0,6)+'...' : '',
      cnpjEmitente,
      xmlAssinadoLen: xmlNorm?.length ?? 0,
    })
    const r = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
      body: JSON.stringify({ xmlAssinado: xmlNorm, ambiente, certificateId, cnpjEmitente }),
    })
    const ct = r.headers.get('content-type') || 'application/json; charset=utf-8'
    const init = { status: r.status, headers: { 'Content-Type': ct } } as any
    const raw = await r.text()
    console.log('[API /api/nfse/emitir] Resposta do serviço local', {
      status: r.status,
      contentType: ct,
      bodyPreview: raw?.slice(0, 500)
    })
    if (!r.ok) {
      return new NextResponse(raw || JSON.stringify({ error: 'Falha na emissão local' }), init)
    }
    if (ct.includes('application/json')) return new NextResponse(raw, init)
    return new NextResponse(raw, init)
  } catch (e: any) {
    return NextResponse.json({ error: 'Falha na emissão local', details: e?.message || String(e) }, { status: 500 })
  }
}
