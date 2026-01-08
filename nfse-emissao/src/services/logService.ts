import { randomUUID } from 'crypto';
import { prisma } from '@/lib/prisma';

type LogAction = 'Criar' | 'Editar' | 'Excluir' | 'Transmitir' | 'Cancelar' | 'Login' | 'Logout';

interface LogData {
  usuarioId: string;
  prestadorId: string;
  acao: LogAction;
  entidade: string;
  entidadeId: string;
  descricao: string;
  tela: string;
}

/**
 * Serviço para registrar logs de ações no sistema
 */
export const logService = {
  /**
   * Registra uma ação no log do sistema
   * @param data Dados do log a ser registrado
   * @returns O log criado
   */
  async registrarLog(data: LogData) {
    try {
      const log = await prisma.log.create({
        data: {
          id: randomUUID(),
          usuarioId: data.usuarioId,
          prestadorId: data.prestadorId,
          acao: data.acao,
          entidade: data.entidade,
          entidadeId: data.entidadeId,
          descricao: data.descricao,
          tela: data.tela,
          dataHora: new Date(),
        },
      });

      return log;
    } catch (error) {
      console.error('Erro ao registrar log:', error);
      // Não lançamos o erro para evitar que falhas no log afetem a operação principal
      return null;
    }
  },

  /**
   * Busca logs com filtros e paginação
   * @param prestadorId ID do prestador
   * @param filtros Filtros opcionais
   * @param pagina Número da página (começa em 1)
   * @param limite Quantidade de registros por página
   * @returns Lista de logs e informações de paginação
   */
  async buscarLogs(prestadorId: string, filtros?: {
    usuarioId?: string;
    dataInicio?: Date;
    dataFim?: Date;
    entidade?: string;
    acao?: LogAction;
    tela?: string;
    pagina?: number;
    limite?: number;
  }) {
    try {
      const where: {
        prestadorId: string;
        usuarioId?: string;
        dataHora?: { gte?: Date; lte?: Date };
        entidade?: string;
        acao?: LogAction;
        tela?: string;
      } = {
        prestadorId,
      };

      if (filtros?.usuarioId) {
        where.usuarioId = filtros.usuarioId;
      }

      if (filtros?.dataInicio || filtros?.dataFim) {
        where.dataHora = {};
        
        if (filtros?.dataInicio) {
          where.dataHora.gte = filtros.dataInicio;
        }
        
        if (filtros?.dataFim) {
          where.dataHora.lte = filtros.dataFim;
        }
      }

      if (filtros?.entidade) {
        where.entidade = filtros.entidade;
      }

      if (filtros?.acao) {
        where.acao = filtros.acao;
      }

      if (filtros?.tela) {
        where.tela = filtros.tela;
      }

      // Configurar paginação
      const pagina = filtros?.pagina || 1;
      const limite = filtros?.limite || 10;
      const skip = (pagina - 1) * limite;
      
      // Buscar total de registros para paginação
      const total = await prisma.log.count({ where });
      
      // Buscar logs com paginação
      const logs = await prisma.log.findMany({
        where,
        include: {
          usuario: {
            select: {
              nome: true,
              username: true,
            },
          },
        },
        orderBy: {
          dataHora: 'desc',
        },
        skip,
        take: limite,
      });

      // Calcular informações de paginação
      const totalPaginas = Math.ceil(total / limite);
      
      return {
        logs,
        paginacao: {
          total,
          pagina,
          limite,
          totalPaginas,
        }
      };
    } catch (error) {
      console.error('Erro ao buscar logs:', error);
      throw error;
    }
  },
};
