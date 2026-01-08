/**
 * Serviço para integração com a API do ASAAS
 * Documentação: https://docs.asaas.com/docs/visao-geral
 */

// Constantes para a API do ASAAS
const ASAAS_API_URL = process.env.NEXT_PUBLIC_ASAAS_BASE_URL || 'https://api-sandbox.asaas.com/v3';
const ASAAS_API_KEY = process.env.ASAAS_API_KEY || '$aact_hmlg_000MzkwODA2MWY2OGM3MWRlMDU2NWM3MzJlNzZmNGZhZGY6Ojg2NzFlYTE5LWRjMTktNDYyOS1iYWY4LWZjMzQ2ZDNhNmNiYjo6JGFhY2hfMjYxMDU5NDAtZDMwNy00MjI3LWFhYWYtODliNmVlMDdhNWQx';

// Tipos para as cobranças do ASAAS
export interface AsaasCobranca {
  id: string;
  dateCreated: string;
  customer: string;
  dueDate: string;
  value: number;
  netValue: number;
  description: string;
  billingType: string;
  status: string;
  invoiceUrl: string;
  bankSlipUrl?: string;
  invoiceNumber?: string;
  externalReference?: string;
  deleted: boolean;
  postalService: boolean;
  anticipated: boolean;
  paymentDate?: string;
  clientPaymentDate?: string;
  creditDate?: string;
  estimatedCreditDate?: string;
  lastInvoiceViewedDate?: string;
  lastBankSlipViewedDate?: string;
  discount?: {
    value: number;
    dueDateLimitDays: number;
    type: string;
  };
  fine?: {
    value: number;
    type: string;
  };
  interest?: {
    value: number;
    type: string;
  };
}

export interface AsaasCobrancaResponse {
  object: string;
  hasMore: boolean;
  totalCount: number;
  limit: number;
  offset: number;
  data: AsaasCobranca[];
}

// Função para listar cobranças de um cliente (prestador) pelo CNPJ
export async function listarCobrancasPorCnpj(
  cnpj: string, 
  dataInicio?: string, 
  dataFim?: string, 
  parametrosAdicionais?: URLSearchParams
): Promise<AsaasCobrancaResponse> {
  try {
    // Parâmetros para a consulta
    const params = new URLSearchParams();
    params.append('customer', cnpj);
    
    if (dataInicio) {
      params.append('dueDate[ge]', dataInicio);
    }
    
    if (dataFim) {
      params.append('dueDate[le]', dataFim);
    }
    
    // Adicionar parâmetros adicionais (paginação, filtros, etc.)
    if (parametrosAdicionais) {
      parametrosAdicionais.forEach((valor, chave) => {
        params.append(chave, valor);
      });
    }
    
    console.log(`Fazendo requisição para: ${ASAAS_API_URL}/payments?${params.toString()}`);
    
    // Fazemos a requisição para a API do ASAAS via servidor para evitar problemas de CORS
    const response = await fetch(`/api/asaas/payments?${params.toString()}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ errors: [{ description: 'Erro desconhecido' }] }));
      throw new Error(`Erro ao listar cobranças: ${errorData.errors?.[0]?.description || 'Erro desconhecido'}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Erro ao listar cobranças:', error);
    throw error;
  }
}

// Função para obter os detalhes de uma cobrança pelo ID
export async function obterCobranca(id: string): Promise<AsaasCobranca> {
  try {
    const response = await fetch(`/api/asaas/payments/${id}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Erro ao obter cobrança: ${errorData.error || errorData.errors?.[0]?.description || 'Erro desconhecido'}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Erro ao obter cobrança:', error);
    throw error;
  }
}

// Função para criar uma nova cobrança
export async function criarCobranca(dados: {
  customer: string;
  billingType: string;
  dueDate: string;
  value: number;
  description: string;
  externalReference?: string;
}): Promise<AsaasCobranca> {
  try {
    const response = await fetch(`${ASAAS_API_URL}/payments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'access-token': ASAAS_API_KEY
      },
      body: JSON.stringify(dados)
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Erro ao criar cobrança: ${errorData.errors?.[0]?.description || 'Erro desconhecido'}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Erro ao criar cobrança:', error);
    throw error;
  }
}

// Função para obter a URL do boleto para pagamento
export async function obterUrlBoleto(cobrancaId: string): Promise<string> {
  try {
    const cobranca = await obterCobranca(cobrancaId);
    
    if (!cobranca.bankSlipUrl) {
      throw new Error('Esta cobrança não possui boleto disponível');
    }
    
    return cobranca.bankSlipUrl;
  } catch (error) {
    console.error('Erro ao obter URL do boleto:', error);
    throw error;
  }
}

// Função para gerar o link de pagamento com cartão de crédito
export async function gerarLinkPagamentoCartao(cobrancaId: string): Promise<string> {
  try {
    const response = await fetch(`${ASAAS_API_URL}/payments/${cobrancaId}/identificationField`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'access-token': ASAAS_API_KEY
      }
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Erro ao gerar link de pagamento: ${errorData.errors?.[0]?.description || 'Erro desconhecido'}`);
    }

    const data = await response.json();
    return `${ASAAS_API_URL.replace('/api/v3', '')}/checkout/${data.identificationField}`;
  } catch (error) {
    console.error('Erro ao gerar link de pagamento:', error);
    throw error;
  }
}

// Interface para pagamento com cartão de crédito
export interface CartaoCreditoPayload {
  customer: string;
  billingType: string;
  value: number;
  dueDate: string;
  description: string;
  creditCard: {
    holderName: string;
    number: string;
    expiryMonth: string;
    expiryYear: string;
    ccv: string;
  };
  creditCardHolderInfo: {
    name: string;
    email: string;
    cpfCnpj: string;
    postalCode: string;
    addressNumber: string;
    addressComplement?: string;
    phone: string;
  };
}

// Função para processar pagamento com cartão de crédito
export async function processarPagamentoCartao(dados: CartaoCreditoPayload) {
  try {
    const response = await fetch('/api/asaas/payments/cartao', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(dados)
    });

    if (!response.ok) {
      const errorData = await response.json();
      return {
        success: false,
        message: `Erro ao processar pagamento: ${errorData.error || errorData.errors?.[0]?.description || 'Erro desconhecido'}`
      };
    }

    const result = await response.json();
    return {
      success: true,
      data: result
    };
  } catch (error: unknown) {
    console.error('Erro ao processar pagamento:', error);
    return {
      success: false,
      message: (error instanceof Error ? error.message : 'Erro ao processar pagamento. Tente novamente mais tarde.')
    };
  }
}

// Função para sincronizar as cobranças do ASAAS com o banco de dados local
export async function sincronizarCobrancas(prestadorId: string, cnpj: string): Promise<void> {
  try {
    // Obter cobranças do ASAAS
    const cobrancasAsaas = await listarCobrancasPorCnpj(cnpj);
    
    // Aqui você implementaria a lógica para sincronizar com o banco de dados local
    // usando o Prisma para criar/atualizar as cobranças no banco de dados
    
    console.log(`Sincronizadas ${cobrancasAsaas.data.length} cobranças para o prestador ${prestadorId}`);
  } catch (error) {
    console.error('Erro ao sincronizar cobranças:', error);
    throw error;
  }
}

// Função para traduzir o status da cobrança para português
export function traduzirStatusCobranca(status: string): string {
  const statusMap: Record<string, string> = {
    'PENDING': 'Pendente',
    'RECEIVED': 'Recebida',
    'CONFIRMED': 'Confirmada',
    'OVERDUE': 'Vencida',
    'REFUNDED': 'Estornada',
    'RECEIVED_IN_CASH': 'Recebida em dinheiro',
    'REFUND_REQUESTED': 'Estorno solicitado',
    'CHARGEBACK_REQUESTED': 'Chargeback solicitado',
    'CHARGEBACK_DISPUTE': 'Em disputa de chargeback',
    'AWAITING_CHARGEBACK_REVERSAL': 'Aguardando reversão de chargeback',
    'DUNNING_REQUESTED': 'Recuperação solicitada',
    'DUNNING_RECEIVED': 'Recuperada',
    'AWAITING_RISK_ANALYSIS': 'Aguardando análise de risco'
  };
  
  return statusMap[status] || status;
}

// Função para formatar valores monetários
export function formatarValor(valor: number): string {
  return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

// Função para formatar datas
export function formatarData(data: string): string {
  // Garantir que a data seja interpretada corretamente, preservando o dia
  const [ano, mes, dia] = data.split('T')[0].split('-');
  return `${dia}/${mes}/${ano}`;
}
