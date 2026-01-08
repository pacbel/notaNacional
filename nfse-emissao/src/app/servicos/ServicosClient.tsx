'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Eye, Pencil, PlusCircle, Trash2, Filter } from 'lucide-react';
import { toast, Toaster } from 'react-hot-toast';
import { useRouter } from 'next/navigation';

import { Servico } from '@/types/servico';

interface ServicosClientProps {
  servicos: Servico[];
  filtroAtual: string;
}

export default function ServicosClient({ servicos: initialServicos, filtroAtual = 'ativos' }: ServicosClientProps) {
  const [servicos, setServicos] = useState<Servico[]>(initialServicos);

  // Atualiza o estado local sempre que initialServicos mudar
  useEffect(() => {
    setServicos(initialServicos);
  }, [initialServicos]);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  // Função para inativar/ativar um serviço
  const alterarStatusServico = async (id: string, ativo: boolean) => {
    const acao = ativo ? 'inativar' : 'ativar';
    if (!confirm(`Tem certeza que deseja ${acao} este serviço?`)) {
      return;
    }

    try {
      setLoading(true);
      // Usar caminhos relativos para evitar problemas com URLs absolutas
      const response = await fetch(`/api/servicos/update`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id,
          ativo: !ativo
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Erro ao ${acao} serviço`);
      }

      toast.success(`Serviço ${ativo ? 'inativado' : 'ativado'} com sucesso`);
      
      // Atualizar a lista de serviços localmente
      setServicos(servicos.map(s => 
        s.id === id ? { ...s, ativo: !ativo } : s
      ));
      
      // Recarregar a página para atualizar a lista
      router.refresh();
    } catch (error: any) {
      console.error(`Erro ao ${acao} serviço:`, error);
      toast.error(error.message || `Erro ao ${acao} serviço`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-full overflow-hidden py-4">
      <Toaster position="top-right" />
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 sm:gap-0 mb-4 px-2">
        <h1 className="text-2xl font-bold">Serviços</h1>
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          {/* Filtro de status */}
          <div className="flex items-center gap-1 w-full sm:w-auto">
            <Filter size={16} className="text-gray-500 hidden sm:block" />
            <div className="flex border border-gray-300 rounded overflow-hidden w-full sm:w-auto">
              <button 
                onClick={() => {
                  // Redirecionar para a URL com o filtro atualizado
                  router.push('/servicos?filtro=ativos');
                }}
                className={`px-3 py-1 text-sm ${filtroAtual === 'ativos' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-100'}`}
              >
                Ativos
              </button>
              <button 
                onClick={() => {
                  // Redirecionar para a URL com o filtro atualizado
                  router.push('/servicos?filtro=inativos');
                }}
                className={`px-3 py-1 text-sm ${filtroAtual === 'inativos' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-100'}`}
              >
                Inativos
              </button>
              <button 
                onClick={() => {
                  // Redirecionar para a URL com o filtro atualizado
                  router.push('/servicos?filtro=todos');
                  // A página será recarregada com todos os serviços
                }}
                className={`px-3 py-1 text-sm ${filtroAtual === 'todos' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-100'}`}
              >
                Todos
              </button>
            </div>
          </div>
          
          <Link 
            href="/servicos/novo" 
            className="flex items-center justify-center gap-1 bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-md w-full sm:w-auto text-sm"
          >
            <PlusCircle size={16} />
            <span>Novo Serviço</span>
          </Link>
        </div>
      </div>
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="overflow-x-auto w-full rounded-lg">
          <table className="w-full divide-y divide-gray-200 table-fixed">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-2 sm:px-4 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[40%]">Descrição</th>
                <th scope="col" className="px-2 sm:px-4 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell w-[15%]">Valor</th>
                
                <th scope="col" className="px-2 sm:px-4 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[10%]">Status</th>
                <th scope="col" className="px-2 sm:px-4 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[20%]">Ações</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-4 text-center text-sm text-gray-500">Carregando...</td>
                </tr>
              ) : servicos.length > 0 ? (
                servicos.map((s) => (
                  <tr key={s.id} className={`hover:bg-gray-50 ${!s.ativo ? 'bg-gray-100' : ''}`}>
                    <td className="px-2 sm:px-4 py-2 sm:py-3 text-sm font-medium text-gray-900 truncate">{s.descricao}</td>
                    <td className="px-2 sm:px-4 py-2 sm:py-3 text-sm font-medium text-gray-900 hidden sm:table-cell">
                      {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(s.valorUnitario || 0)}
                    </td>
                    
                    <td className="px-2 sm:px-4 py-2 sm:py-3 text-sm">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${s.ativo ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {s.ativo ? 'Ativo' : 'Inativo'}
                      </span>
                    </td>
                    <td className="px-2 sm:px-4 py-2 sm:py-3 text-sm font-medium">
                      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-1 sm:gap-2 w-full sm:w-auto">
                        <Link 
                          href={`/servicos/visualizar/${s.id}`} 
                          className="text-gray-600 hover:text-gray-900 flex items-center gap-1"
                          aria-label="Visualizar serviço"
                        >
                          <Eye size={14} />
                          <span className="hidden sm:inline text-xs">Ver</span>
                        </Link>
                        <Link 
                          href={`/servicos/${s.id}`} 
                          className="text-blue-600 hover:text-blue-900 flex items-center gap-1"
                          aria-label="Editar serviço"
                        >
                          <Pencil size={14} />
                          <span className="hidden sm:inline text-xs">Editar</span>
                        </Link>
                        <button
                          onClick={() => alterarStatusServico(s.id, s.ativo)}
                          className={`${s.ativo ? 'text-red-600 hover:text-red-900' : 'text-green-600 hover:text-green-900'} flex items-center gap-1`}
                          disabled={loading}
                          aria-label={s.ativo ? 'Inativar serviço' : 'Ativar serviço'}
                        >
                          <Trash2 size={14} />
                          <span className="hidden sm:inline text-xs">{s.ativo ? 'Inativar' : 'Ativar'}</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="px-6 py-4 text-center text-sm text-gray-500">Nenhum serviço cadastrado.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}