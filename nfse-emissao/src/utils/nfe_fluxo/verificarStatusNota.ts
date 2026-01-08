/**
 * Utilitário para verificar o status da nota fiscal com base no XML
 */

/**
 * Interface para os dados de cancelamento extraídos do XML
 */
interface DadosCancelamento {
  codigoCancelamento: string;
  motivoCancelamento: string;
  dataCancelamento: string;
}

/**
 * Verifica o status da nota fiscal com base no XML recebido e atualiza via API
 * @param notaId ID da nota fiscal
 * @param xmlContent Conteúdo do XML da NFSe
 * @returns Objeto com o resultado da operação
 */
export async function verificarStatusNota(notaId: string, xmlContent: string) {
  try {
    // Verificar se o XML é válido
    if (!xmlContent) {
      return {
        success: false,
        message: 'XML inválido ou vazio',
        errors: ['O conteúdo do XML não foi fornecido']
      };
    }

    // Verificar se existe a tag Nfse
    const temNfse = xmlContent.includes('<Nfse>');
    
    // Verificar se existe a tag NfseCancelamento
    const temNfseCancelamento = xmlContent.includes('<NfseCancelamento>');
    
    // Determinar o status da nota
    let statusNfse = '';
    let dadosCancelamento: DadosCancelamento | null = null;
    
    if (temNfse && !temNfseCancelamento) {
      // Se tem apenas a tag Nfse, a nota está autorizada
      statusNfse = 'autorizada';
    } else if (temNfse && temNfseCancelamento) {
      // Se tem ambas as tags, a nota está cancelada
      statusNfse = 'cancelada';
      
      // Extrair os dados de cancelamento
      dadosCancelamento = extrairDadosCancelamento(xmlContent);
    } else {
      // Se não tem a tag Nfse, o XML não é válido para NFSe
      return {
        success: false,
        message: 'XML inválido para NFSe',
        errors: ['O XML não contém a tag Nfse']
      };
    }
    
    // Preparar os dados para enviar à API
    const dadosAtualizacao = {
      notaId,
      statusNfse,
      nfseXML: xmlContent
    };
    
    // Adicionar dados de cancelamento se aplicável
    if (statusNfse === 'cancelada' && dadosCancelamento) {
      // Extrair a tag NfseCancelamento
      const xmlCancelamento = extrairXmlCancelamento(xmlContent);
      
      Object.assign(dadosAtualizacao, {
        xmlCancelamento,
        codigoCancelamento: dadosCancelamento.codigoCancelamento,
        motivoCancelamento: dadosCancelamento.motivoCancelamento,
        dataCancelamento: dadosCancelamento.dataCancelamento
      });
    }
    
    // Fazer a chamada à API para atualizar os dados no servidor
    const response = await fetch('/api/nfse/atualizar-status', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(dadosAtualizacao)
    });
    
    if (!response.ok) {
      throw new Error(`Erro ao atualizar status: ${await response.text()}`);
    }
    
    const resultado = await response.json();
    
    return {
      success: true,
      message: `Nota fiscal ${statusNfse} com sucesso`,
      statusNfse,
      ...resultado
    };
  } catch (error) {
    console.error('[verificarStatusNota] Erro ao atualizar status da nota:', error);
    return {
      success: false,
      message: 'Erro ao atualizar status da nota',
      errors: [error instanceof Error ? error.message : 'Erro desconhecido']
    };
  }
}

/**
 * Extrai os dados de cancelamento do XML
 * @param xmlContent Conteúdo do XML
 * @returns Objeto com os dados de cancelamento ou null se não encontrados
 */
function extrairDadosCancelamento(xmlContent: string): DadosCancelamento | null {
  try {
    // Extrair o código de cancelamento
    const codigoCancelamentoMatch = xmlContent.match(/<Codigo>([^<]+)<\/Codigo>/);
    
    // Extrair o motivo de cancelamento
    const motivoCancelamentoMatch = xmlContent.match(/<Descricao>([^<]+)<\/Descricao>/);
    
    // Extrair a data de cancelamento
    const dataCancelamentoMatch = xmlContent.match(/<DataHora>([^<]+)<\/DataHora>/);
    
    if (!codigoCancelamentoMatch || !motivoCancelamentoMatch || !dataCancelamentoMatch) {
      console.error('[extrairDadosCancelamento] Dados de cancelamento não encontrados no XML');
      return null;
    }
    
    return {
      codigoCancelamento: codigoCancelamentoMatch[1],
      motivoCancelamento: motivoCancelamentoMatch[1],
      dataCancelamento: dataCancelamentoMatch[1]
    };
  } catch (error) {
    console.error('[extrairDadosCancelamento] Erro ao extrair dados de cancelamento:', error);
    return null;
  }
}

/**
 * Extrai a tag NfseCancelamento do XML
 * @param xmlContent Conteúdo do XML
 * @returns Conteúdo da tag NfseCancelamento ou string vazia se não encontrada
 */
function extrairXmlCancelamento(xmlContent: string): string {
  try {
    // Extrair o conteúdo da tag NfseCancelamento (incluindo a tag)
    const match = xmlContent.match(/<NfseCancelamento>[\s\S]*?<\/NfseCancelamento>/);
    
    if (!match) {
      console.error('[extrairXmlCancelamento] Tag NfseCancelamento não encontrada no XML');
      return '';
    }
    
    return match[0];
  } catch (error) {
    console.error('[extrairXmlCancelamento] Erro ao extrair tag NfseCancelamento:', error);
    return '';
  }
}
