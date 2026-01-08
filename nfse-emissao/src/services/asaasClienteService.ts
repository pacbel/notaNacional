/**
 * Serviço para integração com a API de Clientes do ASAAS
 * Documentação: https://docs.asaas.com/docs/criando-um-cliente
 */

// Constantes para a API do ASAAS
const ASAAS_API_URL = process.env.NEXT_PUBLIC_ASAAS_BASE_URL || 'https://api-sandbox.asaas.com/v3';
const ASAAS_API_KEY = process.env.ASAAS_API_KEY || '$aact_hmlg_000MzkwODA2MWY2OGM3MWRlMDU2NWM3MzJlNzZmNGZhZGY6Ojg2NzFlYTE5LWRjMTktNDYyOS1iYWY4LWZjMzQ2ZDNhNmNiYjo6JGFhY2hfMjYxMDU5NDAtZDMwNy00MjI3LWFhYWYtODliNmVlMDdhNWQx';

// Interface para o cliente do ASAAS
export interface AsaasCliente {
  id: string;
  name: string;
  email: string;
  phone: string;
  mobilePhone: string;
  cpfCnpj: string;
  postalCode: string;
  address: string;
  addressNumber: string;
  complement: string;
  province: string;
  externalReference: string;
  notificationDisabled: boolean;
  additionalEmails: string;
  municipalInscription: string;
  stateInscription: string;
  observations: string;
}

export interface AsaasClienteResponse {
  object: string;
  hasMore: boolean;
  totalCount: number;
  limit: number;
  offset: number;
  data: AsaasCliente[];
}

/**
 * Busca um cliente no ASAAS pelo CNPJ
 * @param cnpj CNPJ do cliente a ser buscado (apenas números)
 * @returns Cliente encontrado ou null se não existir
 */
export async function buscarClientePorCnpj(cnpj: string): Promise<AsaasCliente | null> {
  try {
    // Parâmetros para a consulta
    const params = new URLSearchParams();
    params.append('cpfCnpj', cnpj);
    
    console.log(`Buscando cliente com CNPJ: ${cnpj}`);
    
    // Fazemos a requisição diretamente para a API do ASAAS
    const response = await fetch(`${ASAAS_API_URL}/customers?${params.toString()}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'access-token': ASAAS_API_KEY
      }
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ errors: [{ description: 'Erro desconhecido' }] }));
      throw new Error(`Erro ao buscar cliente: ${errorData.errors?.[0]?.description || 'Erro desconhecido'}`);
    }

    const clientesResponse: AsaasClienteResponse = await response.json();
    
    // Verifica se encontrou algum cliente com o CNPJ informado
    if (clientesResponse.totalCount > 0) {
      return clientesResponse.data[0];
    }
    
    return null;
  } catch (error: unknown) {
    console.error('Erro ao buscar cliente:', error);
    const msg = error instanceof Error ? error.message : 'Erro desconhecido';
    throw new Error(`Erro ao buscar cliente no ASAAS: ${msg}`);
  }
}

/**
 * Cria um novo cliente no ASAAS
 * @param dados Dados do cliente a ser criado
 * @returns Cliente criado
 */
export async function criarCliente(dados: {
  name: string;
  email: string;
  phone?: string;
  mobilePhone?: string;
  cpfCnpj: string;
  postalCode: string;
  address: string;
  addressNumber: string;
  complement?: string;
  province: string;
  externalReference?: string;
  notificationDisabled?: boolean;
  additionalEmails?: string;
  municipalInscription?: string;
  stateInscription?: string;
  observations?: string;
}): Promise<AsaasCliente> {
  try {
    console.log(`Criando cliente no ASAAS com CNPJ: ${dados.cpfCnpj}`);
    
    // Validar dados obrigatórios
    if (!dados.name || !dados.email || !dados.cpfCnpj) {
      throw new Error('Dados obrigatórios faltando: Nome, Email e CNPJ são obrigatórios');
    }
    
    // Fazemos a requisição diretamente para a API do ASAAS
    const response = await fetch(`${ASAAS_API_URL}/customers`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'access-token': ASAAS_API_KEY
      },
      body: JSON.stringify(dados)
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Erro ao criar cliente: ${errorData.errors?.[0]?.description || 'Erro desconhecido'}`);
    }

    const clienteCriado: AsaasCliente = await response.json();
    console.log(`Cliente criado com sucesso no ASAAS. ID: ${clienteCriado.id}`);
    return clienteCriado;
  } catch (error: unknown) {
    console.error('Erro ao criar cliente:', error);
    const msg = error instanceof Error ? error.message : 'Erro desconhecido';
    throw new Error(`Erro ao criar cliente no ASAAS: ${msg}`);
  }
}

/**
 * Integra um prestador com o ASAAS, verificando se já existe ou criando um novo cliente
 * @param prestador Dados do prestador a ser integrado
 * @returns ID do cliente no ASAAS
 */
export async function integrarPrestadorAsaas(prestador: {
  id: string;
  cnpj: string;
  razaoSocial: string;
  email: string;
  telefone?: string;
  endereco: string;
  numero: string;
  complemento?: string;
  bairro: string;
  cep: string;
  uf: string;
  inscricaoMunicipal: string;
}): Promise<string> {
  try {
    console.log(`Iniciando integração do prestador ${prestador.id} com CNPJ ${prestador.cnpj}`);
    
    // Primeiro, verifica se o cliente já existe no ASAAS
    const clienteExistente = await buscarClientePorCnpj(prestador.cnpj);
    
    if (clienteExistente) {
      console.log(`Cliente já existe no ASAAS com ID: ${clienteExistente.id}`);
      return clienteExistente.id;
    }
    
    console.log('Cliente não encontrado no ASAAS. Criando novo cliente...');
    
    // Validar dados obrigatórios antes de enviar para a API
    if (!prestador.cnpj || !prestador.razaoSocial || !prestador.email) {
      throw new Error('Dados obrigatórios faltando: CNPJ, Razão Social e Email são obrigatórios');
    }
    
    // Se não existe, cria um novo cliente
    const novoCliente = await criarCliente({
      name: prestador.razaoSocial,
      email: prestador.email,
      phone: prestador.telefone || '',
      cpfCnpj: prestador.cnpj,
      postalCode: prestador.cep,
      address: prestador.endereco,
      addressNumber: prestador.numero,
      complement: prestador.complemento || '',
      province: prestador.bairro,
      externalReference: prestador.id,
      municipalInscription: prestador.inscricaoMunicipal,
      stateInscription: '',
      observations: 'Cliente integrado automaticamente pelo sistema NFSe'
    });
    
    if (!novoCliente || !novoCliente.id) {
      throw new Error('Falha ao criar cliente no ASAAS: resposta inválida da API');
    }
    
    console.log(`Novo cliente criado no ASAAS com ID: ${novoCliente.id}`);
    return novoCliente.id;
  } catch (error: unknown) {
    console.error('Erro ao integrar prestador com ASAAS:', error);
    const msg = error instanceof Error ? error.message : 'Erro desconhecido';
    throw new Error(`Erro ao integrar prestador com ASAAS: ${msg}`);
  }
}
