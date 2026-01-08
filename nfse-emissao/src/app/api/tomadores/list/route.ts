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
    
    // Obter parâmetro de filtro da URL
    const url = new URL(request.url);
    const filtro = url.searchParams.get('filtro') || 'ativos';
    
    // Definir condição de filtro
    let where = {};
    if (filtro === 'ativos') {
      where = { ativo: true };
    } else if (filtro === 'inativos') {
      where = { ativo: false };
    }
    
    // Buscar tomadores do banco de dados com filtro
    const tomadores = await prisma.tomador.findMany({
      where,
      orderBy: {
        razaoSocial: 'asc'
      }
    });

    return NextResponse.json(tomadores);
  } catch (error) {
    console.error('Erro ao listar tomadores:', error);
    return NextResponse.json({ error: 'Erro ao listar tomadores' }, { status: 500 });
  }
}
