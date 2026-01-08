/**
 * Salva o XML da nota fiscal
 * @param notaId ID da nota fiscal
 * @param token Token de autenticação
 * @param xmlContent Conteúdo do XML
 * @returns Resultado da operação
 */
export async function salvarXml(notaId: string, token: string, xmlContent: string) {

  const salvarXmlResponse = await fetch(`/api/nfse/salvar-xml`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      notaFiscalId: notaId,
      xmlContent
    })
  });

  if (!salvarXmlResponse.ok) {
    throw new Error(`Erro ao salvar XML: ${await salvarXmlResponse.text()}`);
  }
  
  return await salvarXmlResponse.json();
}
