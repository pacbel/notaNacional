import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { logService } from '@/services/logService';

// Prisma já está importado de @/lib/prisma

/**
 * API para atualizar o status de uma NFSe
 * @param req Requisição
 * @returns Resposta com o resultado da atualização
 */
export async function POST(req: NextRequest) {
  try {
    // Verificar autenticação
    const session = await getServerSession();
    if (!session || !session.user) {
      // Em ambiente de desenvolvimento, permitir requisições sem autenticação
      if (process.env.NODE_ENV !== 'development') {
        return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
      }
    }
    
    // Obter ID do usuário da sessão ou usar 'sistema' como padrão
    const userId = session?.user ? (session.user as any).id : 'sistema';

    // Obter dados da requisição
    const data = await req.json();
    const { notaId, statusNfse, nfseXML, xmlCancelamento, codigoCancelamento, motivoCancelamento, dataCancelamento } = data;

    if (!notaId) {
      return NextResponse.json({ error: 'ID da nota fiscal é obrigatório' }, { status: 400 });
    }

    if (!statusNfse) {
      return NextResponse.json({ error: 'Status da NFSe é obrigatório' }, { status: 400 });
    }

    // Validar o status
    const statusValidos = ['autorizada', 'cancelada'];
    if (!statusValidos.includes(statusNfse)) {
      return NextResponse.json({ error: `Status inválido. Valores permitidos: ${statusValidos.join(', ')}` }, { status: 400 });
    }

    // Buscar a nota fiscal
    const notaFiscal = await prisma.notafiscal.findUnique({
      where: {
        id: notaId
      }
    });

    if (!notaFiscal) {
      return NextResponse.json({ error: 'Nota fiscal não encontrada' }, { status: 404 });
    }

    // Preparar dados para atualização
    const statusCode = statusNfse === 'autorizada' ? '1' : (statusNfse === 'cancelada' ? '2' : undefined);

    const updateData: any = {
      statusNfse,
      nfseXML,
      ...(statusCode ? { status: statusCode } : {}),
    };

    // Adicionar campos específicos para notas canceladas
    if (statusNfse === 'cancelada') {
      if (xmlCancelamento) {
        updateData.xmlCancelamento = xmlCancelamento;
      }
      
      if (codigoCancelamento) {
        updateData.codigoCancelamento = codigoCancelamento;
      }
      
      if (motivoCancelamento) {
        updateData.motivoCancelamento = motivoCancelamento;
      }
      
      if (dataCancelamento) {
        updateData.dataCancelamento = new Date(dataCancelamento);
      }
    }

    console.log('[API:atualizar-status] Dados para atualização:', updateData);

    // Atualizar os dados da nota fiscal
    const notaAtualizada = await prisma.notafiscal.update({
      where: {
        id: notaId
      },
      data: updateData
    });

    // Registrar log da ação
    await logService.registrarLog({
      usuarioId: userId,
      prestadorId: notaFiscal.prestadorId,
      acao: statusNfse === 'cancelada' ? 'Cancelar' : 'Editar',
      entidade: 'NOTA_FISCAL',
      entidadeId: notaFiscal.id,
      tela: 'API',
      descricao: `Atualização de status da NFSe ${notaFiscal.numero || ''} para ${statusNfse}${
        motivoCancelamento ? `. Motivo: ${motivoCancelamento}` : ''
      }`
    });

    return NextResponse.json({
      success: true,
      message: `Status da nota fiscal atualizado para ${statusNfse}`,
      data: notaAtualizada
    });
  } catch (error) {
    console.error('[API:atualizar-status] Erro:', error);
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Erro desconhecido ao atualizar status da NFSe'
    }, { status: 500 });
  }
}
