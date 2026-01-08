import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import * as authService from '@/services/authService';

export async function DELETE(request: NextRequest) {
  try {
    // Verificar autenticação
    const isAuthenticated = await authService.isAuthenticated(request);
    if (!isAuthenticated) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    // Obter o ID do serviço da URL
    const url = new URL(request.url);
    const id = url.searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID do serviço não fornecido' }, { status: 400 });
    }

    // Verificar se o serviço existe
    const servicoExistente = await prisma.servico.findUnique({
      where: { id }
    });

    if (!servicoExistente) {
      return NextResponse.json({ error: 'Serviço não encontrado' }, { status: 404 });
    }

    // Excluir o serviço
    await prisma.servico.delete({
      where: { id }
    });

    return NextResponse.json({ message: 'Serviço excluído com sucesso' }, { status: 200 });
  } catch (error) {
    console.error('Erro ao excluir serviço:', error);
    return NextResponse.json({ error: 'Erro ao excluir serviço' }, { status: 500 });
  }
}
