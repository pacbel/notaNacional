import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import * as authService from '@/services/authService';

export async function DELETE(request: NextRequest) {
  try {
    // Verificar autenticação e se o usuário é Master
    const isAuthenticated = await authService.isAuthenticated(request);
    const isMaster = await authService.isMaster(request);
    
    if (!isAuthenticated) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }
    
    if (!isMaster) {
      return NextResponse.json({ error: 'Apenas usuários Master podem excluir prestadores' }, { status: 403 });
    }

    // Obter o ID do prestador da URL
    const url = new URL(request.url);
    const id = url.searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID do prestador não fornecido' }, { status: 400 });
    }

    // Verificar se o prestador existe
    const prestadorExistente = await prisma.prestador.findUnique({
      where: { id },
      include: {
        usuarios: true
      }
    });

    if (!prestadorExistente) {
      return NextResponse.json({ error: 'Prestador não encontrado' }, { status: 404 });
    }

    // Verificar se existem usuários vinculados ao prestador
    if (prestadorExistente.usuarios && prestadorExistente.usuarios.length > 0) {
      return NextResponse.json({ 
        error: 'Não é possível excluir o prestador pois existem usuários vinculados a ele' 
      }, { status: 400 });
    }

    // Excluir o prestador
    await prisma.prestador.delete({
      where: { id }
    });

    return NextResponse.json({ message: 'Prestador excluído com sucesso' }, { status: 200 });
  } catch (error) {
    console.error('Erro ao excluir prestador:', error);
    return NextResponse.json({ error: 'Erro ao excluir prestador' }, { status: 500 });
  }
}
