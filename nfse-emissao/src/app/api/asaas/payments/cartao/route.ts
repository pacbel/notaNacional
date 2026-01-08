import { NextRequest, NextResponse } from 'next/server';

// Constantes para a API do ASAAS
const ASAAS_API_URL = process.env.NEXT_PUBLIC_ASAAS_BASE_URL || 'https://api-sandbox.asaas.com/v3';
const ASAAS_API_KEY = process.env.ASAAS_API_KEY || '$aact_hmlg_000MzkwODA2MWY2OGM3MWRlMDU2NWM3MzJlNzZmNGZhZGY6Ojg2NzFlYTE5LWRjMTktNDYyOS1iYWY4LWZjMzQ2ZDNhNmNiYjo6JGFhY2hfMjYxMDU5NDAtZDMwNy00MjI3LWFhYWYtODliNmVlMDdhNWQx';

/**
 * Rota para processar pagamento com cartão de crédito via ASAAS
 * Esta rota serve como proxy para a API do ASAAS, evitando problemas de CORS
 * 
 * Documentação: https://docs.asaas.com/reference/criar-cobranca-com-cartao-de-credito
 */
export async function POST(request: NextRequest) {
  try {
    // Obter os dados do corpo da requisição
    const dados = await request.json();
    
    // Verificar se há um ID de cobrança existente
    const cobrancaId = dados.id;
    
    if (!cobrancaId) {
      return NextResponse.json(
        { error: 'ID da cobrança não fornecido' },
        { status: 400 }
      );
    }
    
    // Remover o ID da cobrança dos dados a serem enviados
    const { id, ...dadosPagamento } = dados;
    
    // Construir a URL para a API do ASAAS para pagamento de cobrança existente
    const url = `${ASAAS_API_URL}/payments/${cobrancaId}/payWithCreditCard`;
    
    console.log(`Fazendo requisição para o ASAAS: ${url}`);
    console.log('Dados de pagamento:', JSON.stringify(dadosPagamento));
    
    // Fazer a requisição para a API do ASAAS
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'access-token': ASAAS_API_KEY
      },
      body: JSON.stringify({
        creditCard: dadosPagamento.creditCard,
        creditCardHolderInfo: dadosPagamento.creditCardHolderInfo
      })
    });
    
    // Verificar se a resposta foi bem-sucedida
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ errors: [{ description: 'Erro desconhecido' }] }));
      return NextResponse.json(
        { error: `Erro ao processar pagamento: ${errorData.errors?.[0]?.description || 'Erro desconhecido'}` },
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
