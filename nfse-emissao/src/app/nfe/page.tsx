"use client";

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { Calendar, Filter, Search, FileText, Printer, XCircle, CheckCircle, Mail, Eye, Hash, Eraser, MoreHorizontal, File, AlertTriangle, Loader2 } from 'lucide-react';

// Indicador de status do serviço da NFe (consulta assíncrona ao montar)
function StatusServicoNFe() {
  const [status, setStatus] = useState<'loading' | 'operacao' | 'instavel' | 'indisponivel' | 'erro'>('loading');
  const [atualizadoEm, setAtualizadoEm] = useState<string | null>(null);

  useEffect(() => {
    const ctrl = new AbortController();
    const load = async () => {
      try {
        const resp = await fetch('/api/nfe/status-servico', { signal: ctrl.signal, cache: 'no-store' });
        const json = await resp.json();
        if (json?.ok && (json.status === 'operacao' || json.status === 'instavel' || json.status === 'indisponivel')) {
          setStatus(json.status);
        } else {
          setStatus('erro');
        }
        setAtualizadoEm(json?.atualizadoEm ?? null);
      } catch {
        setStatus('erro');
      }
    };
    // Dispara logo após montar, sem bloquear a UI
    load();
    return () => ctrl.abort();
  }, []);

  const commonClass = 'inline-flex items-center gap-1.5 text-xs rounded px-2 py-1';

  if (status === 'loading') {
    return (
      <div className={`${commonClass} bg-gray-100 text-gray-600`}
           title="Consultando status do serviço...">
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
        Verificando status do serviço...
      </div>
    );
  }

  if (status === 'operacao') {
    return (
      <div className={`${commonClass} bg-green-50 text-green-700 border border-green-200`}
           title={atualizadoEm ? `Atualizado em ${new Date(atualizadoEm).toLocaleString('pt-BR')}` : undefined}>
        <CheckCircle className="h-3.5 w-3.5" />
        Serviço em operação
      </div>
    );
  }

  if (status === 'instavel') {
    return (
      <div className={`${commonClass} bg-amber-50 text-amber-700 border border-amber-200`}
           title={atualizadoEm ? `Atualizado em ${new Date(atualizadoEm).toLocaleString('pt-BR')}` : undefined}>
        <AlertTriangle className="h-3.5 w-3.5" />
        Serviço instável
      </div>
    );
  }

  if (status === 'indisponivel') {
    return (
      <div className={`${commonClass} bg-red-50 text-red-700 border border-red-200`}
           title={atualizadoEm ? `Atualizado em ${new Date(atualizadoEm).toLocaleString('pt-BR')}` : undefined}>
        <XCircle className="h-3.5 w-3.5" />
        Serviço indisponível
      </div>
    );
  }

  return (
    <div className={`${commonClass} bg-gray-100 text-gray-700 border border-gray-200`} title="Não foi possível verificar o status agora.">
      <AlertTriangle className="h-3.5 w-3.5" />
      Não foi possível verificar o status
    </div>
  );
}

// Badge de Ambiente de emissão (Produção/Homologação) do prestador logado
function AmbienteNFeBadge() {
  const [status, setStatus] = useState<'loading' | 'ok' | 'erro'>('loading');
  const [ambiente, setAmbiente] = useState<1 | 2 | null>(null);
  const [atualizadoEm, setAtualizadoEm] = useState<string | null>(null);

  useEffect(() => {
    const ctrl = new AbortController();
    const load = async () => {
      try {
        const resp = await fetch('/api/nfe/ambiente', { signal: ctrl.signal, cache: 'no-store' });
        const json = await resp.json();
        if (json?.ok && (json.ambiente === 1 || json.ambiente === 2)) {
          setAmbiente(json.ambiente);
          setStatus('ok');
        } else {
          setStatus('erro');
        }
        setAtualizadoEm(json?.atualizadoEm ?? null);
      } catch {
        setStatus('erro');
      }
    };
    load();
    return () => ctrl.abort();
  }, []);

  const commonClass = 'inline-flex items-center gap-1.5 text-xs rounded px-2 py-1';

  if (status === 'loading') {
    return (
      <div className={`${commonClass} bg-gray-100 text-gray-600`} title="Consultando ambiente de emissão...">
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
        Verificando ambiente...
      </div>
    );
  }

  if (status === 'ok' && ambiente) {
    const isProd = ambiente === 1;
    return (
      <div
        className={`${commonClass} ${isProd ? 'bg-blue-50 text-blue-700 border border-blue-200' : 'bg-purple-50 text-purple-700 border border-purple-200'}`}
        title={atualizadoEm ? `Atualizado em ${new Date(atualizadoEm).toLocaleString('pt-BR')}` : undefined}
      >
        {isProd ? 'Ambiente: Produção' : 'Ambiente: Homologação'}
      </div>
    );
  }

  return (
    <div className={`${commonClass} bg-gray-100 text-gray-700 border border-gray-200`} title="Não foi possível obter o ambiente.">
      <AlertTriangle className="h-3.5 w-3.5" />
      Ambiente indisponível
    </div>
  );
}

export default function NfeListaPage() {
  // Estados locais apenas para UI
  // Lista de meses: mês atual + últimos 12 (formato MM/YYYY)
  const meses = useMemo(() => {
    const out: string[] = [];
    const d = new Date();
    for (let i = 0; i <= 12; i++) {
      const dt = new Date(d.getFullYear(), d.getMonth() - i, 1);
      const mm = String(dt.getMonth() + 1).padStart(2, '0');
      const yyyy = String(dt.getFullYear());
      out.push(`${mm}/${yyyy}`);
    }
    return out;
  }, []);
  const [mesMapa, setMesMapa] = useState(meses[0]);
  const [todosMeses, setTodosMeses] = useState(false);
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');
  const [situacao, setSituacao] = useState('todas');
  const [cliente, setCliente] = useState('');
  const [chave, setChave] = useState('');
  const [numeroNfe, setNumeroNfe] = useState('');
  const [danfeImpresso, setDanfeImpresso] = useState(false);

  // Utilitário: a partir de MM/YYYY retorna {inicio:'DD/MM/YYYY', fim:'DD/MM/YYYY'}
  const getPeriodoMes = (mes: string) => {
    const [mm, yyyy] = (mes || '').split('/');
    if (!mm || !yyyy) return { inicio: '', fim: '' };
    const first = `01/${mm}/${yyyy}`;
    const lastDate = new Date(Number(yyyy), Number(mm), 0).getDate();
    const last = `${String(lastDate).padStart(2,'0')}/${mm}/${yyyy}`;
    return { inicio: first, fim: last };
  };

  // Converte 'DD/MM/AAAA' -> 'YYYY-MM-DD' (sem hora)
  const parseBRDateToISO = (br: string): string => {
    if (!br) return '';
    const [dd, mm, yyyy] = br.split('/');
    if (!dd || !mm || !yyyy) return '';
    return `${yyyy}-${mm}-${dd}`;
  };

  const limparFiltros = () => {
    setMesMapa(meses[0]);
    setTodosMeses(false);
    // Define início/fim do mês corrente
    const { inicio, fim } = getPeriodoMes(meses[0]);
    setDataInicio(inicio);
    setDataFim(fim);
    setSituacao('todas');
    setCliente('');
    setChave('');
    setNumeroNfe('');
    setDanfeImpresso(false);
    // Importante: enviar as datas do mês corrente para o backend
    setTimeout(() => carregarLista({
      situacao: 'todas',
      cliente: '',
      chave: '',
      numeroNfe: '',
      danfeImpresso: false,
      dataInicio: inicio,
      dataFim: fim,
    }), 0);
  };

  // Lista de dados
  const [dados, setDados] = useState<Array<{ id: string; emissao: string; numero: string; serie: string; cnpj: string; cliente: string; valorTotal: string; status: string; protocolo: string; itens: number; cce: number;}>>([]);

  // Modal de seleção de clientes (tomadores) para filtro
  const [showTomadoresModal, setShowTomadoresModal] = useState(false);
  const [tomadores, setTomadores] = useState<Array<{id:string; cpfCnpj:string; razaoSocial:string; ativo:boolean}>>([]);
  const [buscaTomador, setBuscaTomador] = useState('');

  const carregarLista = async (override?: { situacao?: string; cliente?: string; chave?: string; numeroNfe?: string; danfeImpresso?: boolean; dataInicio?: string; dataFim?: string; }) => {
    const params = new URLSearchParams();
    const _situacao = override?.situacao ?? situacao;
    const _cliente = override?.cliente ?? cliente;
    const _chave = override?.chave ?? chave;
    const _numeroNfe = override?.numeroNfe ?? numeroNfe;
    const _danfeImpresso = override?.danfeImpresso ?? danfeImpresso;
    // Mesmo com '(Todos)', considerar as datas informadas; 'Todos' afeta apenas o Mês Mapa
    const _dataInicio = override?.dataInicio ?? dataInicio;
    const _dataFim = override?.dataFim ?? dataFim;

    if (_situacao) params.set('situacao', _situacao);
    if (_cliente) params.set('cliente', _cliente);
    if (_chave) params.set('chave', _chave);
    if (_numeroNfe) params.set('numeroNfe', _numeroNfe);
    if (_danfeImpresso) params.set('danfeImpresso', 'true');
    // Enviar datas sem hora (YYYY-MM-DD) para desconsiderar hh:mm:ss no backend
    if (_dataInicio) params.set('dataInicio', parseBRDateToISO(_dataInicio));
    if (_dataFim) params.set('dataFim', parseBRDateToISO(_dataFim));

    const resp = await fetch(`/api/nfe/list?${params.toString()}`);
    if (!resp.ok) return setDados([]);
    const json = await resp.json();
    const mapped = (json as any[]).map((n) => ({
      id: n.id as string,
      emissao: new Date(n.dataEmissao).toLocaleDateString('pt-BR'),
      numero: String(n.numero),
      serie: String(n.serie),
      cnpj: n.cnpjCliente,
      cliente: n.nomeCliente || '',
      valorTotal: (Number(n.valorTotal) || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
      status: n.status === '0' ? 'NF-e não transmitida' : (n.status === '1' ? 'Autorizado o uso da NF-e' : n.status),
      protocolo: n.protocolo || '',
      itens: (n.itens?.length) || 0,
      cce: 0,
    }));
    setDados(mapped);
  };

  useEffect(() => {
    carregarLista();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Inicializa datas com o mês atual ao montar (quando não estiver em "Todos")
  useEffect(() => {
    if (todosMeses) return;
    const { inicio, fim } = getPeriodoMes(mesMapa);
    setDataInicio(inicio);
    setDataFim(fim);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Ao alterar o "Mês Mapa" não alteramos mais as datas de emissão.
  // As datas permanecem conforme o usuário definir manualmente.

  // Carregar tomadores quando abrir o modal (cache simples)
  useEffect(() => {
    const loadTomadores = async () => {
      try {
        const resp = await fetch('/api/tomadores/list?filtro=ativos');
        if (resp.ok) {
          const data = await resp.json();
          setTomadores(data);
        }
      } catch {}
    };
    if (showTomadoresModal && tomadores.length === 0) loadTomadores();
  }, [showTomadoresModal, tomadores.length]);

  // Seleção de linhas para ações em lote
  const [selecionados, setSelecionados] = useState<Set<number>>(new Set());
  const selecionadosCount = useMemo(() => selecionados.size, [selecionados]);
  const toggleSelecionado = (idx: number) => {
    setSelecionados(prev => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx); else next.add(idx);
      return next;
    });
  };
  const getSelecionadosRotulo = () => {
    const arr = Array.from(selecionados);
    if (arr.length === 0) return 'Nenhuma nota selecionada';
    const rotulos = arr.map(i => `Nº ${dados[i]?.numero}/${dados[i]?.serie}`).filter(Boolean);
    return rotulos.join(', ');
  };

  const handleAcao = (acao: string) => {
    const mensagem = getSelecionadosRotulo();
    if (!mensagem || mensagem === 'Nenhuma nota selecionada') {
      window.alert(`[${acao}] Nenhuma nota selecionada.`);
      return;
    }
    window.alert(`[${acao}] Selecionadas: ${mensagem}`);
  };

  const containerRef = useRef<HTMLDivElement | null>(null);
  const [footerBox, setFooterBox] = useState<{left: number; width: number}>({ left: 0, width: 0 });

  const recalcFooterBox = () => {
    const el = containerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    setFooterBox({ left: Math.round(rect.left), width: Math.round(rect.width) });
  };

  useEffect(() => {
    recalcFooterBox();
    const onResize = () => recalcFooterBox();
    window.addEventListener('resize', onResize);
    // Ouvir mudanças no localStorage do menu (sidebarCollapsed)
    const onStorage = (e: StorageEvent) => {
      if (e.key === 'sidebarCollapsed') {
        // aguarda animação de 300ms da sidebar
        setTimeout(recalcFooterBox, 320);
      }
    };
    window.addEventListener('storage', onStorage);
    // Recalcula após a renderização
    const t = setTimeout(recalcFooterBox, 50);
    return () => {
      window.removeEventListener('resize', onResize);
      window.removeEventListener('storage', onStorage);
      clearTimeout(t);
    };
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <div ref={containerRef} className="container mx-auto px-4 pt-0 pb-28">
        {/* Filtros - estilo padronizado (modelo Mensalidades) */}
        <div className="mb-4 bg-white py-4 px-4 rounded-lg shadow mt-0">
          <form className="space-y-4">
            {/* Linha 1 */}
            <div className="grid grid-cols-12 gap-4 items-end">
              <div className="col-span-12 md:col-span-2 flex flex-col">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-gray-700">Mês Mapa</span>
                  <label className="inline-flex items-center gap-2 text-sm text-gray-700 select-none">
                    <span>(Todos)</span>
                    <input type="checkbox" checked={todosMeses} onChange={e => setTodosMeses(e.target.checked)} className="h-4 w-4" />
                  </label>
                </div>
                <select value={mesMapa} onChange={e => setMesMapa(e.target.value)} disabled={todosMeses}
                  className={`h-10 rounded-md border px-3 focus:border-blue-500 focus:ring-blue-500 ${todosMeses ? 'bg-gray-100 text-gray-500 cursor-not-allowed border-gray-200' : 'border-gray-300'}`}
                >
                  {meses.map(m => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>

              <div className="col-span-12 sm:col-span-6 md:col-span-2 flex flex-col">
                <label className="text-sm font-medium text-gray-700 mb-1">Data Emissão (início)</label>
                <div className="flex gap-2 items-center">
                  <input
                    type="text"
                    value={dataInicio}
                    onChange={e => {
                      const digits = (e.target.value || '').replace(/\D/g, '').slice(0,8);
                      const p1 = digits.slice(0,2);
                      const p2 = digits.slice(2,4);
                      const p3 = digits.slice(4,8);
                      const masked = [p1, p2, p3].filter(Boolean).join('/');
                      setDataInicio(masked);
                    }}
                    placeholder="__/__/____"
                    className="h-10 w-full rounded-md border border-gray-300 px-3 focus:border-blue-500 focus:ring-blue-500"
                  />
                  <Calendar className="h-4 w-4 text-gray-400" />
                </div>
              </div>

              <div className="col-span-12 sm:col-span-6 md:col-span-2 flex flex-col">
                <label className="text-sm font-medium text-gray-700 mb-1">Data Emissão (fim)</label>
                <div className="flex gap-2 items-center">
                  <input
                    type="text"
                    value={dataFim}
                    onChange={e => {
                      const digits = (e.target.value || '').replace(/\D/g, '').slice(0,8);
                      const p1 = digits.slice(0,2);
                      const p2 = digits.slice(2,4);
                      const p3 = digits.slice(4,8);
                      const masked = [p1, p2, p3].filter(Boolean).join('/');
                      setDataFim(masked);
                    }}
                    placeholder="__/__/____"
                    className="h-10 w-full rounded-md border border-gray-300 px-3 focus:border-blue-500 focus:ring-blue-500"
                  />
                  <Calendar className="h-4 w-4 text-gray-400" />
                </div>
              </div>

              <div className="col-span-12 md:col-span-2 flex flex-col">
                <label className="text-sm font-medium text-gray-700 mb-1">Situação</label>
                <select value={situacao} onChange={e => setSituacao(e.target.value)} className="h-10 rounded-md border border-gray-300 px-3 focus:border-blue-500 focus:ring-blue-500">
                  <option value="todas">Todas</option>
                  <option value="nao_transmitida">Não transmitida</option>
                  <option value="autorizada">Autorizada</option>
                  <option value="cancelada">Cancelada</option>
                  <option value="rejeitada">Rejeitada</option>
                  <option value="processando">Processando</option>
                </select>
              </div>

              <div className="col-span-12 md:col-span-4">
                <label className="text-sm font-medium text-gray-700 mb-1">Cliente</label>
                <div className="flex gap-2">
                  <input type="text" value={cliente} readOnly className="h-10 flex-1 rounded-md border border-gray-300 px-3 bg-gray-100 cursor-default" />
                  {/* Buscar cliente: apenas ícone de lupa */}
                  <button
                    type="button"
                    title="Buscar cliente"
                    onClick={() => { console.log('[NFe][Filtro] Abrir modal de clientes'); setShowTomadoresModal(true); }}
                    className="h-10 w-10 rounded-md bg-gray-100 hover:bg-gray-200 border flex items-center justify-center"
                  >
                    <Search className="h-4 w-4" />
                  </button>
                  {/* Limpar cliente: apenas ícone de folha */}
                  <button
                    type="button"
                    title="Limpar cliente"
                    onClick={() => setCliente('')}
                    className="h-10 w-10 rounded-md bg-gray-100 hover:bg-gray-200 border flex items-center justify-center"
                  >
                    <File className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Linha 2 */}
            <div className="grid grid-cols-12 gap-4 items-end">

              <div className="col-span-6 md:col-span-2">
                <label className="text-sm font-medium text-gray-700 mb-1">Número NF-e</label>
                <input type="text" value={numeroNfe} onChange={e => setNumeroNfe(e.target.value)} className="h-10 w-full rounded-md border border-gray-300 px-3 focus:border-blue-500 focus:ring-blue-500" />
              </div>

              <div className="col-span-12 md:col-span-12 md:col-start-1 md:col-end-13 flex flex-wrap items-center justify-between gap-2">
                {/* Esquerda: indicador de status e ambiente */}
                <div className="mt-1 flex items-center gap-2 flex-wrap">
                  <StatusServicoNFe />
                  <AmbienteNFeBadge />
                </div>
                {/* Direita: botões de ação */}
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => carregarLista()}
                    className="h-10 rounded-md bg-blue-600 px-4 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 flex items-center gap-2"
                  >
                    <Filter className="h-4 w-4" /> Filtrar
                  </button>
                  <button
                    type="button"
                    onClick={limparFiltros}
                    className="h-10 rounded-md bg-gray-100 px-4 text-gray-700 hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-400 flex items-center gap-2"
                  >
                    <Eraser className="h-4 w-4" /> Limpar
                  </button>
                </div>
              </div>
            </div>
          </form>
        </div>

        {/* Lista */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Emissão</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Número</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Série</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">CNPJ</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cliente</th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Valor Total</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Protocolo</th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Itens</th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Carta de Correção</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {dados.map((d, idx) => (
                  <tr
                    key={idx}
                    onClick={() => toggleSelecionado(idx)}
                    className={`${selecionados.has(idx) ? 'bg-blue-50' : 'hover:bg-gray-50'} cursor-pointer`}
                    title={`Clique para ${selecionados.has(idx) ? 'desmarcar' : 'selecionar'} esta nota`}
                  >
                    <td className="px-4 py-2">{d.emissao}</td>
                    <td className="px-4 py-2"><Link href={`/nfe/${d.id}`} className="text-blue-600 hover:underline" onClick={(e)=>e.stopPropagation()}>{d.numero}</Link></td>
                    <td className="px-4 py-2">{d.serie}</td>
                    <td className="px-4 py-2">{d.cnpj}</td>
                    <td className="px-4 py-2">{d.cliente}</td>
                    <td className="px-4 py-2 text-right">{d.valorTotal}</td>
                    <td className="px-4 py-2"><span className={`text-sm ${d.status.includes('não') ? 'text-red-600' : 'text-green-600'} underline`}>{d.status}</span></td>
                    <td className="px-4 py-2">{d.protocolo}</td>
                    <td className="px-4 py-2 text-right">{d.itens}</td>
                    <td className="px-4 py-2 text-right">{d.cce}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Barra inferior fixa com largura/posição iguais ao container */}
        <div className="fixed bottom-0 z-[70]" style={{ left: footerBox.left, width: footerBox.width }}>
          <div className="px-4 py-2 bg-[#f9fafb] border-t shadow rounded-t-lg">
            <div className="flex flex-wrap items-center gap-3">
              {/* Ações visíveis em telas médias+ */}
              <div className="hidden sm:flex flex-wrap gap-3">
                <Link href="/nfe/novo" className="px-3 py-2 border rounded flex items-center gap-2 bg-[#F7F7F7] hover:bg-[#EDEDED] border-gray-300"><FileText size={16} />Notas</Link>
                <button onClick={() => handleAcao('Exportar')} className="px-3 py-2 border rounded flex items-center gap-2 bg-[#F7F7F7] hover:bg-[#EDEDED] border-gray-300">Exportar</button>
                <button onClick={() => handleAcao('DANFE')} className="px-3 py-2 border rounded flex items-center gap-2 bg-[#F7F7F7] hover:bg-[#EDEDED] border-gray-300"><Printer size={16} />DANFE</button>
                <button onClick={() => handleAcao('Cancelar')} className="px-3 py-2 border rounded flex items-center gap-2 text-red-600 bg-[#F7F7F7] hover:bg-[#EDEDED] border-gray-300"><XCircle size={16} />Cancelar</button>
                <button onClick={() => handleAcao('Chave')} className="px-3 py-2 border rounded flex items-center gap-2 bg-[#F7F7F7] hover:bg-[#EDEDED] border-gray-300"><Hash size={16} />Chave</button>
                <button onClick={() => handleAcao('Consulta Recibo')} className="px-3 py-2 border rounded flex items-center gap-2 bg-[#F7F7F7] hover:bg-[#EDEDED] border-gray-300"><CheckCircle size={16} />Consulta Recibo</button>
                <button onClick={() => handleAcao('Protocolo')} className="px-3 py-2 border rounded flex items-center gap-2 bg-[#F7F7F7] hover:bg-[#EDEDED] border-gray-300">Protocolo</button>
                <button onClick={() => handleAcao('Email')} className="px-3 py-2 border rounded flex items-center gap-2 bg-[#F7F7F7] hover:bg-[#EDEDED] border-gray-300"><Mail size={16} />Email</button>
                <button onClick={() => handleAcao('Visualizar DANFE')} className="px-3 py-2 border rounded flex items-center gap-2 bg-[#F7F7F7] hover:bg-[#EDEDED] border-gray-300"><Eye size={16} />Visualizar DANFE</button>
              </div>

              {/* Dropdown de ações em telas pequenas */}
              <div className="sm:hidden">
                <details className="relative">
                  <summary className="list-none px-3 py-2 border rounded flex items-center gap-2 cursor-pointer select-none">
                    <MoreHorizontal size={16} /> Ações
                  </summary>
                  <div className="absolute left-0 mt-2 w-56 bg-white border rounded shadow-md p-2 z-50">
                    <Link href="/nfe/novo" className="w-full text-left px-2 py-1 rounded bg-[#F7F7F7] hover:bg-[#EDEDED] flex items-center gap-2"><FileText size={14} />Notas</Link>
                    <button onClick={() => handleAcao('Exportar')} className="w-full text-left px-2 py-1 rounded bg-[#F7F7F7] hover:bg-[#EDEDED]">Exportar</button>
                    <button onClick={() => handleAcao('DANFE')} className="w-full text-left px-2 py-1 rounded bg-[#F7F7F7] hover:bg-[#EDEDED] flex items-center gap-2"><Printer size={14} />DANFE</button>
                    <button onClick={() => handleAcao('Cancelar')} className="w-full text-left px-2 py-1 rounded bg-[#F7F7F7] hover:bg-[#EDEDED] text-red-600 flex items-center gap-2"><XCircle size={14} />Cancelar</button>
                    <button onClick={() => handleAcao('Chave')} className="w-full text-left px-2 py-1 rounded bg-[#F7F7F7] hover:bg-[#EDEDED] flex items-center gap-2"><Hash size={14} />Chave</button>
                    <button onClick={() => handleAcao('Consulta Recibo')} className="w-full text-left px-2 py-1 rounded bg-[#F7F7F7] hover:bg-[#EDEDED] flex items-center gap-2"><CheckCircle size={14} />Consulta Recibo</button>
                    <button onClick={() => handleAcao('Protocolo')} className="w-full text-left px-2 py-1 rounded bg-[#F7F7F7] hover:bg-[#EDEDED]">Protocolo</button>
                    <button onClick={() => handleAcao('Email')} className="w-full text-left px-2 py-1 rounded bg-[#F7F7F7] hover:bg-[#EDEDED] flex items-center gap-2"><Mail size={14} />Email</button>
                    <button onClick={() => handleAcao('Visualizar DANFE')} className="w-full text-left px-2 py-1 rounded bg-[#F7F7F7] hover:bg-[#EDEDED] flex items-center gap-2"><Eye size={14} />Visualizar DANFE</button>
                  </div>
                </details>
              </div>

              {/* Contador de selecionados */}
              <div className="ml-auto flex items-center gap-4">
                <div className="text-sm text-gray-700">Selecionados: <span className="font-semibold">{selecionadosCount}</span></div>
              </div>
            </div>
          </div>
        </div>
        {/* Modal de Tomadores (Clientes) para filtro */}
        {showTomadoresModal && (
          <div className="fixed inset-0 z-[1000] flex items-center justify-center">
            <div className="absolute inset-0 bg-black/40 z-[900]" onClick={()=>setShowTomadoresModal(false)} />
            <div className="relative bg-white rounded-lg shadow-lg w-full max-w-2xl p-4 z-[1001]">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-lg font-semibold">Selecionar Cliente</h3>
                <button onClick={()=>setShowTomadoresModal(false)} className="text-gray-600 hover:text-gray-800">✕</button>
              </div>
              <div className="mb-3">
                <label className="block text-sm text-gray-600 mb-1">Buscar</label>
                <input
                  value={buscaTomador}
                  onChange={(e)=>setBuscaTomador(e.target.value)}
                  placeholder="Nome/Razão Social ou CPF/CNPJ"
                  className="h-10 w-full rounded-md border border-gray-300 px-3"
                />
              </div>
              <div className="border rounded max-h-96 overflow-auto">
                {tomadores
                  .filter(t => {
                    const q = buscaTomador.trim().toLowerCase();
                    if (!q) return true;
                    return String(t.razaoSocial).toLowerCase().includes(q) || String(t.cpfCnpj).toLowerCase().includes(q);
                  })
                  .slice(0, 100)
                  .map(t => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => { setCliente(t.razaoSocial); setShowTomadoresModal(false); setBuscaTomador(''); }}
                      className="w-full text-left px-3 py-2 hover:bg-gray-50 border-b last:border-b-0"
                    >
                      <div className="font-medium">{t.razaoSocial}</div>
                      <div className="text-xs text-gray-500">{t.cpfCnpj}</div>
                    </button>
                  ))}
                {tomadores.length === 0 && (
                  <div className="p-3 text-sm text-gray-500">Nenhum cliente encontrado.</div>
                )}
              </div>
              <div className="mt-3 text-right">
                <button onClick={()=>setShowTomadoresModal(false)} className="px-3 py-2 text-sm border rounded">Fechar</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
