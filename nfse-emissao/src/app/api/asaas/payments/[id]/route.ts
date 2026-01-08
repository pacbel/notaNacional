import { NextRequest, NextResponse } from 'next/server';

// Constantes para a API do ASAAS
const ASAAS_API_URL = process.env.NEXT_PUBLIC_ASAAS_BASE_URL || 'https://api-sandbox.asaas.com/v3';
const ASAAS_API_KEY = process.env.ASAAS_API_KEY || '$aact_hmlg_000MzkwODA2MWY2OGM3MWRlMDU2NWM3MzJlNzZmNGZhZGY6Ojg2NzFlYTE5LWRjMTktNDYyOS1iYWY4LWZjMzQ2ZDNhNmNiYjo6JGFhY2hfMjYxMDU5NDAtZDMwNy00MjI3LWFhYWYtODliNmVlMDdhNWQx';

/**
 * Rota para obter detalhes de uma cobrança específica do ASAAS
 * Esta rota serve como proxy para a API do ASAAS, evitando problemas de CORS
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    
    // Construir a URL para a API do ASAAS
    const url = `${ASAAS_API_URL}/payments/${id}`;
    
    console.log(`Fazendo requisição para o ASAAS: ${url}`);
    
    // Fazer a requisição para a API do ASAAS
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'access-token': ASAAS_API_KEY
      }
    });
    
    // Verificar se a resposta foi bem-sucedida
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ errors: [{ description: 'Erro desconhecido' }] }));
      return NextResponse.json(
        { error: `Erro ao obter cobrança: ${errorData.errors?.[0]?.description || 'Erro desconhecido'}` },
        { status: response.status }
      );
    }
    
    // Retornar os dados da API do ASAAS
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Erro ao processar requisição para o ASAAS:', error);
    return NextResponse.json(
      { error: `Erro ao processar requisição: ${error.message || 'Erro desconhecido'}` },
      { status: 500 }
    );
  }
}
