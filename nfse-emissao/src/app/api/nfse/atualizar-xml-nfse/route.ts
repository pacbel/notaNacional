import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  console.log('[API:AtualizarXmlNfse] Recebendo requisição para atualizar XML da NFSe');
  try {
    // Validar o token de autenticação
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.error('[API:AtualizarXmlNfse] Token de autenticação não fornecido');
      return NextResponse.json(
        { error: 'Token de autenticação não fornecido' },
        { status: 401 }
      );
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      console.error('[API:AtualizarXmlNfse] Token de autenticação inválido');
      return NextResponse.json(
        { error: 'Token de autenticação inválido' },
        { status: 401 }
      );
    }
    
    console.log('[API:AtualizarXmlNfse] Autenticação validada com sucesso');

    // Extrair os dados da requisição
    const { notaFiscalId, nfseXML, numero, codigoVerificacao, dataEmissao, statusNfse } = await request.json(); // Removido 'status' da desestruturação
    console.log('[API:AtualizarXmlNfse] Dados recebidos:', { 
      notaFiscalId, 
      numero, 
      codigoVerificacao,
      dataEmissao,
      // status, // Removido dos logs pois não é mais usado diretamente
      statusNfse,
      nfseXML: nfseXML ? 'XML recebido (não exibido devido ao tamanho)' : 'XML não fornecido'
    });

    if (!notaFiscalId || !nfseXML) {
      console.error('[API:AtualizarXmlNfse] ID da nota fiscal ou XML não informados');
      return NextResponse.json(
        { error: 'ID da nota fiscal ou XML não informados' },
        { status: 400 }
      );
    }

    // Atualizar a nota fiscal com o XML
    console.log('[API:AtualizarXmlNfse] Tentando atualizar XML no banco de dados...');
    try {
      // Preparar os dados para atualização
      const dadosAtualizacao: any = { 
        nfseXML
        // O campo 'status' (numérico) não será atualizado aqui.
        // Ele é gerenciado pelo fluxo de autorização em /api/nfse/autoriza-nfse
      };
      
      // Adicionar dados opcionais se fornecidos
      if (numero) dadosAtualizacao.numero = numero;
      if (codigoVerificacao) dadosAtualizacao.codigoVerificacao = codigoVerificacao;
      if (dataEmissao) dadosAtualizacao.dataEmissao = new Date(dataEmissao);
      if (statusNfse) dadosAtualizacao.statusNfse = statusNfse;
      
      // Atualizar a nota fiscal
      const notaAtualizada = await prisma.notafiscal.update({
        where: { id: notaFiscalId },
        data: dadosAtualizacao
      });
      
      console.log('[API:AtualizarXmlNfse] XML atualizado com sucesso:', {
        id: notaAtualizada.id,
        numero: notaAtualizada.numero,
        codigoVerificacao: notaAtualizada.codigoVerificacao,
        dataEmissao: notaAtualizada.dataEmissao,
        status: notaAtualizada.status,
        statusNfse: notaAtualizada.statusNfse
      });
      
      return NextResponse.json({ 
        success: true,
        message: 'XML da NFSe atualizado com sucesso',
        data: {
          id: notaAtualizada.id,
          numero: notaAtualizada.numero,
          codigoVerificacao: notaAtualizada.codigoVerificacao,
          dataEmissao: notaAtualizada.dataEmissao,
          status: notaAtualizada.status,
          statusNfse: notaAtualizada.statusNfse
        }
      });
    } catch (dbError) {
      console.error('[API:AtualizarXmlNfse] Erro ao atualizar XML no banco de dados:', dbError);
      throw new Error(`Erro ao atualizar XML no banco de dados: ${dbError instanceof Error ? dbError.message : 'Erro desconhecido'}`);
    }
  } catch (error) {
    console.error('[API:AtualizarXmlNfse] Erro ao processar requisição:', error);
    console.error('[API:AtualizarXmlNfse] Detalhes do erro:', error instanceof Error ? error.message : 'Erro desconhecido');
    console.error('[API:AtualizarXmlNfse] Stack trace:', error instanceof Error && error.stack ? error.stack : 'Sem stack trace');
    
    return NextResponse.json(
      { 
        error: 'Erro ao processar requisição',
        message: error instanceof Error ? error.message : 'Erro desconhecido'
      },
      { status: 500 }
    );
  }
}
