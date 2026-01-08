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
    const serie = Number(url.searchParams.get('serie') || '1') || 1;

    const agg = await prisma.nfe.aggregate({ _max: { numero: true }, where: { serie } });
    const nextNumero = (agg._max.numero ?? 0) + 1;

    return NextResponse.json({ nextNumero });
  } catch (error) {
    console.error('Erro ao obter próximo número da NFe:', error);
    return NextResponse.json({ error: 'Erro ao obter próximo número' }, { status: 500 });
  }
}
