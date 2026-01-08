/**
 * Função para consultar o status de uma nota fiscal via API
 * @param notaFiscalId ID da nota fiscal a ser consultada
 * @param token Token de autenticação
 * @param payload Payload completo para a consulta
 * @returns Objeto com o resultado da consulta
 */
export async function consultarStatusNfseApi(notaFiscalId: string, token: string, payload: unknown) {
  try {
    
    const response = await fetch(`/api/nfse/consultar-nfse`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ payload })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Erro ao consultar status: ${errorData.error || 'Erro desconhecido'}`);
    }

    const data = await response.json();

    return data;
  } catch (error: unknown) {
    console.error('[ConsultarStatusNfseApi] Erro ao consultar status da nota:', error);
    throw error;
  }
}
