import { NextRequest, NextResponse } from 'next/server';
import { consultarStatusServico, type AmbienteTipo } from '@/services/nfe/statusServico';

// Proxy server-side para consultar o status do serviço da SEFAZ (NF-e)
// Evita problemas de CORS/mixed content no browser e centraliza a lógica.
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const ufOrigem = (searchParams.get('ufOrigem') || 'MG').toUpperCase();
  const ufDestino = (searchParams.get('ufDestino') || 'MG').toUpperCase();
  const versao = searchParams.get('versao') || '4.00';
  const ambienteParam = Number(searchParams.get('ambiente') || 2);
  const ambiente = (ambienteParam === 1 ? 1 : 2) as AmbienteTipo; // default 2 (Homologação)

  const result = await consultarStatusServico({ ufOrigem, ufDestino, versao, ambiente });
  // Mantemos status 200 para facilitar exibição no front, com campo ok indicando sucesso.
  return NextResponse.json(result, { status: 200 });
}
