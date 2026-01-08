'use client';

import { useState } from 'react';
import Link from 'next/link';
import { PlusCircle, Pencil, Trash2, Filter } from 'lucide-react';
import MunicipioDisplay from '@/components/ui/MunicipioDisplay';
import { formatarCnpj } from '@/utils/formatters';
import { toast, Toaster } from 'react-hot-toast';
import { useRouter } from 'next/navigation';

interface Tomador {
  id: string;
  razaoSocial: string;
  cpfCnpj: string;
  tipo: string;
  codigoMunicipio: string;
  uf: string;
  ativo: boolean;
}

interface TomadoresClientProps {
  tomadores: Tomador[];
  filtroAtual: string;
}

export default function TomadoresClient({ tomadores: initialTomadores, filtroAtual = 'ativos' }: TomadoresClientProps) {
  const [tomadores, setTomadores] = useState<Tomador[]>(initialTomadores);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  // Função para inativar/ativar um tomador
  const alterarStatusTomador = async (id: string, ativo: boolean) => {
    const acao = ativo ? 'inativar' : 'ativar';
    if (!confirm(`Tem certeza que deseja ${acao} este tomador?`)) {
      return;
    }

    try {
      setLoading(true);
      // Usar caminhos relativos para evitar problemas com URLs absolutas
      const response = await fetch(`/api/tomadores/update`, {
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
        throw new Error(errorData.error || `Erro ao ${acao} tomador`);
      }

      toast.success(`Tomador ${ativo ? 'inativado' : 'ativado'} com sucesso`);
      
      // Atualizar a lista de tomadores localmente
      setTomadores(tomadores.map(t => 
        t.id === id ? { ...t, ativo: !ativo } : t
      ));
      
      // Recarregar a página para atualizar a lista
      router.refresh();
    } catch (error: any) {
      console.error(`Erro ao ${acao} tomador:`, error);
      toast.error(error.message || `Erro ao ${acao} tomador`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-8">
      <Toaster position="top-right" />
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Tomadores</h1>
        <div className="flex gap-4">
          {/* Filtro de status */}
          <div className="flex items-center gap-2">
            <Filter size={18} className="text-gray-500" />
            <div className="flex border border-gray-300 rounded overflow-hidden">
              <button 
                onClick={() => {
                  // Atualizar a URL sem recarregar a página
                  window.history.pushState({}, '', '/tomadores?filtro=ativos');
                  // Filtrar localmente os tomadores ativos
                  const tomadoresAtivos = initialTomadores.filter(t => t.ativo);
                  setTomadores(tomadoresAtivos);
                }}
                className={`px-3 py-1 text-sm ${filtroAtual === 'ativos' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-100'}`}
              >
                Ativos
              </button>
              <button 
                onClick={() => {
                  // Atualizar a URL sem recarregar a página
                  window.history.pushState({}, '', '/tomadores?filtro=inativos');
                  // Filtrar localmente os tomadores inativos
                  const tomadoresInativos = initialTomadores.filter(t => !t.ativo);
                  setTomadores(tomadoresInativos);
                }}
                className={`px-3 py-1 text-sm ${filtroAtual === 'inativos' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-100'}`}
              >
                Inativos
              </button>
              <button 
                onClick={() => {
                  // Atualizar a URL sem recarregar a página
                  window.history.pushState({}, '', '/tomadores?filtro=todos');
                  // Mostrar todos os tomadores
                  setTomadores(initialTomadores);
                }}
                className={`px-3 py-1 text-sm ${filtroAtual === 'todos' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-100'}`}
              >
                Todos
              </button>
            </div>
          </div>
          
          <Link 
            href="/tomadores/novo" 
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition flex items-center gap-2"
          >
            <PlusCircle size={18} />
            <span>Novo Tomador</span>
          </Link>
        </div>
      </div>
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/4">Razão Social</th>
                <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/6">CPF/CNPJ</th>
                <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/6">Município/UF</th>
                <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/12">Status</th>
                <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/6">Ações</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-4 py-4 text-center text-sm text-gray-500">Carregando...</td>
                </tr>
              ) : tomadores.length > 0 ? (
                tomadores.map((t) => (
                  <tr key={t.id} className={`hover:bg-gray-50 ${!t.ativo ? 'bg-gray-100' : ''}`}>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900 truncate max-w-xs">{t.razaoSocial}</td>
                    <td className="px-3 py-3 text-sm text-gray-500">{formatarCnpj(t.cpfCnpj)}</td>
                    <td className="px-3 py-3 text-sm text-gray-500">
                      <MunicipioDisplay codigoMunicipio={t.codigoMunicipio} uf={t.uf} />
                    </td>
                    <td className="px-3 py-3 text-sm">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${t.ativo ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {t.ativo ? 'Ativo' : 'Inativo'}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-sm font-medium">
                      <div className="flex items-center gap-2">
                        <Link 
                          href={`/tomadores/${t.id}`} 
                          className="text-blue-600 hover:text-blue-900 flex items-center gap-1"
                        >
                          <Pencil size={14} />
                          <span>Editar</span>
                        </Link>
                        <button
                          onClick={() => alterarStatusTomador(t.id, t.ativo)}
                          className={`${t.ativo ? 'text-red-600 hover:text-red-900' : 'text-green-600 hover:text-green-900'} flex items-center gap-1`}
                          disabled={loading}
                        >
                          <Trash2 size={14} />
                          <span>{t.ativo ? 'Inativar' : 'Ativar'}</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-4 py-4 text-center text-sm text-gray-500">Nenhum tomador cadastrado.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
