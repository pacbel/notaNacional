/**
 * Extrai todas as mensagens contidas em tags <Mensagem> do XML
 * @param xmlString XML a ser analisado
 * @returns Array com todas as mensagens encontradas
 */
export function extrairTodasMensagensXml(xmlString: string): string[] {
  const mensagens: string[] = [];
  
  try {
    // Extrair todas as ocorrências da tag Mensagem
    const regex = /<Mensagem>([^<]+)<\/Mensagem>/gi;
    
    let match;
    while ((match = regex.exec(xmlString)) !== null) {
      if (match.length >= 2) {
        mensagens.push(match[1]);
      }
    }
  } catch (error) {
    console.error('[extrairTodasMensagensXml] Erro ao extrair mensagens:', error);
  }
  
  return mensagens;
}
