
'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { usePrestador } from '@/contexts/PrestadorContext';
import { useCertificate } from '@/contexts/CertificateContext';
import { toast } from 'react-toastify';
import { PlusCircle, FileText, Eye, Search, Send } from 'lucide-react';
import { CancelarNfseModal } from '@/components/nfse/CancelarNfseModal';
import { baixarDANFSe } from '@/lib/nfse-nacional/localClient';
import { transmitirNota } from '@/utils/nfeFluxo';

type NotaFiscal = {
  id: string;
  numero: string;
  serie?: string;
  dataEmissao: string;
  valorServicos: number;
  protocolo?: string;
  status?: string;
  nfseXML?: string;
  arquivoNfse?: string;
  chaveAcesso?: string | null;
  prestador: {
    razaoSocial: string;
    cnpj: string;
    ambiente?: number;
  };
  tomador: {
    razaoSocial: string;
  };
};

type PaginationData = {
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

export default function NFSePage() {
  const [acoesLoading, setAcoesLoading] = useState(false);
  const [notasFiscais, setNotasFiscais] = useState<NotaFiscal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [transmitindo, setTransmitindo] = useState<string | null>(null);
  
  const [showCancelarModal, setShowCancelarModal] = useState(false);
  const [notaSelecionada, setNotaSelecionada] = useState<NotaFiscal | null>(null);
  const [pagination, setPagination] = useState<PaginationData>({ total: 0, page: 1, pageSize: 10, totalPages: 0 });
  const [filtro, setFiltro] = useState('');
  const [status, setStatus] = useState('');
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');
  const { isAuthenticated, user } = useAuth();
  const { prestador } = usePrestador();
  const router = useRouter();
  const { openModal: openCertModal } = useCertificate();
  const firstRender = useRef(true);

  async function fetchData() {
    try {
      setLoading(true);
      setError(null); // Limpa erros anteriores

      // Formatar as datas para garantir consistência
      const formattedDataInicio = dataInicio ? new Date(dataInicio).toISOString().split('T')[0] : '';
      const formattedDataFim = dataFim ? new Date(dataFim).toISOString().split('T')[0] : '';

      const params = new URLSearchParams({
        page: pagination.page.toString(),
        pageSize: pagination.pageSize.toString(),
        ...(filtro && { filtro }),
        ...(status && { status }),
        ...(formattedDataInicio && { dataInicio: formattedDataInicio }),
        ...(formattedDataFim && { dataFim: formattedDataFim })
      });

      try {
        const response = await fetch(`/api/nfse/listar?${params}`);
        let data: any = null;
        try {
          data = await response.json();
        } catch {
          // fallback para texto quando a resposta não é JSON
          const text = await response.text().catch(() => '');
          data = { error: text || 'Resposta inválida do servidor' };
        }

        if (!response.ok) {
          throw new Error(data.error || 'Erro ao buscar notas fiscais');
        }

        // Verifica se os dados retornados estão no formato esperado
        if (!data?.data || !data?.pagination) {
          throw new Error('Formato de resposta inválido');
        }

        setNotasFiscais(data.data || []);
        setPagination(prev => ({
          ...prev,
          total: data.pagination?.total || 0,
          totalPages: data.pagination?.totalPages || 0
        }));
      } catch (fetchError) {
        if (fetchError instanceof TypeError && fetchError.message.includes('fetch')) {
          setError('Servidor indisponível. Verifique se o servidor está rodando.');
          console.error('Erro de conexão com o servidor:', fetchError);
        } else {
          setError('Erro ao buscar notas fiscais. Tente novamente mais tarde.');
          console.error('Erro ao buscar notas fiscais:', fetchError);
        }
      }
    } catch (error) {
      setError('Ocorreu um erro inesperado. Tente novamente mais tarde.');
      console.error('Erro inesperado:', error);
    } finally {
      setLoading(false);
    }
  }

  // Efeito inicial para carregar os dados
  useEffect(() => {
    fetchData();
  }, []); // Executa apenas uma vez ao montar o componente

  // Efeito para mudanças na página e tamanho da página
  useEffect(() => {
    if (!firstRender.current) { // Evita a chamada inicial
      fetchData();
    }
  }, [pagination.page, pagination.pageSize]);

  const isValidDate = (dateString: string) => {
    const date = new Date(dateString);
    return date instanceof Date && !isNaN(date.getTime());
  };

  // Validação de datas antes de fazer a busca
  const validateDates = () => {
    if (dataInicio && !isValidDate(dataInicio)) {
      alert('Data Início inválida');
      return false;
    }

    if (dataFim && !isValidDate(dataFim)) {
      alert('Data Fim inválida');
      return false;
    }

    if (dataInicio && dataFim && new Date(dataInicio) > new Date(dataFim)) {
      alert('Data Início não pode ser maior que Data Fim');
      return false;
    }

    return true;
  };

  // Efeito para carregar dados iniciais
  useEffect(() => {
    fetchData();
    firstRender.current = false;
  }, []);

  // Debounce para o filtro de texto
  useEffect(() => {
    if (firstRender.current) return;

    // Filtra automaticamente quando o texto muda
    const timer = setTimeout(async () => {
      setPagination(prev => ({ ...prev, page: 1 }));
      await fetchData();
    }, 300);

    return () => clearTimeout(timer);
  }, [filtro]); // Observa apenas mudanças no filtro de texto

  // Monitora mudanças nos outros filtros (status, dataInicio, dataFim)
  useEffect(() => {
    // Não executa na primeira renderização
    if (firstRender.current) {
      return;
    }

    // Quando qualquer filtro muda, atualiza o botão para indicar que precisa ser clicado
  }, [status, dataInicio, dataFim]);

  // Handler para o botão buscar (aplica todos os filtros)
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateDates()) {
      setPagination(prev => ({ ...prev, page: 1 }));
      // Garantir que as datas sejam formatadas corretamente para o backend
      fetchData();
    }
  };

  const handlePageChange = (newPage: number) => {
    setPagination(prev => ({ ...prev, page: newPage }));
  };

  const handlePageSizeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newSize = parseInt(e.target.value);
    setPagination(prev => ({ ...prev, pageSize: newSize, page: 1 }));
  };

  // Função para limpar todos os filtros
  const handleClearFilters = () => {
    setFiltro('');
    setStatus('');
    setDataInicio('');
    setDataFim('');
    setPagination(prev => ({ ...prev, page: 1 }));
    // Buscar dados sem filtros
    fetchData();
  };

  function openPdfDirect(nf: NotaFiscal) {
    try {
      const cert = (typeof window !== 'undefined') ? (localStorage.getItem('nfse_cert_thumbprint') || '') : '';
      if (!cert) {
        toast.warning('Defina o certificado antes de visualizar o PDF.');
        return;
      }
      const chave = nf.chaveAcesso || '';
      if (!chave || chave.length !== 50) {
        toast.warning('Chave de acesso indisponível para esta nota.');
        return;
      }
      const ambienteEfetivo = (prestador?.ambiente === 1 || prestador?.ambiente === 2) ? prestador.ambiente : 2;
      const url = `/api/nfse/danfse?chave=${encodeURIComponent(chave)}&ambiente=${ambienteEfetivo}&certificateId=${encodeURIComponent(cert)}`;
      window.open(url, '_blank');
    } catch (e: any) {
      toast.error(e?.message || 'Falha ao abrir PDF');
    }
  }

  function onVisualizar(nf: NotaFiscal) {
    if (acoesLoading) return;
    const chave = nf.chaveAcesso || '';
    if (chave && chave.length === 50) {
      openPdfDirect(nf);
      return;
    }
    toast.warning('Não há chave de acesso para esta nota. Visualização do PDF disponível apenas após autorização.');
  }

  async function handleTransmitirNota(notaId: string) {
    if (transmitindo) return;

    try {
      setAcoesLoading(true);
      setTransmitindo(notaId);

      // Obter o resultado dentro do bloco try
      const resultado = await transmitirNota(notaId);

      if (resultado?.success) {
        toast.success(resultado.message || 'Nota transmitida com sucesso', {
          onClose: () => {
            // Atualiza o grid após o fechamento do toast
            fetchData();
          },
          autoClose: 3000,
        });
      } else {
        // Se não for bem-sucedido, mas não lançou exceção
        if (Array.isArray(resultado.errors) && resultado.errors.length > 0) {
          // Exibir um toast para cada erro na lista
          resultado.errors.forEach(erro => {
            toast.error(erro);
          });
        } else {
          // Caso não haja erros específicos, exibir mensagem genérica
          toast.error('Erro ao transmitir a nota');
        }
      }
      setAcoesLoading(false);
    } catch (error) {
      console.error('Erro ao transmitir nota:', error);
      toast.error('Erro inesperado ao transmitir a nota!');
    } finally {
      setTransmitindo(null);
      setAcoesLoading(false);
    }
  };


  return (
    <div className="w-full py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Notas Fiscais de Serviço</h1>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={openCertModal}
            className="bg-white border border-gray-300 text-gray-700 px-3 py-2 rounded hover:bg-gray-50 transition flex items-center gap-2"
            title="Trocar certificado"
          >
            <span>Trocar certificado</span>
          </button>
          <Link
            href="/nfse/novo"
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition flex items-center gap-2 cursor-pointer"
          >
            <PlusCircle size={18} />
            <span>Nova NFS-e</span>
          </Link>
        </div>
      </div>

      <div className="mb-6 bg-white py-4 px-2 rounded-lg shadow">
        <form onSubmit={handleSearch} className="flex items-end gap-3">
          <div>
            <label htmlFor="filtro" className="block text-sm font-medium text-gray-700">
              Filtro
            </label>
            <input
              type="text"
              id="filtro"
              value={filtro}
              onChange={(e) => setFiltro(e.target.value)}
              placeholder="Número/Série/Tomador"
              className="h-9 w-64 rounded-md border border-gray-300 bg-white px-2 py-1 text-sm shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div className="w-36">
            <label className="block text-sm font-medium text-gray-700">
              Status
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="h-9 w-full rounded-md border border-gray-300 bg-white px-2 py-1 text-sm shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            >
              <option value="">Todos</option>
              <option value="0">Não Transmitida</option>
              <option value="1">Autorizada</option>
              <option value="2">Cancelada</option>
              <option value="3">Em Espera</option>
              <option value="4">Rejeitada</option>
              <option value="5">Processando</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Data Início
            </label>
            <input
              type="date"
              value={dataInicio}
              onChange={(e) => {
                const value = e.target.value;
                if (!value || isValidDate(value)) {
                  setDataInicio(value);
                }
              }}
              className="h-9 w-36 rounded-md border border-gray-300 bg-white px-2 py-1 text-sm shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              min="1900-01-01"
              max="9999-12-31"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Data Fim
            </label>
            <input
              type="date"
              value={dataFim}
              onChange={(e) => {
                const value = e.target.value;
                if (!value || isValidDate(value)) {
                  setDataFim(value);
                }
              }}
              className="h-9 w-36 rounded-md border border-gray-300 bg-white px-2 py-1 text-sm shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              min="1900-01-01"
              max="9999-12-31"
            />
          </div>

          <div className="flex gap-2">
            <button
              type="submit"
              className="h-9 px-4 rounded-md bg-blue-600 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 flex items-center gap-2 cursor-pointer"
            >
              <Search size={16} />
              <span>Buscar</span>
            </button>
            <button
              type="button"
              onClick={handleClearFilters}
              className="h-9 px-4 rounded-md bg-gray-200 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 flex items-center gap-2 cursor-pointer"
            >
              <span>Limpar</span>
            </button>
          </div>
        </form>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4 flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          <span>{error}</span>
        </div>
      )}

      <div className="bg-white shadow rounded-lg">
        <div className="overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-1 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">NÚMERO</th>
                <th scope="col" className="px-1 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell">Data Emissão</th>
                <th scope="col" className="px-1 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">Tomador</th>
                <th scope="col" className="px-1 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell">Valor</th>
                <th scope="col" className="px-1 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th scope="col" className="px-1 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-2 py-4 text-center text-sm text-gray-500">Carregando...</td>
                </tr>
              ) : notasFiscais.length > 0 ? (
                notasFiscais.map((nf) => (
                  <tr key={nf.id} className="hover:bg-gray-50">
                    <td className="px-2 py-2 text-sm font-medium text-gray-900">
                      <span>{nf.numero}/{nf.serie}</span>
                    </td>
                    <td className="px-2 py-2 text-sm text-gray-500 hidden sm:table-cell">
                      {new Date(nf.dataEmissao).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}
                    </td>
                    <td className="px-2 py-2 text-sm text-gray-500 hidden md:table-cell">
                      <span className="line-clamp-1">{nf.tomador?.razaoSocial}</span>
                    </td>
                    <td className="px-2 py-2 text-sm text-gray-500 hidden sm:table-cell text-right">
                      {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(nf.valorServicos)}
                    </td>

                    <td className="px-2 py-2 text-sm text-gray-500">
                      <div className="flex">
                        <span className={`px-2 py-1 inline-block text-xs leading-5 font-semibold rounded ${nf.status === '1' ? 'bg-green-100 text-green-800' :
                          nf.status === '2' ? 'bg-red-100 text-red-800' :
                            nf.status === '3' ? 'bg-blue-100 text-blue-800' :
                              nf.status === '4' ? 'bg-red-100 text-red-800' :
                                nf.status === '5' ? 'bg-yellow-100 text-yellow-800' :
                                  'bg-yellow-100 text-yellow-800'
                          }`}>
                          {nf.status === '0' ? 'Não Transmitida' :
                            nf.status === '1' ? 'Autorizada' :
                              nf.status === '2' ? 'Cancelada' :
                                nf.status === '3' ? 'Em Espera' :
                                  nf.status === '4' ? 'Rejeitada' :
                                    nf.status === '5' ? 'Processando' :
                                      'Erro'}
                        </span>
                      </div>
                    </td>
                    <td className="px-2 py-2 text-sm font-medium text-right">
                      <div className="inline-flex justify-end gap-1">
                        {/* Botão Editar - coluna 1 */}
                        <div className="text-center">
                          <div className="relative group inline-block">
                            <Link
                              href={nf.status === '0' && !acoesLoading ? `/nfse/${nf.id}/editar` : '#'}
                              className={`inline-flex items-center justify-center p-1 bg-white border border-gray-300 rounded-md shadow-sm ${(nf.status === '0' && !acoesLoading) ? 'hover:bg-gray-50 cursor-pointer' : 'cursor-not-allowed'}`}
                              title="Editar"
                              onClick={(e) => nf.status !== '0' && e.preventDefault()}
                            >
                              <span className="w-5 h-5 flex items-center justify-center">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className={`${nf.status === '0' ? 'text-yellow-600' : 'text-gray-400'}`} viewBox="0 0 16 16">
                                  <path d="M12.146.146a.5.5 0 0 1 .708 0l3 3a.5.5 0 0 1 0 .708l-10 10a.5.5 0 0 1-.168.11l-5 2a.5.5 0 0 1-.65-.65l2-5a.5.5 0 0 1 .11-.168l10-10zM11.207 2.5 13.5 4.793 14.793 3.5 12.5 1.207 11.207 2.5zm1.586 3L10.5 3.207 4 9.707V10h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.293l6.5-6.5zm-9.761 5.175-.106.106-1.528 3.821 3.821-1.528.106-.106A.5.5 0 0 1 5 12.5V12h-.5a.5.5 0 0 1-.5-.5V11h-.5a.5.5 0 0 1-.468-.325z" />
                                </svg>
                              </span>
                            </Link>
                            <div className="absolute z-10 invisible group-hover:visible bg-gray-800 text-white text-xs rounded py-1 px-2 right-0 bottom-full mb-1 whitespace-nowrap">
                              Editar
                            </div>
                          </div>
                        </div>

                        {/* Botão Transmitir - coluna 2 */}
                        <div className="text-center">
                          <div className="relative group inline-block">
                            <button
                              onClick={() => {
                                if (nf.status === '0' && !acoesLoading) handleTransmitirNota(nf.id);
                              }}
                              disabled={acoesLoading || transmitindo === nf.id || nf.status !== '0'}
                              className="inline-flex items-center justify-center p-1 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 cursor-pointer disabled:opacity-100 disabled:cursor-not-allowed relative disabled:bg-white disabled:border-gray-300"
                            >
                              {/* Ícone mantém o espaço para não deformar ao carregar */}
                              <span className={`w-5 h-5 flex items-center justify-center ${transmitindo === nf.id ? 'opacity-0' : ''}`}>
                                <Send className={`h-4 w-4 ${nf.status === '0' ? 'text-blue-600' : 'text-gray-400'}`} />
                              </span>
                              {/* Spinner sobreposto sem alterar layout */}
                              {transmitindo === nf.id && (
                                <div className="absolute inset-0 flex items-center justify-center">
                                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-blue-200 border-t-blue-600"></div>
                                </div>
                              )}
                            </button>
                            <div className="absolute z-10 invisible group-hover:visible bg-gray-800 text-white text-xs rounded py-1 px-2 right-0 bottom-full mb-1 whitespace-nowrap">
                              Transmitir
                            </div>
                          </div>
                        </div>

                        {/* Botão Visualizar - coluna 3 */}
                        <div className="text-center">
                          <div className="relative group inline-block">
                            <button
                              type="button"
                              onClick={() => onVisualizar(nf)}
                              disabled={acoesLoading}
                              className={`inline-flex items-center justify-center p-1 bg-white border border-gray-300 rounded-md shadow-sm ${!acoesLoading ? 'hover:bg-gray-50 cursor-pointer' : 'cursor-not-allowed disabled:opacity-100 disabled:border-gray-300'}`}
                              title="Visualizar"
                            >
                              <span className="w-5 h-5 flex items-center justify-center">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="text-gray-600" viewBox="0 0 16 16">
                                  <path d="M10.5 8a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0z" />
                                  <path d="M0 8s3-5.5 8-5.5S16 8 16 8s-3 5.5-8 5.5S0 8 0 8zm8 3.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7z" />
                                </svg>
                              </span>
                            </button>
                            <div className="absolute z-10 invisible group-hover:visible bg-gray-800 text-white text-xs rounded py-1 px-2 right-0 bottom-full mb-1 whitespace-nowrap">
                              Visualizar
                            </div>
                          </div>
                        </div>

                        {/* Botão Consultar Status removido (ABRASF legacy). */}


                        {/* Botão Excluir (usa fluxo de cancelamento) - coluna 6 */}
                        <div className="text-center">
                          <div className="relative group inline-block">
                            <button
                              onClick={() => {
                                if (!acoesLoading && nf.status === '1' && (nf.chaveAcesso || '').length === 50) {
                                  setNotaSelecionada(nf);
                                  setShowCancelarModal(true);
                                }
                              }}
                              disabled={acoesLoading || nf.status !== '1' || (nf.chaveAcesso || '').length !== 50}
                              className="inline-flex items-center justify-center p-1 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 cursor-pointer disabled:opacity-100 disabled:cursor-not-allowed disabled:bg-white disabled:border-gray-300"
                              title="Excluir"
                            >
                              <span className="w-5 h-5 flex items-center justify-center">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className={`${nf.status === '1' ? 'text-red-600' : 'text-gray-400'}`} viewBox="0 0 16 16">
                                  <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z" />
                                  <path d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708z" />
                                </svg>
                              </span>
                            </button>
                            <div className="absolute z-10 invisible group-hover:visible bg-gray-800 text-white text-xs rounded py-1 px-2 right-0 bottom-full mb-1 whitespace-nowrap">
                              Excluir
                            </div>
                          </div>
                        </div>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-2 py-4 text-center text-sm text-gray-500">Nenhuma nota fiscal encontrada.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Paginação */}
        <div className="mt-4 px-2 py-3 flex items-center justify-between border-t border-gray-200 bg-gray-50">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 justify-end">
              <select
                value={pagination.pageSize}
                onChange={handlePageSizeChange}
                className="h-8 rounded-md border border-gray-300 bg-white text-sm focus:border-blue-500 focus:ring-blue-500"
              >
                <option value="1">1</option>
                <option value="10">10</option>
                <option value="25">25</option>
                <option value="50">50</option>
                <option value="100">100</option>
              </select>
              <span className="text-sm text-gray-600">itens por página</span>
            </div>
            <div className="text-sm text-gray-600">
              Total: <span className="font-medium">{pagination.total}</span> registros
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="text-sm text-gray-600">
              Página <span className="font-medium">{pagination.page}</span> de <span className="font-medium">{pagination.totalPages}</span>
            </div>
            <div className="flex gap-1">
              <button
                onClick={() => handlePageChange(1)}
                disabled={pagination.page === 1}
                className="p-1 rounded text-gray-500 hover:bg-gray-100 disabled:opacity-50 disabled:hover:bg-transparent cursor-pointer"
                title="Primeira página"
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
                </svg>
              </button>
              <button
                onClick={() => handlePageChange(pagination.page - 1)}
                disabled={pagination.page === 1}
                className="p-1 rounded text-gray-500 hover:bg-gray-100 disabled:opacity-50 disabled:hover:bg-transparent cursor-pointer"
                title="Página anterior"
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <button
                onClick={() => handlePageChange(pagination.page + 1)}
                disabled={pagination.page === pagination.totalPages}
                className="p-1 rounded text-gray-500 hover:bg-gray-100 disabled:opacity-50 disabled:hover:bg-transparent cursor-pointer"
                title="Próxima página"
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                </svg>
              </button>
              <button
                onClick={() => handlePageChange(pagination.totalPages)}
                disabled={pagination.page === pagination.totalPages}
                className="p-1 rounded text-gray-500 hover:bg-gray-100 disabled:opacity-50 disabled:hover:bg-transparent cursor-pointer"
                title="Última página"
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      {notaSelecionada && (
        <CancelarNfseModal
          isOpen={showCancelarModal}
          onClose={() => {
            setShowCancelarModal(false);
            setNotaSelecionada(null);
          }}
          numeroNfse={notaSelecionada.chaveAcesso || ''}
          cnpj={prestador?.cnpj || ''}
          inscricaoMunicipal={prestador?.inscricaoMunicipal || ''}
          ambiente={prestador?.ambiente || 2}
          onSuccess={() => {
            setShowCancelarModal(false);
            setNotaSelecionada(null);
            fetchData();
          }}
        />
      )}
    </div>
  );
}
