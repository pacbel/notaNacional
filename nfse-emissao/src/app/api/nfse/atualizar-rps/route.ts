import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    // Valida o token de autenticação
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Token de autenticação não fornecido' },
        { status: 401 }
      );
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      return NextResponse.json(
        { error: 'Token de autenticação inválido' },
        { status: 401 }
      );
    }

    const { notaFiscalId } = await request.json();

    if (!notaFiscalId) {
      return NextResponse.json(
        { error: 'ID da nota fiscal não informado' },
        { status: 400 }
      );
    }

    // Buscar a nota fiscal com o prestador
    const notaFiscal = await prisma.notafiscal.findUnique({
      where: { id: notaFiscalId },
      include: { prestador: true }
    });

    if (!notaFiscal || !notaFiscal.prestador) {
      return NextResponse.json(
        { error: 'Nota fiscal ou prestador não encontrado' },
        { status: 404 }
      );
    }

    // Não incrementamos mais o numeroRpsAtual automaticamente
    // O valor deve ser mantido conforme definido pelo usuário
    console.log(`[API:AtualizarRPS] Usando o valor atual do RPS (${notaFiscal.prestador.numeroRpsAtual}) sem incrementar`);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erro ao processar requisição de atualização de RPS:', error);
    return NextResponse.json(
      { error: 'Erro ao processar requisição' },
      { status: 500 }
    );
  }
}
