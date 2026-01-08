import { prisma } from '@/lib/prisma';

export interface TomadorFiltros {
  prestadorId?: string;
  nome?: string;
  cpfCnpj?: string;
  municipioId?: string;
  dataInicio?: string;
  dataFim?: string;
}

type TomadorWhere = {
  razaoSocial?: { contains: string; mode: 'insensitive' };
  cpfCnpj?: { contains: string };
  codigoMunicipio?: string;
  createdAt?: { gte?: Date; lte?: Date };
  notafiscal?: { some: { prestadorId: string } };
};

export async function buscarTomadores(filtros: TomadorFiltros, pagina = 1, limite = 10) {
  // Construir o objeto de filtro base
  const where: TomadorWhere = {};
  
  // Filtrar por nome/razu00e3o social
  if (filtros.nome) {
    where.razaoSocial = {
      contains: filtros.nome,
      mode: 'insensitive'
    };
  }
  
  // Filtrar por CPF/CNPJ
  if (filtros.cpfCnpj) {
    where.cpfCnpj = {
      contains: filtros.cpfCnpj
    };
  }
  
  // Filtrar por município
  if (filtros.municipioId) {
    where.codigoMunicipio = filtros.municipioId;
  }
  
  // Filtrar por data de criação
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
  
  // Filtrar tomadores que têm relação com o prestador através de notas fiscais
  if (filtros.prestadorId) {
    where.notafiscal = {
      some: {
        prestadorId: filtros.prestadorId
      }
    };
  }
  
  const total = await prisma.tomador.count({ where });
  const totalPaginas = Math.ceil(total / limite);
  
  
  // Simplificando a consulta para não incluir relações
  const tomadores = await prisma.tomador.findMany({
    where,
    select: {
      id: true,
      razaoSocial: true,
      cpfCnpj: true,
      email: true,
      telefone: true,
      codigoMunicipio: true,
      uf: true,
      createdAt: true
    },
    orderBy: {
      razaoSocial: 'asc'
    },
    skip: (pagina - 1) * limite,
    take: limite
  });
  
  
  return {
    tomadores,
    paginacao: {
      pagina,
      limite,
      total,
      totalPaginas
    }
  };
}

export async function buscarTodosTomdores(prestadorId: string) {
  
  return prisma.tomador.findMany({
    where: { 
      notafiscal: {
        some: {
          prestadorId: prestadorId
        }
      }
    },
    select: {
      id: true,
      razaoSocial: true,
      cpfCnpj: true,
      email: true,
      telefone: true,
      codigoMunicipio: true,
      uf: true,
      createdAt: true
    },
    orderBy: {
      razaoSocial: 'asc'
    }
  });
}
