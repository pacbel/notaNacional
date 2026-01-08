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
    
    // Buscar serviços do banco de dados com filtro
    const servicos = await prisma.servico.findMany({
      where,
      orderBy: {
        descricao: 'asc'
      },
      select: {
        id: true,
        descricao: true,
        codigoTributacao: true,
        itemListaServico: true,
        // Usar seleção dinâmica para incluir o campo ativo
        ...{ ativo: true } as any
      }
    });

    return NextResponse.json(servicos);
  } catch (error) {
    console.error('Erro ao listar serviços:', error);
    return NextResponse.json({ error: 'Erro ao listar serviços' }, { status: 500 });
  }
}
