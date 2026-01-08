'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { usePrestador } from '@/contexts/PrestadorContext';
import { listarCobrancasPorCnpj, traduzirStatusCobranca, formatarValor, formatarData } from '@/services/asaasService';
import { AsaasCobranca } from '@/services/asaasService';
import { CreditCard, FileText, RefreshCw, AlertCircle, X, Search, CheckCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { toast } from 'react-hot-toast';
import Select from 'react-select';

// Tipos de status disponíveis no ASAAS
const statusOptions = [
  { value: '', label: 'Todos' },
  { value: 'PENDING', label: 'Pendentes' },
  { value: 'RECEIVED', label: 'Pagos' },
];

// Estilos personalizados para o Select
const selectStyles = {
  control: (base: any) => ({
    ...base,
    height: '40px',
    minHeight: '40px',
    borderColor: '#e5e7eb',
    '&:hover': {
      borderColor: '#3b82f6'
    },
    boxShadow: 'none'
  }),
  option: (base: any, state: any) => ({
    ...base,
    backgroundColor: state.isSelected ? '#3b82f6' : state.isFocused ? '#e5e7eb' : 'white',
    color: state.isSelected ? 'white' : 'black'
  }),
  valueContainer: (base: any) => ({
    ...base,
    padding: '0 8px'
  }),
  input: (base: any) => ({
    ...base,
    margin: 0,
    padding: 0
  })
};

// Opções de itens por página
const itensPorPaginaOptions = [10, 20, 50, 100];

export default function MensalidadesPage() {
  const { user, isAdmin, integradoAsaas } = useAuth();
  const { prestador } = usePrestador();
  const router = useRouter();

  // Estados para os dados
  const [cobrancas, setCobrancas] = useState<AsaasCobranca[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Estados para filtros
  const [dataInicio, setDataInicio] = useState<string>(
    format(new Date(new Date().getFullYear(), 0, 1), 'yyyy-MM-dd') // 1º de janeiro do ano atual
  );
  const [dataFim, setDataFim] = useState<string>(
    format(new Date(new Date().getFullYear(), 11, 31), 'yyyy-MM-dd') // 31 de dezembro do ano atual
  );
  const [statusFiltro, setStatusFiltro] = useState<string>('PENDING');

  // Estados para paginação
  const [paginaAtual, setPaginaAtual] = useState<number>(1);
  const [itensPorPagina, setItensPorPagina] = useState<number>(20);
  const [totalItens, setTotalItens] = useState<number>(0);
  const [totalPaginas, setTotalPaginas] = useState<number>(1);

  // Verificar se o usuário tem permissão para acessar esta página
  useEffect(() => {
    // Verificar se a autenticação já foi carregada e se o usuário não é administrador
    if (user !== null && !isAdmin) {
      console.log('Usuário não é administrador, redirecionando para o dashboard');
      router.push('/dashboard');
    }
  }, [isAdmin, router, user]);

  // Limpar todos os filtros
  const limparFiltros = () => {
    setDataInicio(format(new Date(new Date().getFullYear(), 0, 1), 'yyyy-MM-dd')); // 1º de janeiro do ano atual
    setDataFim(format(new Date(new Date().getFullYear(), 11, 31), 'yyyy-MM-dd')); // 31 de dezembro do ano atual
    setStatusFiltro('PENDING');
    setPaginaAtual(1);
  };

  // Obter o ID do cliente ASAAS do prestador
  const getCustomerIdAsaas = () => {
    // Verificar no objeto prestador
    if (prestador?.customer_id_asaas) {
      return prestador.customer_id_asaas;
    }

    // Verificar no objeto do usuário
    if (user?.prestador?.customer_id_asaas) {
      return user.prestador.customer_id_asaas;
    }

    // Se não encontrar, usar um valor padrão para testes
    return '';
  };

  // Carregar as cobranças
  const carregarCobrancas = async () => {
    if (!prestador?.cnpj) {
      setLoading(false);
      setError('Selecione um prestador para visualizar as mensalidades.');
      return;
    }

    setLoading(true);
    setError(null);

    // Verificar se o prestador está integrado ao ASAAS
    if (!integradoAsaas) {
      setError('Este prestador não está integrado ao ASAAS. Por favor, faça a integração na página de prestadores.');
      setLoading(false);
      return;
    }

    try {
      // Calcular offset para paginação
      const offset = (paginaAtual - 1) * itensPorPagina;

      // Construir parâmetros para a requisição
      const params = new URLSearchParams();
      params.append('offset', offset.toString());
      params.append('limit', itensPorPagina.toString());

      if (statusFiltro) {
        params.append('status', statusFiltro);
      }

      // Obter o ID do cliente ASAAS
      const customerId = getCustomerIdAsaas();

      const response = await listarCobrancasPorCnpj(customerId, dataInicio, dataFim, params);
      setCobrancas(response.data);
      setTotalItens(response.totalCount);
      setTotalPaginas(Math.ceil(response.totalCount / itensPorPagina));
    } catch (err) {
      console.error('Erro ao carregar cobranças:', err);
      setError('Não foi possível carregar as mensalidades. Por favor, tente novamente mais tarde.');
    } finally {
      setLoading(false);
    }
  };

  // Efeito para verificar a integração do prestador com o ASAAS ao carregar a página
  useEffect(() => {
    if (prestador?.id && integradoAsaas) {
      // Se o prestador estiver integrado, podemos carregar as mensalidades
      carregarCobrancas();
    }
  }, [prestador, integradoAsaas]);

  // Efeito para carregar cobranças quando os filtros ou a paginação mudam
  useEffect(() => {
    if (prestador?.cnpj) {
      carregarCobrancas();
    }
  }, [prestador, dataInicio, dataFim, statusFiltro, paginaAtual, itensPorPagina]);

  // Função para mudar de página
  const mudarPagina = (novaPagina: number) => {
    setPaginaAtual(novaPagina);
  };

  // Função para abrir o boleto em uma nova aba
  const abrirBoleto = (cobranca: AsaasCobranca) => {
    if (cobranca.bankSlipUrl) {
      window.open(cobranca.bankSlipUrl, '_blank');
    } else {
      toast.error('Link do boleto não disponível.');
    }
  };

  // Função para redirecionar para a página de pagamento com cartão
  const pagarComCartao = (cobrancaId: string) => {
    router.push(`/mensalidades/cartao/${cobrancaId}`);
  };

  // Função para obter a cor do badge com base no status
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'RECEIVED':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'CONFIRMED':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'OVERDUE':
        return 'bg-red-100 text-red-800 border-red-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-6">
        <h1 className="text-2xl font-bold mb-6">Mensalidades</h1>

        {error && !integradoAsaas && (
          <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6" role="alert">
            <div className="flex items-center">
              <AlertCircle className="h-5 w-5 mr-2" />
              <p>{error}</p>
            </div>
          </div>
        )}

        {integradoAsaas && prestador?.id && (
          <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 mb-6" role="alert">
            <div className="flex items-center">
              <CheckCircle className="h-5 w-5 mr-2" />
              <p>Este prestador já está integrado com o ASAAS. ID do cliente: {getCustomerIdAsaas()}</p>
            </div>
          </div>
        )}

        <div className="mb-6 bg-white py-4 px-4 rounded-lg shadow">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              setPaginaAtual(1);
              carregarCobrancas();
            }}
            className="flex items-end gap-3 flex-wrap"
          >
            <div className="flex flex-col">
              <label htmlFor="dataInicio" className="text-sm font-medium text-gray-700 mb-1">Data Início</label>
              <input
                type="date"
                id="dataInicio"
                value={dataInicio}
                onChange={(e) => setDataInicio(e.target.value)}
                className="h-10 rounded-md border border-gray-300 px-3 focus:border-blue-500 focus:ring-blue-500"
              />
            </div>

            <div className="flex flex-col">
              <label htmlFor="dataFim" className="text-sm font-medium text-gray-700 mb-1">Data Fim</label>
              <input
                type="date"
                id="dataFim"
                value={dataFim}
                onChange={(e) => setDataFim(e.target.value)}
                className="h-10 rounded-md border border-gray-300 px-3 focus:border-blue-500 focus:ring-blue-500"
              />
            </div>

            <div className="flex flex-col">
              <label htmlFor="status" className="text-sm font-medium text-gray-700 mb-1">Status</label>
              <Select
                id="status"
                instanceId="status-select"
                options={statusOptions}
                value={statusOptions.find(option => option.value === statusFiltro)}
                onChange={(option) => setStatusFiltro(option?.value !== undefined ? option.value : 'PENDING')}
                styles={selectStyles}
                placeholder="Selecione o status"
                className="w-full"
                isSearchable={false}
              />
            </div>

            <button
              type="submit"
              className="h-10 rounded-md bg-blue-600 px-4 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 flex items-center gap-2"
            >
              <Search className="h-4 w-4" />
              <span>Buscar</span>
            </button>

            <button
              type="button"
              onClick={limparFiltros}
              className="h-10 rounded-md bg-gray-100 px-4 text-gray-700 hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 flex items-center gap-2"
            >
              <X className="h-4 w-4" />
              <span>Limpar</span>
            </button>

            <button
              type="button"
              className="h-10 rounded-md bg-green-600 px-4 text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 ml-auto flex items-center gap-2"
              onClick={carregarCobrancas}
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              <span>Atualizar</span>
            </button>
          </form>
        </div>

        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            {loading ? (
              <div className="p-8 text-center">
                <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent">
                  <span className="sr-only">Carregando...</span>
                </div>
                <p className="mt-2 text-gray-600">Carregando mensalidades...</p>
              </div>
            ) : cobrancas.length === 0 ? (
              <div className="p-8 text-center">
                <p className="text-gray-600">Nenhuma mensalidade encontrada para o período selecionado.</p>
              </div>
            ) : (
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Vencimento
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Valor
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Descrição
                    </th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {cobrancas.map((cobranca) => (
                    <tr key={cobranca.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatarData(cobranca.dueDate)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatarValor(cobranca.value)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getStatusColor(cobranca.status)}`}>
                          {traduzirStatusCobranca(cobranca.status)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {cobranca.description || 'Mensalidade'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        {cobranca.status === 'PENDING' && (
                          <div className="flex justify-end gap-2">
                            {cobranca.bankSlipUrl && (
                              <button
                                onClick={() => abrirBoleto(cobranca)}
                                className="text-blue-600 hover:text-blue-900 flex items-center gap-1"
                                title="Visualizar boleto"
                              >
                                <FileText className="h-4 w-4" />
                                <span>Boleto</span>
                              </button>
                            )}
                            <button
                              onClick={() => pagarComCartao(cobranca.id)}
                              className="text-green-600 hover:text-green-900 flex items-center gap-1"
                              title="Pagar com cartão"
                            >
                              <CreditCard className="h-4 w-4" />
                              <span>Cartão</span>
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {!loading && cobrancas.length > 0 && (
            <div className="px-6 py-4 flex flex-wrap items-center justify-between bg-gray-50 border-t border-gray-200">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <select
                    value={itensPorPagina}
                    onChange={(e) => {
                      setItensPorPagina(Number(e.target.value));
                      setPaginaAtual(1);
                    }}
                    className="h-8 rounded-md border border-gray-300 bg-white text-sm focus:border-blue-500 focus:ring-blue-500"
                  >
                    {itensPorPaginaOptions.map(option => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </select>
                  <span className="text-sm text-gray-600">itens por página</span>
                </div>
                <div className="text-sm text-gray-600">
                  Total: <span className="font-medium">{totalItens}</span> registros
                </div>
              </div>

              <div className="flex items-center gap-6">
                <div className="text-sm text-gray-600">
                  Página <span className="font-medium">{paginaAtual}</span> de <span className="font-medium">{totalPaginas}</span>
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => mudarPagina(1)}
                    disabled={paginaAtual === 1}
                    className="p-1 rounded text-gray-500 hover:bg-gray-100 disabled:opacity-50 disabled:hover:bg-transparent cursor-pointer"
                    title="Primeira página"
                    type="button"
                  >
                    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
                    </svg>
                  </button>
                  <button
                    onClick={() => mudarPagina(paginaAtual - 1)}
                    disabled={paginaAtual === 1}
                    className="p-1 rounded text-gray-500 hover:bg-gray-100 disabled:opacity-50 disabled:hover:bg-transparent cursor-pointer"
                    title="Página anterior"
                    type="button"
                  >
                    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                  <button
                    onClick={() => mudarPagina(paginaAtual + 1)}
                    disabled={paginaAtual >= totalPaginas}
                    className="p-1 rounded text-gray-500 hover:bg-gray-100 disabled:opacity-50 disabled:hover:bg-transparent cursor-pointer"
                    title="Próxima página"
                    type="button"
                  >
                    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                  <button
                    onClick={() => mudarPagina(totalPaginas)}
                    disabled={paginaAtual >= totalPaginas}
                    className="p-1 rounded text-gray-500 hover:bg-gray-100 disabled:opacity-50 disabled:hover:bg-transparent cursor-pointer"
                    title="Última página"
                    type="button"
                  >
                    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
