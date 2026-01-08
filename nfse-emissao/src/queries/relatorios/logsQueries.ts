import { prisma } from '@/lib/prisma';

export interface LogFiltros {
  prestadorId?: string;
  usuarioId?: string;
  entidade?: string;
  acao?: string;
  tela?: string;
  dataInicio?: string;
  dataFim?: string;
}

type LogWhere = {
  prestadorId?: string;
  usuarioId?: string;
  entidade?: string;
  acao?: string;
  tela?: string;
  dataHora?: { gte?: Date; lte?: Date };
};

export async function buscarLogs(filtros: LogFiltros, pagina = 1, limite = 10) {
  const where: LogWhere = {};
  
  if (filtros.prestadorId) {
    where.prestadorId = filtros.prestadorId;
  }
  
  if (filtros.usuarioId) {
    where.usuarioId = filtros.usuarioId;
  }
  
  if (filtros.entidade) {
    where.entidade = filtros.entidade;
  }
  
  if (filtros.acao) {
    where.acao = filtros.acao;
  }
  
  if (filtros.tela) {
    where.tela = filtros.tela;
  }
  
  if (filtros.dataInicio || filtros.dataFim) {
    where.dataHora = {};
    
    if (filtros.dataInicio) {
      where.dataHora.gte = new Date(filtros.dataInicio);
    }
    
    if (filtros.dataFim) {
      const dataFim = new Date(filtros.dataFim);
      dataFim.setHours(23, 59, 59, 999);
      where.dataHora.lte = dataFim;
    }
  }
  
  const total = await prisma.log.count({ where });
  const totalPaginas = Math.ceil(total / limite);
  
  const logs = await prisma.log.findMany({
    where,
    include: {
      usuario: {
        select: {
          id: true,
          nome: true,
          username: true
        }
      }
    },
    orderBy: {
      dataHora: 'desc'
    },
    skip: (pagina - 1) * limite,
    take: limite
  });
  
  return {
    logs,
    paginacao: {
      pagina,
      limite,
      total,
      totalPaginas
    }
  };
}

export async function buscarTodosLogs(prestadorId: string) {
  return prisma.log.findMany({
    where: { prestadorId },
    include: {
      usuario: {
        select: {
          id: true,
          nome: true,
          username: true
        }
      }
    },
    orderBy: {
      dataHora: 'desc'
    }
  });
}
