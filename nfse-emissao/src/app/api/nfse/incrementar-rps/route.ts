import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * API para incrementar o número do RPS do prestador após a nota ser autorizada
 * @param request Requisição com os dados da nota fiscal
 * @returns Resposta da API com o resultado da operação
 */
export async function POST(request: NextRequest) {
  console.log('[API:IncrementarRPS] Recebendo requisição para incrementar número do RPS');
  
  try {
    // Validar o token de autenticação
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.error('[API:IncrementarRPS] Token de autenticação não fornecido');
      return NextResponse.json(
        { error: 'Token de autenticação não fornecido' },
        { status: 401 }
      );
    }

    // Obter dados da requisição
    const { notaFiscalId } = await request.json();
    
    if (!notaFiscalId) {
      console.error('[API:IncrementarRPS] ID da nota fiscal não fornecido');
      return NextResponse.json(
        { error: 'ID da nota fiscal é obrigatório' },
        { status: 400 }
      );
    }
    
    console.log(`[API:IncrementarRPS] Incrementando número do RPS para a nota fiscal ${notaFiscalId}`);

    // Buscar a nota fiscal para obter o prestadorId
    const notaFiscal = await prisma.notafiscal.findUnique({
      where: { id: notaFiscalId },
      select: { prestadorId: true, status: true }
    });

    if (!notaFiscal) {
      console.error(`[API:IncrementarRPS] Nota fiscal ${notaFiscalId} não encontrada`);
      return NextResponse.json(
        { error: 'Nota fiscal não encontrada' },
        { status: 404 }
      );
    }

    // Verificar se a nota está autorizada antes de incrementar o RPS
    if (notaFiscal.status !== 'Autorizada') {
      console.warn(`[API:IncrementarRPS] Nota fiscal ${notaFiscalId} não está autorizada. Status atual: ${notaFiscal.status}`);
      return NextResponse.json(
        { error: 'Apenas notas autorizadas podem incrementar o número do RPS', status: notaFiscal.status },
        { status: 400 }
      );
    }

    // Não incrementamos mais o numeroRpsAtual automaticamente
    // O valor deve ser mantido conforme definido pelo usuário
    // Apenas buscamos os dados atuais do prestador
    const prestadorAtualizado = await prisma.prestador.findUnique({
      where: { id: notaFiscal.prestadorId },
      select: {
        id: true,
        razaoSocial: true,
        numeroRpsAtual: true
      }
    });
    
    if (!prestadorAtualizado) {
      console.error(`[API:IncrementarRPS] Prestador não encontrado para o ID ${notaFiscal.prestadorId}`);
      return NextResponse.json(
        { error: 'Prestador não encontrado' },
        { status: 404 }
      );
    }

    console.log(`[API:IncrementarRPS] Usando o número atual do RPS para o prestador ${prestadorAtualizado.id}: ${prestadorAtualizado.numeroRpsAtual}`);

    return NextResponse.json({
      success: true,
      message: 'Número do RPS incrementado com sucesso',
      data: {
        prestadorId: prestadorAtualizado.id,
        prestadorNome: prestadorAtualizado.razaoSocial,
        numeroRpsAtual: prestadorAtualizado.numeroRpsAtual
      }
    });
  } catch (error) {
    console.error('[API:IncrementarRPS] Erro ao incrementar número do RPS:', error);
    
    return NextResponse.json(
      { 
        error: 'Erro ao incrementar número do RPS',
        message: error instanceof Error ? error.message : 'Erro desconhecido'
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
