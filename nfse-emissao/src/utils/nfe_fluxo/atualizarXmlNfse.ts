/**
 * Função para atualizar o XML da NFSe no banco de dados
 */

import { DadosNfse } from './processarXmlNfse';

interface AtualizarXmlNfseResponse {
  success: boolean;
  message?: string;
  errors?: string[];
  data?: unknown;
}

/**
 * Atualiza o XML da NFSe no banco de dados e chama o endpoint de autorização
 * para incrementar o número do RPS após a autorização bem-sucedida
 * @param notaId ID da nota fiscal
 * @param token Token de autenticação
 * @param dadosNfse Dados extraídos do XML da NFSe
 * @returns Resultado da atualização
 */
export async function atualizarXmlNfse(
  notaId: string,
  token: string,
  dadosNfse: DadosNfse
): Promise<AtualizarXmlNfseResponse> {
  try {
    
    // Preparar os dados para atualização
    const dadosAtualizacao = {
      nfseXML: dadosNfse.xmlCompleto,
      numero: dadosNfse.numero,
      codigoVerificacao: dadosNfse.codigoVerificacao,
      dataEmissao: dadosNfse.dataEmissao,
      status: '1', // 1 = Autorizada se tiver semente se o parametro nfseXML contiver a tag <NFSe> e ausente a tag <NfseCancelamento> se a de cancelamento existir o status é de cancelada
      statusNfse: 'Autorizada'
    };
    
    // Enviar requisição para atualizar a nota fiscal
    const response = await fetch('/api/nfse/atualizar-xml-nfse', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        notaFiscalId: notaId,
        ...dadosAtualizacao
      })
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error('[atualizarXmlNfse] Erro ao atualizar XML da NFSe:', errorData);
      return {
        success: false,
        message: 'Erro ao atualizar XML da NFSe',
        errors: [errorData.message || 'Erro ao atualizar XML da NFSe']
      };
    }
    
    const responseData = await response.json();
    
    // Após atualizar o XML com sucesso, chamar o endpoint de autorização
    // para incrementar o número do RPS
    if (responseData.success) {
      console.log('[atualizarXmlNfse] XML atualizado com sucesso. Chamando endpoint de autorização para incrementar o número do RPS...');
      try {
        const autorizaResponse = await fetch('/api/nfse/autoriza-nfse', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            notaFiscalId: notaId
          })
        });
        
        if (!autorizaResponse.ok) {
          const autorizaErrorData = await autorizaResponse.json();
          console.warn('[atualizarXmlNfse] Aviso: Não foi possível incrementar o número do RPS:', autorizaErrorData);
        } else {
          console.log('[atualizarXmlNfse] Número do RPS incrementado com sucesso');
        }
      } catch (autorizaError) {
        console.warn('[atualizarXmlNfse] Erro ao chamar endpoint de autorização:', autorizaError);
      }
    }
    
    return {
      success: true,
      message: 'XML da NFSe atualizado com sucesso',
      data: responseData
    };
  } catch (error) {
    console.error('[atualizarXmlNfse] Erro ao atualizar XML da NFSe:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido ao atualizar XML da NFSe';
    
    return {
      success: false,
      message: 'Erro ao atualizar XML da NFSe',
      errors: [errorMessage]
    };
  }
}
