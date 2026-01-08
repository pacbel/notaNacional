/**
 * Atualiza o protocolo da nota fiscal
 * @param notaId ID da nota fiscal
 * @param token Token de autenticação
 * @param xml XML da nota fiscal
 * @returns Resultado da atualização
 */
export async function atualizarXmlRps(notaId: string, token: string, xml: string) {
    // Atualizar o protocolo da nota fiscal via API
    try {
      const atualizarXmlRpsResponse = await fetch(`/api/nfse/atualizar-xml-rps`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          notaFiscalId: notaId,
          xml
        })
      });
  
      if (!atualizarXmlRpsResponse.ok) {
        const errorText = await atualizarXmlRpsResponse.text();
        throw new Error(`Erro ao atualizar XML RPS: ${errorText}`);
      }
  
      const responseData = await atualizarXmlRpsResponse.json();
      return responseData;
    } catch (error) {
      throw error;
    }
  }
  