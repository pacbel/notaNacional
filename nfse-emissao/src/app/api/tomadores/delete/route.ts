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

    // Obter o ID do tomador da URL
    const url = new URL(request.url);
    const id = url.searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID do tomador não fornecido' }, { status: 400 });
    }

    // Verificar se o tomador existe
    const tomadorExistente = await prisma.tomador.findUnique({
      where: { id }
    });

    if (!tomadorExistente) {
      return NextResponse.json({ error: 'Tomador não encontrado' }, { status: 404 });
    }

    // Excluir o tomador
    await prisma.tomador.delete({
      where: { id }
    });

    return NextResponse.json({ message: 'Tomador excluído com sucesso' }, { status: 200 });
  } catch (error) {
    console.error('Erro ao excluir tomador:', error);
    return NextResponse.json({ error: 'Erro ao excluir tomador' }, { status: 500 });
  }
}
