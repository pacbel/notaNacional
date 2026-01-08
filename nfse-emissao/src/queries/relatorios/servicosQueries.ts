import { prisma } from '@/lib/prisma';

export interface ServicoFiltros {
  prestadorId?: string;
  codigo?: string;
  descricao?: string;
  dataInicio?: string;
  dataFim?: string;
}

type ServicoWhere = {
  codigoTributacao?: { contains: string };
  descricao?: { contains: string; mode: 'insensitive' };
  createdAt?: { gte?: Date; lte?: Date };
};

export async function buscarServicos(filtros: ServicoFiltros, pagina = 1, limite = 10) {
  const where: ServicoWhere = {};
  
  // O modelo servico nu00e3o possui o campo prestadorId, então não podemos filtrar por ele
  // if (filtros.prestadorId) {
  //   where.prestadorId = filtros.prestadorId;
  // }
  
  if (filtros.codigo) {
    where.codigoTributacao = {
      contains: filtros.codigo
    };
  }
  
  if (filtros.descricao) {
    where.descricao = {
      contains: filtros.descricao,
      mode: 'insensitive'
    };
  }
  
  if (filtros.dataInicio || filtros.dataFim) {
    where.createdAt = {};
    
    if (filtros.dataInicio) {
      where.createdAt.gte = new Date(filtros.dataInicio);
    }
    
    if (filtros.dataFim) {
      const dataFim = new Date(filtros.dataFim);
      dataFim.setHours(23, 59, 59, 999);
      where.createdAt.lte = dataFim;
    }
  }
  
  const total = await prisma.servico.count({ where });
  const totalPaginas = Math.ceil(total / limite);
  
  const servicos = await prisma.servico.findMany({
    where,
    orderBy: {
      codigoTributacao: 'asc'
    },
    skip: (pagina - 1) * limite,
    take: limite
  });
  
  return {
    servicos,
    paginacao: {
      pagina,
      limite,
      total,
      totalPaginas
    }
  };
}

export async function buscarTodosServicos(_prestadorId: string) {
  // Como o modelo servico nu00e3o possui o campo prestadorId,
  // vamos buscar todos os serviu00e7os e filtrar por outro meio se necessário
  void _prestadorId;
  return prisma.servico.findMany({
    orderBy: {
      codigoTributacao: 'asc'
    }
  });
}
