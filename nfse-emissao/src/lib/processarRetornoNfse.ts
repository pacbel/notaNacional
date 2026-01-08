import { prisma } from './prisma';

export async function processarRetornoNfse(notaFiscalId: string, xmlRetorno: string) {
  try {
    // Remove os namespaces e pega apenas o conteúdo do outputXML
    const outputXMLContent = xmlRetorno
      .replace(/<\?xml[^>]*\?>/g, '') // Remove declaração XML
      .replace(/ns2:/g, '')           // Remove namespace ns2
      .match(/<outputXML>([\s\S]*?)<\/outputXML>/)?.[1] || '';

    // Extrai os valores usando regex
    const numeroLote = outputXMLContent.match(/<NumeroLote>(\d+)<\/NumeroLote>/)?.[1];
    const dataRecebimento = outputXMLContent.match(/<DataRecebimento>(.*?)<\/DataRecebimento>/)?.[1];
    const protocolo = outputXMLContent.match(/<Protocolo>(.*?)<\/Protocolo>/)?.[1];


    if (!numeroLote || !dataRecebimento || !protocolo) {
      throw new Error('Não foi possível extrair todas as informações necessárias do XML');
    }

    const notaAtualizada = await prisma.notafiscal.update({
      where: { id: notaFiscalId },
      data: {
        numeroLote,
        protocolo,
        dataRecebimento: new Date(dataRecebimento),
        xmlRetorno
        // O campo 'status' (numérico) não será atualizado aqui.
        // Ele é gerenciado pelo fluxo de autorização em /api/nfse/autoriza-nfse
      }
    });


    return {
      success: true,
      data: {
        numeroLote,
        dataRecebimento,
        protocolo,
        notaFiscalId: notaAtualizada.id
      }
    };

  } catch (error) {
    console.error('[ProcessarRetorno] Erro ao processar retorno da NFSe:', error);
    throw error;
  }
}
