import { ConsultaListaXML, ConsultaMensagemRetornoComXML } from '@/types/notafiscal';
import { XMLParser } from 'fast-xml-parser';

/**
 * Processa o status do RPS preservando o formato XML original
 * @param xml String XML a ser processada
 * @returns Objeto com as informações extraídas do XML
 */
export async function processaStatusRps(xml: string) {
  if (!xml) {
    return undefined;
  }

  // Para compatibilidade com o tipo de retorno existente
  let compNfseList: string[] = [];
  let mensagemRetornoList: ConsultaMensagemRetornoComXML[] = [];
  const response: ConsultaListaXML[] = [];

  // Extrai os nós CompNfse do XML
  if (xml.includes("</CompNfse>")) {
    // Extrair os nós CompNfse do XML original
    const compNfseRegex = /<CompNfse[\s\S]*?<\/CompNfse>/g;
    const compNfseMatches = xml.match(compNfseRegex);
    
    if (compNfseMatches) {
      // Preservamos o XML original
      compNfseList = compNfseMatches;
    }
    
    console.log('Consulta CompNfse finalizada');
  }
  
  // Extrai os nós MensagemRetorno do XML
  if (xml.includes("</ListaMensagemRetorno>")) {
    // Extrair os nós MensagemRetorno do XML original
    const mensagemRetornoRegex = /<MensagemRetorno[\s\S]*?<\/MensagemRetorno>/g;
    const mensagemRetornoMatches = xml.match(mensagemRetornoRegex);
    
    if (mensagemRetornoMatches) {
      // Para compatibilidade com o código existente, precisamos extrair Codigo e Mensagem
      const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: '' });
      mensagemRetornoList = mensagemRetornoMatches.map(xmlNode => {
        const parsed = parser.parse(xmlNode);
        // Criamos um objeto que mantém a compatibilidade com ConsultaMensagemRetorno
        // mas que também contém o XML original como propriedade
        return {
          Codigo: parsed.MensagemRetorno?.Codigo || '',
          Mensagem: parsed.MensagemRetorno?.Mensagem || '',
          _xml: xmlNode // Adicionamos o XML como uma propriedade com prefixo _ para indicar que é interna
        };
      });
    }
    
    console.log('Consulta MensagemRetorno finalizada');
  }

  // Mantém a estrutura de resposta original
  response.push({
    CompNfse: compNfseList,
    MensagemRetorno: mensagemRetornoList
  });

  return response;
}