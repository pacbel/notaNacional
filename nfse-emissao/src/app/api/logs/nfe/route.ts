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

    const logs = await prisma.log.findMany({
      where: { entidade: 'NFe', entidadeId: id },
      orderBy: { dataHora: 'desc' },
      include: { usuario: true },
    });

    const result = logs.map(l => ({
      id: l.id,
      acao: l.acao,
      descricao: l.descricao,
      dataHora: l.dataHora,
      usuarioNome: (l as any).usuario?.nome || '',
    }));

    return NextResponse.json(result);
  } catch (error) {
    console.error('Erro ao listar logs da NFe:', error);
    return NextResponse.json({ error: 'Erro ao listar logs' }, { status: 500 });
  }
}
