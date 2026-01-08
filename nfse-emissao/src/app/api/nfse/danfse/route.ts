import { NextResponse } from 'next/server'
import https from 'node:https'
import { getTokenData } from '@/services/authService'

export async function GET(request: Request) {
  try {
    const user = await getTokenData(request as any)
    if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    const { searchParams } = new URL(request.url)
    const chave = String(searchParams.get('chave') || searchParams.get('chaveAcesso') || '')
    const ambienteRaw = searchParams.get('ambiente') ?? searchParams.get('tpAmb')
    const ambiente = ambienteRaw != null ? Number(ambienteRaw) : 2
    const certificateId = searchParams.get('certificateId') || undefined

    const chDigits = chave.replace(/\D+/g, '')
    if (!chave || chDigits.length !== 50) {
      return NextResponse.json({ error: 'chaveAcesso inválida (esperado 50 dígitos)' }, { status: 400 })
    }
    if (ambiente !== 1 && ambiente !== 2) {
      return NextResponse.json({ error: 'ambiente inválido (1 ou 2)' }, { status: 400 })
    }
    if (!certificateId) {
      return NextResponse.json({ error: 'certificateId obrigatório' }, { status: 400 })
    }

    const baseUrl = process.env.NEXT_PUBLIC_NFSE_LOCAL_URL || 'https://localhost:5179'
    const url = `${String(baseUrl).replace(/\/$/, '')}/danfse/${encodeURIComponent(chDigits)}?ambiente=${encodeURIComponent(String(ambiente))}`

    return await new Promise<Response>((resolve) => {
      const req = https.request(url, {
        method: 'GET',
        rejectUnauthorized: false, // permitir cert local
        headers: {
          ...(certificateId ? { 'X-Certificate-Id': String(certificateId) } : {}),
        },
      }, (res) => {
        const status = res.statusCode || 502;
        const contentType = res.headers['content-type'] || 'application/pdf';
        const chunks: Buffer[] = [];
        res.on('data', (d: Buffer) => chunks.push(d));
        res.on('end', () => {
          const body = Buffer.concat(chunks);
          if (status >= 200 && status < 300) {
            const headers = new Headers();
            headers.set('Content-Type', String(contentType));
            headers.set('Content-Disposition', 'inline; filename="danfse.pdf"');
            resolve(new Response(body, { status: 200, headers }));
          } else {
            const text = body.toString('utf-8');
            console.error('[api/nfse/danfse] Falha proxy DANFSe', { status, url, text: text.slice(0, 500) });
            resolve(NextResponse.json({ error: 'Falha ao obter DANFSe', url, status, body: text }, { status }));
          }
        });
      });
      req.on('error', (e) => {
        resolve(NextResponse.json({ error: 'Falha ao obter DANFSe', details: (e as any)?.message || String(e) }, { status: 500 }));
      });
      req.end();
    })
  } catch (e: any) {
    return NextResponse.json({ error: 'Falha ao obter DANFSe', details: e?.message || String(e) }, { status: 500 })
  }
}
