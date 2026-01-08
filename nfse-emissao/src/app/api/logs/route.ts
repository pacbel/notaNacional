import { NextRequest, NextResponse } from 'next/server';
import { logService } from '@/services/logService';
import { getTokenData } from '@/services/authService';

/**
 * GET /api/logs
 * Busca logs com filtros
 */
export async function GET(request: NextRequest) {
  try {
    // Verificar autenticau00e7u00e3o
    const userData = await getTokenData(request);
    if (!userData) {
      return NextResponse.json({ message: 'Nu00e3o autorizado' }, { status: 401 });
    }

    // Apenas usuu00e1rios Master e Administrador podem ver logs
    if (userData.role !== 'Master' && userData.role !== 'Administrador') {
      return NextResponse.json({ message: 'Acesso negado' }, { status: 403 });
    }

    // Obter paru00e2metros da URL
    const searchParams = request.nextUrl.searchParams;
    const prestadorId = searchParams.get('prestadorId');
    
    // Parâmetros de paginação
    const pagina = searchParams.get('pagina') ? parseInt(searchParams.get('pagina') as string) : 1;
    const limite = searchParams.get('limite') ? parseInt(searchParams.get('limite') as string) : 10;
    
    if (!prestadorId) {
      return NextResponse.json({ message: 'ID do prestador u00e9 obrigatu00f3rio' }, { status: 400 });
    }

    // Verificar se o usuu00e1rio tem acesso ao prestador
    if (userData.role !== 'Master' && userData.prestadorId !== prestadorId) {
      return NextResponse.json({ message: 'Acesso negado a este prestador' }, { status: 403 });
    }

    // Construir filtros
    const filtros: any = {};
    
    const usuarioId = searchParams.get('usuarioId');
    if (usuarioId) filtros.usuarioId = usuarioId;
    
    const dataInicio = searchParams.get('dataInicio');
    if (dataInicio) filtros.dataInicio = new Date(dataInicio);
    
    const dataFim = searchParams.get('dataFim');
    if (dataFim) filtros.dataFim = new Date(dataFim);
    
    const entidade = searchParams.get('entidade');
    if (entidade) filtros.entidade = entidade;
    
    const acao = searchParams.get('acao');
    if (acao) filtros.acao = acao;
    
    const tela = searchParams.get('tela');
    if (tela) filtros.tela = tela;

    // Adicionar parâmetros de paginação aos filtros
    filtros.pagina = pagina;
    filtros.limite = limite;
    
    // Buscar logs com paginação
    const resultado = await logService.buscarLogs(prestadorId, filtros);

    return NextResponse.json(resultado);
  } catch (error: any) {
    console.error('Erro ao buscar logs:', error);
    return NextResponse.json(
      { message: 'Erro ao buscar logs', error: error.message },
      { status: 500 }
    );
  }
}
