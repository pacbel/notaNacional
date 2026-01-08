import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { getTokenData } from '@/services/authService';

export async function GET(request: Request) {
  try {
    // Autenticação obrigatória
    const user = await getTokenData(request as any);
    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '10');
    const filtro = searchParams.get('filtro') || '';
    const status = searchParams.get('status') || '';
    const dataInicio = searchParams.get('dataInicio') || '';
    const dataFim = searchParams.get('dataFim') || '';

    const skip = (page - 1) * pageSize;

    // Construir where clause baseado nos filtros
    const where: any = {};
    
    
    if (filtro) {
      // Remover o argumento 'mode: insensitive' que não é suportado pelo Prisma nesta versão
      where.OR = [
        { numero: { contains: filtro } },
        { serie: { contains: filtro } },
        { tomador: { razaoSocial: { contains: filtro } } }
      ];
    }

    // Filtro por data usando uma abordagem mais direta
    if (dataInicio || dataFim) {
      
      // Verificar se estamos filtrando por um dia específico (mesmo dia de início e fim)
      if (dataInicio && dataFim && dataInicio === dataFim) {
        
        // Usar uma abordagem diferente para filtrar por data específica
        // Converter a string de data para o objeto Date e extrair o dia, mês e ano
        const dataParts = dataInicio.split('-');
        const ano = parseInt(dataParts[0]);
        const mes = parseInt(dataParts[1]) - 1; // Mês em JavaScript é 0-indexed
        const dia = parseInt(dataParts[2]);
        
        // Criar datas para o início e fim do dia
        const inicioData = new Date(Date.UTC(ano, mes, dia, 0, 0, 0, 0));
        const fimData = new Date(Date.UTC(ano, mes, dia, 23, 59, 59, 999));
        
        
        // Aplicar o filtro de data
        where.dataEmissao = {
          gte: inicioData,
          lte: fimData
        };
      } else {
        // Filtro para intervalo de datas
        where.dataEmissao = {};
        
        if (dataInicio) {
          const dataParts = dataInicio.split('-');
          const ano = parseInt(dataParts[0]);
          const mes = parseInt(dataParts[1]) - 1;
          const dia = parseInt(dataParts[2]);
          const inicioData = new Date(Date.UTC(ano, mes, dia, 0, 0, 0, 0));
          
          where.dataEmissao.gte = inicioData;
        }
        
        if (dataFim) {
          const dataParts = dataFim.split('-');
          const ano = parseInt(dataParts[0]);
          const mes = parseInt(dataParts[1]) - 1;
          const dia = parseInt(dataParts[2]);
          const fimData = new Date(Date.UTC(ano, mes, dia, 23, 59, 59, 999));
          
          where.dataEmissao.lte = fimData;
        }
      }
      
      // Adicionar log para debug
    }

    if (status) {
      where.status = status;
    }

    // Verificar e limpar o objeto where para evitar erros do Prisma
    // Remover qualquer propriedade que possa causar problemas
    const cleanWhere = { ...where };
    
    // Verificar se há filtro de texto e ajustar para não usar 'mode'
    if (cleanWhere.OR) {
      cleanWhere.OR = cleanWhere.OR.map((condition: any) => {
        // Remover 'mode' de todas as condições
        const newCondition: any = {};
        
        // Processar cada propriedade do objeto OR
        Object.keys(condition).forEach(key => {
          if (typeof condition[key] === 'object' && condition[key] !== null) {
            // Se a propriedade é um objeto (como { contains: ... })
            const innerObj = { ...condition[key] };
            // Remover a propriedade 'mode' se existir
            if ('mode' in innerObj) {
              delete innerObj.mode;
            }
            newCondition[key] = innerObj;
          } else {
            // Se for um valor simples, manter como está
            newCondition[key] = condition[key];
          }
        });
        
        return newCondition;
      });
    }
    
    
    // Buscar total de registros
    const total = await prisma.notafiscal.count({ where: cleanWhere });

    // Buscar registros paginados
    const notasFiscais = await prisma.notafiscal.findMany({
      skip,
      take: pageSize,
      where: cleanWhere,
      orderBy: {
        updatedAt: 'desc'
      },
      include: {
        prestador: {
          select: {
            razaoSocial: true,
            cnpj: true
          }
        },
        tomador: {
          select: {
            razaoSocial: true
          }
        }
      }
    });

    return NextResponse.json({
      data: notasFiscais,
      pagination: {
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize)
      }
    });
  } catch (error) {
    console.error('[api/nfse/listar] Erro ao buscar notas fiscais:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar notas fiscais' },
      { status: 500 }
    );
  }
}
