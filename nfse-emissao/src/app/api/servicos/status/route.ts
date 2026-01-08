import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

/**
 * API para atualizar o status de um serviço (ativar/inativar)
 */
export async function PUT(request: NextRequest) {
  try {
    // Verificar autenticação usando as opções de autenticação definidas
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }

    // Obter dados da requisição
    const data = await request.json();
    const { id, ativo } = data;

    if (!id) {
      return NextResponse.json(
        { error: 'ID do serviço não fornecido' },
        { status: 400 }
      );
    }

    // Verificar se o serviço existe
    const servicoExistente = await prisma.servico.findUnique({
      where: { id },
      select: { id: true }
    });

    if (!servicoExistente) {
      return NextResponse.json(
        { error: 'Serviço não encontrado' },
        { status: 404 }
      );
    }

    // Atualizar o status do serviço
    const servicoAtualizado = await prisma.servico.update({
      where: { id },
      data: { ativo: ativo === true || ativo === 'true' },
    });

    return NextResponse.json({
      success: true,
      message: `Serviço ${ativo ? 'ativado' : 'inativado'} com sucesso`,
      data: servicoAtualizado
    });
  } catch (error) {
    console.error('Erro ao atualizar status do serviço:', error);
    return NextResponse.json(
      { error: 'Erro ao atualizar status do serviço' },
      { status: 500 }
    );
  }
}
