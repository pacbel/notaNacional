// src/lib/nfse-nacional/localClient.ts
// UTF-8 - Cliente (browser) para API Local em https://localhost:5179

export const LOCAL_API_BASE = (typeof window !== 'undefined' && (window as unknown as { NEXT_PUBLIC_NFSE_LOCAL_URL?: string }).NEXT_PUBLIC_NFSE_LOCAL_URL)
  || (typeof process !== 'undefined' ? (process.env.NEXT_PUBLIC_NFSE_LOCAL_URL || 'https://localhost:5179') : 'https://localhost:5179');

async function http<T = unknown>(path: string, init?: RequestInit): Promise<T> {
  const url = `${LOCAL_API_BASE.replace(/\/$/, '')}${path}`;
  const r = await fetch(url, init);
  const ct = r.headers.get('content-type') || '';
  if (!r.ok) {
    const text = await r.text().catch(() => '');
    throw new Error(text || `Erro HTTP ${r.status}`);
  }
  if (ct.includes('application/json')) return (await r.json()) as T;
  return (await r.text()) as unknown as T;
}

export async function listarCertificados(): Promise<unknown> {
  return http('/certificados');
}

export async function assinarXml(xml: string, tag: string, certificateId: string): Promise<string> {
  const r = await fetch(`${LOCAL_API_BASE.replace(/\/$/, '')}/assinatura`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
    body: JSON.stringify({ xml, tag, certificateId }),
  });
  if (!r.ok) throw new Error(await r.text());
  return await r.text();
}

export interface EmitirPayload {
  xmlAssinado: string;
  certificateId: string;
  ambiente: 1 | 2 | number;
  cnpjEmitente?: string;
}

export async function emitirNFSe(payload: EmitirPayload): Promise<unknown> {
  return http('/nfse/emitir', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json; charset=utf-8', Accept: 'application/json' },
    body: JSON.stringify(payload),
  });
}

export async function baixarDANFSe(chave: string, ambiente?: number): Promise<Blob> {
  const u = new URL(`${LOCAL_API_BASE.replace(/\/$/, '')}/danfse/${encodeURIComponent(chave)}`);
  if (ambiente) u.searchParams.set('ambiente', String(ambiente));
  const r = await fetch(u.toString());
  if (!r.ok) throw new Error(await r.text());
  return await r.blob();
}

export interface CancelarPayloadFlex {
  pedidoRegistroEvento?: { evento?: string };
  evento?: string;
  eventoXmlGZipB64?: string;
  pedidoRegistroEventoXmlGZipB64?: string;
  chaveAcesso?: string;
}

export async function cancelarNFSe(payload: CancelarPayloadFlex, certificateId: string, ambiente: 1 | 2 | number): Promise<unknown> {
  const url = `${LOCAL_API_BASE.replace(/\/$/, '')}/nfse/cancelar`;
  const r = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'X-Certificate-Id': certificateId,
      'X-Ambiente': String(ambiente),
      'Accept': 'application/json, text/plain, */*'
    },
    body: JSON.stringify(payload),
  });
  const ct = r.headers.get('content-type') || '';
  const text = await r.text();
  if (!r.ok) throw new Error(text || `Erro HTTP ${r.status}`);
  if (ct.includes('application/json')) {
    try { return JSON.parse(text); } catch { return { raw: text } as unknown; }
  }
  return { raw: text } as unknown;
}
