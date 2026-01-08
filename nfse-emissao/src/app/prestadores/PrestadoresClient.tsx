'use client';

import Link from 'next/link';
import { PlusCircle, Pencil, Users, Trash2, Filter, CreditCard, CheckCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { toast, Toaster } from 'react-hot-toast';

interface Prestador {
  id: string;
  cnpj: string;
  razaoSocial: string;
  inscricaoMunicipal: string;
  ativo: boolean;
  cnpjFormatado?: string;
  customer_id_asaas?: string;
  integrado_asaas?: boolean;
}

interface PrestadoresClientProps {
  prestadores: Prestador[];
  formatarCnpj?: (cnpj: string) => string;
  filtroAtual?: string;
}

export default function PrestadoresClient({ prestadores: initialPrestadores, formatarCnpj, filtroAtual = 'ativos' }: PrestadoresClientProps) {
  const { user, token, isAdmin, isMaster, setIntegradoAsaas } = useAuth();
  const router = useRouter();
  const [prestadores, setPrestadores] = useState(initialPrestadores);
  const [integrando, setIntegrando] = useState<string | null>(null);
  
  // Log para depurar os prestadores recebidos
  useEffect(() => {
    console.log('Prestadores recebidos:', initialPrestadores);
    initialPrestadores.forEach(p => {
      console.log(`Prestador ${p.id} - ${p.razaoSocial}:`, {
        customer_id_asaas: p.customer_id_asaas,
        integrado_asaas: p.integrado_asaas,
        tipo: typeof p.integrado_asaas
      });
    });
  }, [initialPrestadores]);
  
  // Função para integrar um prestador com o ASAAS
  const integrarComAsaas = async (id: string) => {
    if (!confirm('Tem certeza que deseja integrar este prestador com o ASAAS?')) {
      return;
    }

    try {
      setIntegrando(id);
      const response = await fetch('/api/prestadores/integrar-asaas', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({ prestadorId: id }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || errorData.message || 'Erro ao integrar prestador com ASAAS');
      }

      const data = await response.json();
      toast.success('Prestador integrado com o ASAAS com sucesso');
      
      // Atualizar a lista de prestadores localmente
      setPrestadores(prestadores.map(p => 
        p.id === id ? { ...p, integrado_asaas: true, customer_id_asaas: data.customerId } : p
      ));
      
      // Atualizar o contexto global de autenticação
      setIntegradoAsaas(true);

      setTimeout(() => {
        window.location.reload();
      }, 2000);
      
    } catch (error: any) {
      console.error('Erro ao integrar prestador com ASAAS:', error);
      toast.error(error.message || 'Erro ao integrar prestador com ASAAS');
    } finally {
      setIntegrando(null);
    }
  };

  // Função para inativar um prestador
  const inativarPrestador = async (id: string, ativo: boolean) => {
    const acao = ativo ? 'inativar' : 'ativar';
    if (!confirm(`Tem certeza que deseja ${acao} este prestador?`)) {
      return;
    }

    try {
      // Usar caminhos relativos para evitar problemas com URLs absolutas
      const response = await fetch(`/api/prestadores/update`, {
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
        throw new Error(errorData.error || `Erro ao ${acao} prestador`);
      }

      toast.success(`Prestador ${ativo ? 'inativado' : 'ativado'} com sucesso`);
      
      // Atualizar a lista de prestadores localmente
      setPrestadores(prestadores.map(p => 
        p.id === id ? { ...p, ativo: !ativo } : p
      ));
    } catch (error: any) {
      console.error(`Erro ao ${acao} prestador:`, error);
      toast.error(error.message || `Erro ao ${acao} prestador`);
    }
  };

  useEffect(() => {
    // Se não for Master nem Administrador, redireciona para o dashboard
    if (user && !isMaster && !isAdmin) {
      router.push('/dashboard');
    }
  }, [user, isMaster, isAdmin, router]);

  // Filtra os prestadores:
  // - Master: vê todos os prestadores
  // - Administrador: vê apenas o prestador ao qual está vinculado
  const prestadoresFiltrados = isMaster
    ? prestadores
    : prestadores.filter(p => user?.prestadorId === p.id);

  return (
    <div className="w-full p-3">
      <Toaster position="top-right" />
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Prestadores</h1>
        <div className="flex gap-4">
          {/* Filtro de status */}
          <div className="flex items-center gap-2">
            <Filter size={18} className="text-gray-500" />
            <div className="flex border border-gray-300 rounded overflow-hidden">
              <button 
                onClick={() => {
                  // Atualizar a URL sem recarregar a página
                  window.history.pushState({}, '', '/prestadores?filtro=ativos');
                  // Filtrar localmente os prestadores ativos
                  const prestadoresAtivos = initialPrestadores.filter(p => p.ativo);
                  setPrestadores(prestadoresAtivos);
                }}
                className={`px-3 py-1 text-sm ${filtroAtual === 'ativos' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-100'}`}
              >
                Ativos
              </button>
              <button 
                onClick={() => {
                  // Atualizar a URL sem recarregar a página
                  window.history.pushState({}, '', '/prestadores?filtro=inativos');
                  // Filtrar localmente os prestadores inativos
                  const prestadoresInativos = initialPrestadores.filter(p => !p.ativo);
                  setPrestadores(prestadoresInativos);
                }}
                className={`px-3 py-1 text-sm ${filtroAtual === 'inativos' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-100'}`}
              >
                Inativos
              </button>
              <button 
                onClick={() => {
                  // Atualizar a URL sem recarregar a página
                  window.history.pushState({}, '', '/prestadores?filtro=todos');
                  // Mostrar todos os prestadores
                  setPrestadores(initialPrestadores);
                }}
                className={`px-3 py-1 text-sm ${filtroAtual === 'todos' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-100'}`}
              >
                Todos
              </button>
            </div>
          </div>
          
          {/* Apenas usuários Master podem criar novos prestadores */}
          {isMaster && (
            <Link 
              href="/prestadores/novo" 
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition flex items-center gap-2"
            >
              <PlusCircle size={18} />
              <span>Novo Prestador</span>
            </Link>
          )}
        </div>
      </div>
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="overflow-x-auto max-w-full">
          <table className="w-full table-fixed divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-4/12">Razão Social</th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-3/12">CNPJ</th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/12">Status</th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-4/12">Ações</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {prestadoresFiltrados.length > 0 ? (
                prestadoresFiltrados.map((p) => (
                  <tr key={p.id} className={`hover:bg-gray-50 ${!p.ativo ? 'bg-gray-100' : ''}`}>
                    <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">{p.razaoSocial}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 font-mono">{p.cnpjFormatado || (formatarCnpj ? formatarCnpj(p.cnpj) : p.cnpj)}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${p.ativo ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {p.ativo ? 'Ativo' : 'Inativo'}
                      </span>
                    </td>
                    <td className="px-2 py-2 whitespace-nowrap text-sm font-medium">
                      <div className="flex flex-row items-center justify-start space-x-2 flex-nowrap overflow-x-auto min-w-[250px]">
                        <Link 
                          href={`/prestadores/${p.id}`} 
                          className="text-blue-600 hover:text-blue-900 flex items-center gap-0.5 text-xs min-w-fit"
                          title="Emitente"
                        >
                          <Pencil size={12} />
                          <span className="text-xs">Editar</span>
                        </Link>
                        <Link 
                          href={`/prestadores/${p.id}/usuarios`} 
                          className="text-green-600 hover:text-green-900 flex items-center gap-0.5 text-xs min-w-fit"
                          title="Gerenciar usuários"
                        >
                          <Users size={12} />
                          <span className="text-xs">Usuários</span>
                        </Link>
                        <Link 
                          href={`/prestadores/${p.id}/logs`} 
                          className="text-purple-600 hover:text-purple-900 flex items-center gap-0.5 text-xs min-w-fit"
                          title="Visualizar logs"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M12 8v4l3 3"></path>
                            <circle cx="12" cy="12" r="10"></circle>
                          </svg>
                          <span className="text-xs">Logs</span>
                        </Link>
                        {(() => {
                          // Verificar se o prestador está integrado com o ASAAS
                          // Consideramos integrado se tiver customer_id_asaas preenchido OU integrado_asaas for true
                          const estaIntegrado = Boolean(p.customer_id_asaas) || Boolean(p.integrado_asaas === true);
                          
                          // Log para depurar as condições do botão ASAAS
                          console.log(`Renderizando botão para ${p.razaoSocial}:`, {
                            customer_id_asaas: p.customer_id_asaas,
                            tipo_customer_id: typeof p.customer_id_asaas,
                            integrado_asaas: p.integrado_asaas,
                            tipo_integrado: typeof p.integrado_asaas,
                            estaIntegrado: estaIntegrado
                          });
                          
                          if ((isMaster || isAdmin) && !estaIntegrado) {
                            return (
                              <button
                                onClick={() => integrarComAsaas(p.id)}
                                disabled={integrando === p.id}
                                className="text-blue-600 hover:text-blue-900 flex items-center gap-0.5 text-xs min-w-fit"
                                title="Integrar com ASAAS"
                              >
                                <CreditCard size={12} />
                                <span className="text-xs">{integrando === p.id ? 'Integrando...' : 'ASAAS'}</span>
                              </button>
                            );
                          } else if ((isMaster || isAdmin) && estaIntegrado) {
                            return (
                              <div className="text-green-600 flex items-center gap-0.5 text-xs min-w-fit" title="Integrado com ASAAS">
                                <CheckCircle size={12} />
                                <span className="text-xs">Integrado</span>
                              </div>
                            );
                          }
                          return null;
                        })()}
                        {isMaster && (
                          <button
                            onClick={() => inativarPrestador(p.id, p.ativo)}
                            className={`${p.ativo ? 'text-red-600 hover:text-red-900' : 'text-green-600 hover:text-green-900'} flex items-center gap-0.5 text-xs min-w-fit`}
                            title={p.ativo ? 'Inativar prestador' : 'Ativar prestador'}
                          >
                            <Trash2 size={12} />
                            <span className="text-xs">{p.ativo ? 'Inativar' : 'Ativar'}</span>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={3} className="px-6 py-4 text-center text-sm text-gray-500">Nenhum prestador cadastrado.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
