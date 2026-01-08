import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';

// Constantes para a API do ASAAS
const ASAAS_API_URL = process.env.NEXT_PUBLIC_ASAAS_BASE_URL || 'https://api-sandbox.asaas.com/v3';
const ASAAS_API_KEY = process.env.ASAAS_API_KEY || '$aact_hmlg_000MzkwODA2MWY2OGM3MWRlMDU2NWM3MzJlNzZmNGZhZGY6Ojg2NzFlYTE5LWRjMTktNDYyOS1iYWY4LWZjMzQ2ZDNhNmNiYjo6JGFhY2hfMjYxMDU5NDAtZDMwNy00MjI3LWFhYWYtODliNmVlMDdhNWQx';

/**
 * GET - Listar clientes do ASAAS
 * Permite buscar clientes com filtros
 */
export async function GET(request: NextRequest) {
  try {
    // Verificar autenticação
    const token = await getToken({ req: request });
    if (!token) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    // Obter parâmetros da URL
    const searchParams = request.nextUrl.searchParams;
    const queryParams = searchParams.toString();

    // Fazer requisição para a API do ASAAS
    const response = await fetch(`${ASAAS_API_URL}/customers?${queryParams}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'access-token': ASAAS_API_KEY
      }
    });

    // Verificar resposta
    if (!response.ok) {
      const errorData = await response.json();
      return NextResponse.json(
        { error: 'Erro ao listar clientes', errors: errorData.errors },
        { status: response.status }
      );
    }

    // Retornar dados
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Erro ao processar requisição de clientes:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

/**
 * POST - Criar novo cliente no ASAAS
 */
export async function POST(request: NextRequest) {
  try {
    // Verificar autenticação
    const token = await getToken({ req: request });
    if (!token) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    // Obter dados do corpo da requisição
    const dados = await request.json();

    // Fazer requisição para a API do ASAAS
    const response = await fetch(`${ASAAS_API_URL}/customers`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'access-token': ASAAS_API_KEY
      },
      body: JSON.stringify(dados)
    });

    // Verificar resposta
    if (!response.ok) {
      const errorData = await response.json();
      return NextResponse.json(
        { error: 'Erro ao criar cliente', errors: errorData.errors },
        { status: response.status }
      );
    }

    // Retornar dados
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Erro ao processar requisição de criação de cliente:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
