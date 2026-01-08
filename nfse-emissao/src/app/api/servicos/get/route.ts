import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import * as authService from '@/services/authService';

export async function GET(request: NextRequest) {
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

    // Buscar o serviço pelo ID
    const servico = await prisma.servico.findUnique({
      where: { id }
    });

    if (!servico) {
      return NextResponse.json({ error: 'Serviço não encontrado' }, { status: 404 });
    }

    return NextResponse.json(servico);
  } catch (error) {
    console.error('Erro ao buscar serviço:', error);
    return NextResponse.json({ error: 'Erro ao buscar serviço' }, { status: 500 });
  }
}
