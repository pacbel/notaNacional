import { prisma } from '@/lib/prisma';

export interface UsuarioFiltros {
  prestadorId?: string;
  nome?: string;
  username?: string;
  role?: string;
  dataInicio?: string;
  dataFim?: string;
}

type UsuarioWhere = {
  prestadorId?: string;
  nome?: { contains: string; mode: 'insensitive' };
  username?: { contains: string; mode: 'insensitive' };
  role?: string;
  createdAt?: { gte?: Date; lte?: Date };
};

export async function buscarUsuarios(filtros: UsuarioFiltros, pagina = 1, limite = 10) {
  const where: UsuarioWhere = {};
  
  if (filtros.prestadorId) {
    where.prestadorId = filtros.prestadorId;
  }
  
  if (filtros.nome) {
    where.nome = {
      contains: filtros.nome,
      mode: 'insensitive'
    };
  }
  
  if (filtros.username) {
    where.username = {
      contains: filtros.username,
      mode: 'insensitive'
    };
  }
  
  if (filtros.role) {
    where.role = filtros.role;
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
  
  const total = await prisma.usuario.count({ where });
  const totalPaginas = Math.ceil(total / limite);
  
  const usuarios = await prisma.usuario.findMany({
    where,
    select: {
      id: true,
      nome: true,
      username: true,
      email: true,
      role: true,
      createdAt: true,
      updatedAt: true,
      prestador: {
        select: {
          razaoSocial: true
        }
      }
    },
    orderBy: {
      nome: 'asc'
    },
    skip: (pagina - 1) * limite,
    take: limite
  });
  
  return {
    usuarios,
    paginacao: {
      pagina,
      limite,
      total,
      totalPaginas
    }
  };
}

export async function buscarTodosUsuarios(prestadorId: string) {
  return prisma.usuario.findMany({
    where: { prestadorId },
    select: {
      id: true,
      nome: true,
      username: true,
      email: true,
      role: true,
      createdAt: true,
      updatedAt: true,
      prestador: {
        select: {
          razaoSocial: true
        }
      }
    },
    orderBy: {
      nome: 'asc'
    }
  });
}
