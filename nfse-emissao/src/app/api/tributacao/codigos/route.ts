import { NextRequest, NextResponse } from 'next/server';
import { isAuthenticated } from '@/services/authService';
import { listaServicosModel } from '@/types/listaservicosmodel';

export async function GET(
  request: NextRequest,
): Promise<NextResponse<listaServicosModel[] | { error: string }>> {
  try {
    // Verificar autenticação
    if (!isAuthenticated(request)) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }
    console.warn('[API] /api/tributacao/codigos desativado: retornando lista vazia por configuração de cliente.');
    return NextResponse.json([]);
  } catch (error) {
    console.error('Erro ao buscar códigos CNAE:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 },
    );
  }
}


