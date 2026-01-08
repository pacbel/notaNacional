/**
 * Extrai todas as mensagens de retorno do XML de consulta de lote
 * @param xmlString XML de retorno da consulta de lote
 * @returns Array com todas as mensagens encontradas (código e mensagem)
 */
export function extrairMensagensRetornoLote(xmlString: string): Array<{codigo: string, mensagem: string}> {
  const mensagens: Array<{codigo: string, mensagem: string}> = [];
  
  try {
    // Extrair todas as ocorrências de MensagemRetorno
    const regex = /<MensagemRetorno>[\s\S]*?<Codigo>([^<]+)<\/Codigo>[\s\S]*?<Mensagem>([^<]+)<\/Mensagem>[\s\S]*?<\/MensagemRetorno>/gi;
    
    let match;
    while ((match = regex.exec(xmlString)) !== null) {
      if (match.length >= 3) {
        mensagens.push({
          codigo: match[1],
          mensagem: match[2]
        });
      }
    }
  } catch (error) {
    console.error('[extrairMensagensRetornoLote] Erro ao extrair mensagens:', error);
  }
  
  return mensagens;
}
