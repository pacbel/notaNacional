import { prisma } from '@/lib/prisma';

export interface NotaFiscalFiltros {
  prestadorId?: string;
  tomadorId?: string;
  numero?: string;
  status?: string;
  dataInicio?: string;
  dataFim?: string;
}

export async function buscarNotasFiscais(filtros: NotaFiscalFiltros, pagina = 1, limite = 10) {
  const whereBase: Record<string, unknown> = {};
  let dataEmissaoFilter: { gte?: Date; lte?: Date } | undefined;
  
  if (filtros.prestadorId) {
    whereBase.prestadorId = filtros.prestadorId;
  }
  
  if (filtros.tomadorId) {
    whereBase.tomadorId = filtros.tomadorId;
  }
  
  if (filtros.numero) {
    whereBase.numero = {
      contains: filtros.numero
    };
  }
  
  if (filtros.status) {
    whereBase.status = filtros.status;
  }
  
  if (filtros.dataInicio || filtros.dataFim) {
    dataEmissaoFilter = {};
    
    if (filtros.dataInicio) {
      dataEmissaoFilter.gte = new Date(filtros.dataInicio);
    }
    
    if (filtros.dataFim) {
      const dataFim = new Date(filtros.dataFim);
      dataFim.setHours(23, 59, 59, 999);
      dataEmissaoFilter.lte = dataFim;
    }
  }
  
  const where = {
    ...whereBase,
    ...(dataEmissaoFilter ? { dataEmissao: dataEmissaoFilter } : {}),
  };

  const total = await prisma.notafiscal.count({ where });
  const totalPaginas = Math.ceil(total / limite);
  
  const notasFiscais = await prisma.notafiscal.findMany({
    where,
    include: {
      tomador: true,
      itemnotafiscal: {
        include: {
          servico: true
        }
      }
    },
    orderBy: {
      dataEmissao: 'desc'
    },
    skip: (pagina - 1) * limite,
    take: limite
  });
  
  return {
    notasFiscais,
    paginacao: {
      pagina,
      limite,
      total,
      totalPaginas
    }
  };
}

export async function buscarTodasNotasFiscais(prestadorId: string) {
  return prisma.notafiscal.findMany({
    where: { prestadorId },
    include: {
      tomador: true,
      itemnotafiscal: {
        include: {
          servico: true
        }
      }
    },
    orderBy: {
      dataEmissao: 'desc'
    }
  });
}
