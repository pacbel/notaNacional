/**
 * Utilitário para classificar mensagens de erro da API de NFSe
 * Baseado no Manual de Integração da Prefeitura
 */

// Tipos de erro possíveis
export type ErrorType = 
  | 'VALIDATION' // Erros de validação de dados
  | 'AUTHENTICATION' // Erros de autenticação
  | 'BUSINESS' // Erros de regras de negócio
  | 'TECHNICAL' // Erros técnicos/sistema
  | 'COMMUNICATION' // Erros de comunicação
  | 'UNKNOWN'; // Erros desconhecidos

// Interface para erro classificado
export interface ClassifiedError {
  code: string;
  message: string;
  type: ErrorType;
  description: string;
  suggestion?: string;
}

// Mapeamento de códigos de erro conhecidos
const ERROR_CODES: Record<string, Partial<ClassifiedError>> = {
  // Erros de validação
  'E001': { type: 'VALIDATION', description: 'Erro na validação dos dados enviados' },
  'E002': { type: 'VALIDATION', description: 'Campo obrigatório não informado' },
  'E003': { type: 'VALIDATION', description: 'Formato de campo inválido' },
  'E004': { type: 'VALIDATION', description: 'Tamanho de campo excedido' },
  'E005': { type: 'VALIDATION', description: 'Valor inválido para o campo' },
  'E006': { type: 'VALIDATION', description: 'Inscrição Municipal não informada' },
  'E007': { type: 'VALIDATION', description: 'CNPJ não informado' },
  'E008': { type: 'VALIDATION', description: 'Inscrição Municipal inválida' },
  'E009': { type: 'VALIDATION', description: 'CNPJ inválido' },
  'E010': { type: 'VALIDATION', description: 'Inscrição Municipal não encontrada na base de dados' },
  'E011': { type: 'VALIDATION', description: 'CNPJ não encontrado na base de dados' },
  'E012': { type: 'VALIDATION', description: 'Inscrição Municipal não vinculada ao CNPJ informado' },
  'E013': { type: 'VALIDATION', description: 'Base de cálculo inválida' },
  'E014': { type: 'VALIDATION', description: 'Valor do ISS inválido' },
  'E015': { type: 'VALIDATION', description: 'Alíquota inválida' },
  
  // Erros de autenticação
  'E100': { type: 'AUTHENTICATION', description: 'Erro de autenticação', suggestion: 'Verifique suas credenciais' },
  'E101': { type: 'AUTHENTICATION', description: 'Certificado digital inválido', suggestion: 'Verifique seu certificado digital' },
  'E102': { type: 'AUTHENTICATION', description: 'Certificado digital expirado', suggestion: 'Renove seu certificado digital' },
  'E103': { type: 'AUTHENTICATION', description: 'Usuário não autorizado para esta operação', suggestion: 'Contate o administrador do sistema' },
  'E104': { type: 'AUTHENTICATION', description: 'Token inválido ou expirado', suggestion: 'Faça login novamente para obter um novo token' },
  'E105': { type: 'AUTHENTICATION', description: 'Acesso negado', suggestion: 'Verifique suas permissões' },
  
  // Erros de regras de negócio
  'E120': { type: 'BUSINESS', description: 'RPS já processado' },
  'E121': { type: 'BUSINESS', description: 'RPS não encontrado' },
  'E122': { type: 'BUSINESS', description: 'Lote não encontrado' },
  'E123': { type: 'BUSINESS', description: 'Serviço inválido para o prestador' },
  'E124': { type: 'BUSINESS', description: 'Regime tributário incompatível' },
  'E125': { type: 'BUSINESS', description: 'Nota fiscal não pode ser cancelada', suggestion: 'Verifique os requisitos para cancelamento' },
  'E126': { type: 'BUSINESS', description: 'Nota fiscal já cancelada' },
  'E127': { type: 'BUSINESS', description: 'Nota fiscal não encontrada' },
  'E128': { type: 'BUSINESS', description: 'Código de serviço inválido' },
  'E129': { type: 'BUSINESS', description: 'Município não permitido' },
  'E130': { type: 'BUSINESS', description: 'Natureza da operação inválida' },
  'E131': { type: 'BUSINESS', description: 'Valor dos serviços inválido' },
  'E132': { type: 'BUSINESS', description: 'Alíquota inválida' },
  'E30': { type: 'BUSINESS', description: 'Item da Lista de Serviço inexistente', suggestion: 'Verifique o código do serviço informado conforme a tabela da LC 116/2003' },
  'E133': { type: 'BUSINESS', description: 'Data final da pesquisa não pode ser superior à data de hoje', suggestion: 'Ajuste o período de consulta para que a data final seja no máximo o dia atual' },
  'E134': { type: 'BUSINESS', description: 'Período de consulta muito extenso', suggestion: 'Reduza o período de consulta para no máximo 31 dias' },
  'E135': { type: 'BUSINESS', description: 'Data inicial maior que a data final', suggestion: 'Verifique as datas informadas' },
  'E136': { type: 'BUSINESS', description: 'Prestador não autorizado a emitir NFS-e', suggestion: 'Entre em contato com a Prefeitura' },
  'E137': { type: 'BUSINESS', description: 'Prestador com cadastro incompleto', suggestion: 'Atualize o cadastro junto à Prefeitura' },
  'E138': { type: 'BUSINESS', description: 'Prestador com irregularidades fiscais', suggestion: 'Regularize sua situação fiscal' },
  'E139': { type: 'BUSINESS', description: 'RPS com número já utilizado', suggestion: 'Utilize outro número de RPS' },
  'E140': { type: 'BUSINESS', description: 'RPS com número fora da sequência', suggestion: 'Verifique a sequência de numeração dos RPS' },
  'E141': { type: 'BUSINESS', description: 'Tomador com CPF/CNPJ inválido', suggestion: 'Verifique o CPF/CNPJ do tomador' },
  'E142': { type: 'BUSINESS', description: 'Tomador com inscrição municipal inválida', suggestion: 'Verifique a inscrição municipal do tomador' },
  'E143': { type: 'BUSINESS', description: 'Tomador com endereço incompleto', suggestion: 'Complete o endereço do tomador' },
  'E144': { type: 'BUSINESS', description: 'Tomador com e-mail inválido', suggestion: 'Corrija o e-mail do tomador' },
  'E145': { type: 'BUSINESS', description: 'Valor da retenção de ISS inválido', suggestion: 'Verifique o valor da retenção de ISS' },
  'E146': { type: 'BUSINESS', description: 'Valor da dedução inválido', suggestion: 'Verifique o valor da dedução' },
  'E147': { type: 'BUSINESS', description: 'Valor do desconto incondicionado inválido', suggestion: 'Verifique o valor do desconto incondicionado' },
  'E148': { type: 'BUSINESS', description: 'Valor do desconto condicionado inválido', suggestion: 'Verifique o valor do desconto condicionado' },
  'E149': { type: 'BUSINESS', description: 'Valor das retenções federais inválido', suggestion: 'Verifique os valores das retenções federais' },
  'E150': { type: 'BUSINESS', description: 'Valor líquido da nota inválido', suggestion: 'Verifique o valor líquido da nota' },
  
  // Erros técnicos
  'E200': { type: 'TECHNICAL', description: 'Erro interno do servidor', suggestion: 'Tente novamente mais tarde' },
  'E201': { type: 'TECHNICAL', description: 'Timeout na operação', suggestion: 'Tente novamente mais tarde' },
  'E202': { type: 'TECHNICAL', description: 'Erro no processamento do XML', suggestion: 'Verifique a estrutura do XML enviado' },
  'E203': { type: 'TECHNICAL', description: 'Erro na geração da NFSe', suggestion: 'Verifique os dados enviados e tente novamente' },
  'E204': { type: 'TECHNICAL', description: 'Erro na conexão com o banco de dados', suggestion: 'Tente novamente mais tarde' },
  'E205': { type: 'TECHNICAL', description: 'Erro na assinatura digital', suggestion: 'Verifique o certificado digital utilizado' },
  'E206': { type: 'TECHNICAL', description: 'Erro na validação do schema XML', suggestion: 'Verifique a estrutura do XML enviado' },
  'E207': { type: 'TECHNICAL', description: 'Erro na conversão de dados', suggestion: 'Verifique o formato dos dados enviados' },
  'E208': { type: 'TECHNICAL', description: 'Erro na geração do PDF', suggestion: 'Tente novamente mais tarde' },
  'E209': { type: 'TECHNICAL', description: 'Erro no envio de e-mail', suggestion: 'Verifique o e-mail informado' },
  
  // Erros de comunicação
  'E300': { type: 'COMMUNICATION', description: 'Erro de comunicação com o servidor da prefeitura', suggestion: 'Verifique sua conexão e tente novamente' },
  'E301': { type: 'COMMUNICATION', description: 'Erro na transmissão de dados', suggestion: 'Tente novamente mais tarde' },
  'E302': { type: 'COMMUNICATION', description: 'Serviço temporariamente indisponível', suggestion: 'Tente novamente mais tarde' },
  'E303': { type: 'COMMUNICATION', description: 'Tempo limite de conexão excedido', suggestion: 'Verifique sua conexão e tente novamente' },
  'E304': { type: 'COMMUNICATION', description: 'Erro no protocolo de comunicação', suggestion: 'Verifique a versão do protocolo utilizado' },
  'E305': { type: 'COMMUNICATION', description: 'Erro na resposta do servidor', suggestion: 'Tente novamente mais tarde' },
  'E306': { type: 'COMMUNICATION', description: 'Erro no formato da mensagem', suggestion: 'Verifique o formato da mensagem enviada' },
  'E307': { type: 'COMMUNICATION', description: 'Erro na codificação dos dados', suggestion: 'Verifique a codificação dos dados enviados' },
  'E308': { type: 'COMMUNICATION', description: 'Erro no canal de comunicação', suggestion: 'Tente novamente mais tarde' },
  'E309': { type: 'COMMUNICATION', description: 'Erro no redirecionamento da requisição', suggestion: 'Verifique a URL utilizada' }
};

/**
 * Classifica um erro com base no código e mensagem
 * @param code Código do erro
 * @param message Mensagem do erro
 * @returns Erro classificado com tipo, descrição e sugestão
 */
export function classifyError(code: string, message: string): ClassifiedError {
  // Verificar se o código existe no mapeamento
  if (ERROR_CODES[code]) {
    return {
      code,
      message,
      type: ERROR_CODES[code].type || 'UNKNOWN',
      description: ERROR_CODES[code].description || 'Erro não especificado',
      suggestion: ERROR_CODES[code].suggestion
    };
  }
  
  // Classificação baseada em padrões de código
  if (code.startsWith('E0')) {
    return {
      code,
      message,
      type: 'VALIDATION',
      description: 'Erro de validação de dados',
      suggestion: 'Verifique os dados enviados'
    };
  }
  
  if (code.startsWith('E1')) {
    return {
      code,
      message,
      type: 'BUSINESS',
      description: 'Erro de regra de negócio',
      suggestion: 'Verifique as regras de negócio aplicáveis'
    };
  }
  
  if (code.startsWith('E2')) {
    return {
      code,
      message,
      type: 'TECHNICAL',
      description: 'Erro técnico no sistema',
      suggestion: 'Contate o suporte técnico'
    };
  }
  
  if (code.startsWith('E3')) {
    return {
      code,
      message,
      type: 'COMMUNICATION',
      description: 'Erro de comunicação',
      suggestion: 'Verifique sua conexão e tente novamente'
    };
  }
  
  // Erro desconhecido
  return {
    code,
    message,
    type: 'UNKNOWN',
    description: 'Erro não catalogado',
    suggestion: 'Contate o suporte técnico'
  };
}

/**
 * Extrai código e mensagem de erro de um XML de resposta
 * @param xmlString String XML contendo a resposta
 * @returns Objeto com código e mensagem de erro, ou null se não encontrar
 */
export function extractErrorFromXml(xmlString: string): { code: string, message: string } | null {
  // Verificar se o XML contém mensagem de erro (formato padrão)
  const mensagemErroMatch = xmlString.match(/<MensagemRetorno>[\s\S]*?<Codigo>([^<]+)<\/Codigo>[\s\S]*?<Mensagem>([^<]+)<\/Mensagem>[\s\S]*?<\/MensagemRetorno>/i);
  
  if (mensagemErroMatch) {
    return {
      code: mensagemErroMatch[1],
      message: mensagemErroMatch[2]
    };
  }
  
  // Verificar formato alternativo (sem tags aninhadas)
  const alternativeMatch = xmlString.match(/<Codigo>([^<]+)<\/Codigo>[\s\S]*?<Mensagem>([^<]+)<\/Mensagem>/i);
  
  if (alternativeMatch) {
    return {
      code: alternativeMatch[1],
      message: alternativeMatch[2]
    };
  }
  
  // Verificar se contém a tag ListaMensagemRetorno
  if (xmlString.includes('<ListaMensagemRetorno>')) {
    // Tentar extrair o primeiro erro da lista
    const listaErroMatch = xmlString.match(/<ListaMensagemRetorno>[\s\S]*?<MensagemRetorno>[\s\S]*?<Codigo>([^<]+)<\/Codigo>[\s\S]*?<Mensagem>([^<]+)<\/Mensagem>[\s\S]*?<\/MensagemRetorno>/i);
    
    if (listaErroMatch) {
      return {
        code: listaErroMatch[1],
        message: listaErroMatch[2]
      };
    }
    
    // Se não conseguir extrair detalhes, retornar erro genérico
    return {
      code: 'ERRO',
      message: 'Erro na validação da NFSe'
    };
  }
  
  return null;
}

/**
 * Verifica se um XML de resposta contém erro
 * @param xmlString String XML contendo a resposta
 * @returns Erro classificado ou null se não houver erro
 */
export function checkXmlForError(xmlString: string): ClassifiedError | null {
  const errorInfo = extractErrorFromXml(xmlString);
  
  if (errorInfo) {
    return classifyError(errorInfo.code, errorInfo.message);
  }
  
  return null;
}
