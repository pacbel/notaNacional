import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * API para marcar uma NFSe como rejeitada
 * @param request Requisição com o ID da nota fiscal e motivo da rejeição
 * @returns Resposta de sucesso ou erro
 */
export async function POST(request: NextRequest) {
  try {
    // Obter dados da requisição
    const { notaFiscalId, motivoRejeicao } = await request.json();

    if (!notaFiscalId) {
      return NextResponse.json({ error: 'ID da nota fiscal não informado' }, { status: 400 });
    }

    // Atualizar o status da nota fiscal para rejeitada
    const notaFiscal = await prisma.notafiscal.update({
      where: {
        id: notaFiscalId
      },
      data: {
        status: '0',
        // Armazenar o motivo da rejeição no campo motivoCancelamento
        motivoCancelamento: motivoRejeicao || 'Erro na validação da NFSe'
      }
    });
    
    // Registrar o motivo da rejeição no log
    console.log(`[API:RejeitarNFSe] Motivo da rejeição: ${motivoRejeicao}`);

    console.log(`[API:RejeitarNFSe] Nota fiscal ${notaFiscalId} marcada como rejeitada`);
    console.log(`[API:RejeitarNFSe] Motivo: ${motivoRejeicao}`);

    return NextResponse.json({ 
      success: true, 
      message: 'Nota fiscal marcada como rejeitada',
      data: {
        id: notaFiscal.id,
        status: notaFiscal.status,
        motivoCancelamento: notaFiscal.motivoCancelamento || motivoRejeicao
      }
    });
  } catch (error) {
    console.error('[API:RejeitarNFSe] Erro ao rejeitar nota fiscal:', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Erro desconhecido' 
    }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}
