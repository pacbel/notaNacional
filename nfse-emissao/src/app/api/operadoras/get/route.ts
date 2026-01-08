import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import * as authService from '@/services/authService';

export async function GET(request: NextRequest) {
  try {
    const isAuthenticated = await authService.isAuthenticated(request);
    if (!isAuthenticated) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const url = new URL(request.url);
    const id = url.searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'ID não informado' }, { status: 400 });

    const data = await prisma.operadoraCartao.findUnique({ where: { id } });
    if (!data) return NextResponse.json({ error: 'Operadora não encontrada' }, { status: 404 });

    return NextResponse.json(data);
  } catch (error) {
    console.error('Erro ao buscar operadora:', error);
    return NextResponse.json({ error: 'Erro ao buscar operadora' }, { status: 500 });
  }
}
