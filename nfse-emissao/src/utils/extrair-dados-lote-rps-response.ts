/**
 * Utilitário para extrair dados da resposta XML do lote RPS
 */

export interface DadosLoteRpsResponse {
  success: boolean;
  errors?: string[];
  numeroLote?: string;
  dataRecebimento?: string;
  protocolo?: string;
}

/**
 * Extrai os dados relevantes da resposta XML do lote RPS
 * @param xmlResponse Resposta XML do lote RPS
 * @returns Objeto com os dados extraídos (numeroLote, dataRecebimento, protocolo)
 */
export function extrairDadosLoteRpsResponse(xmlResponse: string): DadosLoteRpsResponse | null {
  try {
    // Verificar se a resposta é válida
    if (!xmlResponse) {
      return {
        success: false,
        errors: ['Resposta XML vazia']
      };
    }

    // Extrair o conteúdo do outputXML
    // Usando uma abordagem alternativa sem a flag 's' (dotAll)
    const outputXmlRegex = /<outputXML>([\s\S]*?)<\/outputXML>/;
    const outputXmlMatch = xmlResponse.match(outputXmlRegex);
    if (!outputXmlMatch || !outputXmlMatch[1]) {
      return {
        success: false,
        errors: ['Não foi possível encontrar o outputXML na resposta']
      };
    }

    const outputXml = outputXmlMatch[1];

    // Extrair os dados necessários usando expressões regulares
    const numeroLoteMatch = outputXml.match(/<NumeroLote>(.*?)<\/NumeroLote>/);
    const dataRecebimentoMatch = outputXml.match(/<DataRecebimento>(.*?)<\/DataRecebimento>/);
    const protocoloMatch = outputXml.match(/<Protocolo>(.*?)<\/Protocolo>/);

    // Verificar se todos os dados foram encontrados
    if (!numeroLoteMatch || !dataRecebimentoMatch || !protocoloMatch) {
      return {
        success: false,
        errors: ['Não foi possível extrair todos os dados necessários da resposta XML']
      };
    }

    // Retornar os dados extraídos
    return {
      success: true,
      numeroLote: numeroLoteMatch[1],
      dataRecebimento: dataRecebimentoMatch[1],
      protocolo: protocoloMatch[1]
    };
  } catch {
    return {
      success: false,
      errors: ['Erro ao extrair dados da resposta XML']
    };
  }
}
