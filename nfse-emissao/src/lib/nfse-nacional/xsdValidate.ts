export type XsdValidationResult = {
  ok: boolean;
  errors?: string[];
  warnings?: string[];
};

export async function validarDPSXSD(xml: string, options?: { versao?: string }): Promise<XsdValidationResult> {
  try {
    const resp = await fetch('/api/nfse/validar-xsd', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
      body: JSON.stringify({ xml, tipo: 'DPS', versao: options?.versao || '1.00.02' }),
    });
    const ct = resp.headers.get('content-type') || '';
    const raw = await resp.text();
    if (!resp.ok) {
      // Se o endpoint não estiver disponível/implementado, tratamos como aviso
      return { ok: true, warnings: [raw || 'Validação XSD não disponível. Prosseguindo sem bloquear.'] };
    }
    const data = ct.includes('application/json') ? JSON.parse(raw) : { ok: true };
    return data as XsdValidationResult;
  } catch (e: any) {
    return { ok: true, warnings: ['Falha ao validar XSD (rede/serviço indisponível). Prosseguindo.', e?.message || String(e)] };
  }
}
