"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import LogsFilter from './LogsFilter';
import LogsTable from './LogsTable';
import Link from 'next/link';

interface Usuario {
  id: string;
  nome: string;
  username: string;
}

interface Prestador {
  id: string;
  razaoSocial: string;
}

interface LogsContainerProps {
  prestador: Prestador;
  usuarios: Usuario[];
}

export default function LogsContainer({ prestador, usuarios }: LogsContainerProps) {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtros, setFiltros] = useState({});
  const [paginacao, setPaginacao] = useState({
    pagina: 1,
    limite: 10,
    total: 0,
    totalPaginas: 0
  });
  const router = useRouter();
  const { user, isMaster, isAdmin } = useAuth();

  useEffect(() => {
    // Verificar se o usuário tem acesso a este prestador
    if (user && !isMaster && !isAdmin) {
      // Redireciona para o dashboard se não tiver acesso
      router.push('/dashboard');
      return;
    }

    if (user && !isMaster && user.prestadorId !== prestador.id) {
      // Redireciona para o dashboard se não tiver acesso a este prestador
      router.push('/dashboard');
      return;
    }

    // Carregar logs iniciais
    buscarLogs({});
  }, [user, isMaster, isAdmin, prestador.id, router]);

  const buscarLogs = async (filtrosParam: any, paginaParam?: number, limiteParam?: number) => {
    setLoading(true);
    try {
      // Construir query string com os filtros
      const params = new URLSearchParams();
      params.append('prestadorId', prestador.id);

      if (filtrosParam.usuarioId) params.append('usuarioId', filtrosParam.usuarioId);
      if (filtrosParam.dataInicio) params.append('dataInicio', filtrosParam.dataInicio);
      if (filtrosParam.dataFim) params.append('dataFim', filtrosParam.dataFim);
      if (filtrosParam.entidade) params.append('entidade', filtrosParam.entidade);
      if (filtrosParam.acao) params.append('acao', filtrosParam.acao);
      if (filtrosParam.tela) params.append('tela', filtrosParam.tela);
      
      // Adicionar parâmetros de paginação
      const pagina = paginaParam || paginacao.pagina;
      const limite = limiteParam || paginacao.limite;
      params.append('pagina', pagina.toString());
      params.append('limite', limite.toString());

      // Fazer a requisição à API
      const response = await fetch(`/api/logs?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error('Erro ao buscar logs');
      }

      const data = await response.json();
      setLogs(data.logs);
      setPaginacao(data.paginacao);
    } catch (error) {
      console.error('Erro ao buscar logs:', error);
      alert('Erro ao buscar logs. Verifique o console para mais detalhes.');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (novosFiltros: any) => {
    setFiltros(novosFiltros);
    // Ao mudar os filtros, voltamos para a primeira página
    buscarLogs(novosFiltros, 1, paginacao.limite);
  };
  
  const handlePageChange = (novaPagina: number) => {
    buscarLogs(filtros, novaPagina, paginacao.limite);
  };
  
  const handleLimiteChange = (novoLimite: number) => {
    // Ao mudar o limite, voltamos para a primeira pu00e1gina
    buscarLogs(filtros, 1, novoLimite);
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Logs do Sistema</h1>
          <p className="text-gray-600">{prestador.razaoSocial}</p>
        </div>
        <div className="flex gap-2">
          <Link 
            href={`/prestadores/${prestador.id}`}
            className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600 transition"
          >
            Voltar
          </Link>
        </div>
      </div>

      <LogsFilter usuarios={usuarios} onFilterChange={handleFilterChange} />
      <LogsTable 
        logs={logs} 
        loading={loading} 
        paginacao={paginacao}
        onPageChange={handlePageChange}
        onLimiteChange={handleLimiteChange}
      />
    </div>
  );
}
