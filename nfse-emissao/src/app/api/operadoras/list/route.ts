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
    const filtro = url.searchParams.get('filtro') || 'ativos';

    let where: any = {};
    if (filtro === 'ativos') where = { ativo: true };
    else if (filtro === 'inativos') where = { ativo: false };

    const data = await prisma.operadoraCartao.findMany({ where, orderBy: { descricao: 'asc' } });
    return NextResponse.json(data);
  } catch (error) {
    console.error('Erro ao listar operadoras:', error);
    return NextResponse.json({ error: 'Erro ao listar operadoras' }, { status: 500 });
  }
}
