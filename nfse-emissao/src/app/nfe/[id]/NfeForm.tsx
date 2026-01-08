'use client';

import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Save, ArrowLeft, PlusCircle, Trash2, Users } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import UfMunicipioSelector from '@/components/ui/UfMunicipioSelector';

interface Produto {
  id: string;
  descricao: string;
  precoVenda?: number;
}

interface Tomador {
  id: string;
  cpfCnpj: string;
  razaoSocial: string;
  ativo: boolean;
}

interface Transportadora {
  id: string;
  codigo: string;
  razaoSocial: string;
  cpfCnpj: string;
  uf?: string;
  codigoMunicipio?: string;
  placaVeiculo?: string;
  ufVeiculo?: string;
}

interface ItemEdit {
  produtoId?: string;
  descricao: string;
  quantidade: number;
  valorUnit: number;
  ncm?: string;
  cfop?: string;
  cst?: string;
  ipi?: number;
  pis?: number;
  cofins?: number;
}

type NfeFormProps = {
  isNew: boolean;
  nfe: any | null;
  defaultValues: {
    numero: number;
    serie: number;
    ambiente: number;
    cnpjCliente: string;
    nomeCliente: string;
    dataEmissao: string;
    valorTotal: number;
    status: string;
    protocolo: string;
    chaveAcesso: string;
    danfeImpresso: boolean;
  };
};

export default function NfeForm({ isNew, nfe, defaultValues }: NfeFormProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'dados'|'itens'|'transporte'|'adicionais'|'pagamento'|'historico'>('dados');

  // Campos principais
  const [numero, setNumero] = useState<number>(defaultValues.numero);
  const [serie, setSerie] = useState<number>(defaultValues.serie);
  const [ambiente, setAmbiente] = useState<number>(defaultValues.ambiente);
  const [chaveAcesso, setChaveAcesso] = useState<string>(defaultValues.chaveAcesso);
  const [cnpjCliente, setCnpjCliente] = useState<string>(defaultValues.cnpjCliente);
  const [nomeCliente, setNomeCliente] = useState<string>(defaultValues.nomeCliente);
  const [dataEmissao, setDataEmissao] = useState<string>(defaultValues.dataEmissao);
  const [status, setStatus] = useState<string>(defaultValues.status);
  const [protocolo, setProtocolo] = useState<string>(defaultValues.protocolo);
  // Removido DANFE impresso da UI

  // Itens (produtos)
  const [itens, setItens] = useState<ItemEdit[]>([]);
  const [buscaProduto, setBuscaProduto] = useState('');
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [showProdutosModal, setShowProdutosModal] = useState(false);
  const quantidadeInputsRef = useRef<Array<HTMLInputElement | null>>([]);
  const [focusIndex, setFocusIndex] = useState<number | null>(null);

  // Tomadores
  const [tomadores, setTomadores] = useState<Tomador[]>([]);
  const [buscaTomador, setBuscaTomador] = useState('');
  const [showTomadoresModal, setShowTomadoresModal] = useState(false);

  // Transporte
  const [modalidadeFrete, setModalidadeFrete] = useState<number>(0);
  const [transportadoras, setTransportadoras] = useState<Transportadora[]>([]);
  const [buscaTransportadora, setBuscaTransportadora] = useState('');
  const [showTransportadorasModal, setShowTransportadorasModal] = useState(false);
  // Naturezas
  const [naturezas, setNaturezas] = useState<Array<{id:string; descricao:string; ativo:boolean}>>([]);
  const [buscaNatureza, setBuscaNatureza] = useState('');
  const [showNaturezasModal, setShowNaturezasModal] = useState(false);
  const [transportadoraId, setTransportadoraId] = useState<string>('');
  const [transportadoraSelecionada, setTransportadoraSelecionada] = useState<Transportadora | null>(null);
  const [ufVeiculo, setUfVeiculo] = useState<string>('');
  const [placaVeiculo, setPlacaVeiculo] = useState<string>('');
  const [valorFrete, setValorFrete] = useState<string>('0,00');
  const [volumes, setVolumes] = useState<string>('0');
  const [tipoVolume, setTipoVolume] = useState<string>('');
  const [marcaVolume, setMarcaVolume] = useState<string>('');
  const [pesoBruto, setPesoBruto] = useState<string>('0,00');
  const [pesoLiquido, setPesoLiquido] = useState<string>('0,00');

  // Pagamento
  const [valorPagamento, setValorPagamento] = useState<string>('');
  const formasPagamento = useMemo(() => ([
    { codigo: 1,  descricao: '01 - Dinheiro' },
    { codigo: 2,  descricao: '02 - Cheque' },
    { codigo: 3,  descricao: '03 - Cartão de Crédito' },
    { codigo: 4,  descricao: '04 - Cartão de Débito' },
    { codigo: 5,  descricao: '05 - Crédito Loja' },
    { codigo: 10, descricao: '10 - Vale Alimentação' },
    { codigo: 11, descricao: '11 - Vale Refeição' },
    { codigo: 12, descricao: '12 - Vale Presente' },
    { codigo: 13, descricao: '13 - Vale Combustível' },
    { codigo: 14, descricao: '14 - Duplicata Mercantil' },
    { codigo: 15, descricao: '15 - Boleto Bancário' },
    { codigo: 16, descricao: '16 - Depósito Bancário' },
    { codigo: 17, descricao: '17 - Pgto PIX - Dinâmico' },
    { codigo: 18, descricao: '18 - Transferência Bancária' },
    { codigo: 19, descricao: '19 - Programa de Fidelidade' },
    { codigo: 20, descricao: '20 - Pgto PIX - Estático' },
    { codigo: 21, descricao: '21 - Crédito em Loja' },
    { codigo: 22, descricao: '22 - Pgto Eletrônico Não Informado' },
    { codigo: 90, descricao: '90 - Sem Pgto' },
    { codigo: 99, descricao: '99 - Outros' },
  ]), []);
  const [formaPagamentoCodigo, setFormaPagamentoCodigo] = useState<number>(1);
  // Parcela: automática (gerada ao lançar)
  const [numeroDocumento, setNumeroDocumento] = useState<string>('');
  const [dataVencimento, setDataVencimento] = useState<string>('');
  const [operadoras, setOperadoras] = useState<Array<{id:string, descricao:string}>>([]);
  const [operadoraCartaoId, setOperadoraCartaoId] = useState<string>('');
  const [autorizacao, setAutorizacao] = useState<string>('');
  const [pagamentos, setPagamentos] = useState<Array<{
    formaPagamentoCodigo: number;
    formaPagamentoDescricao: string;
    numeroParcela?: number;
    numeroDocumento?: string;
    dataVencimento?: string;
    valor: number;
    operadoraCartaoId?: string;
    autorizacao?: string;
  }>>([]);

  // Dados da NF-e (novos campos)
  const [finalidadeEmissao, setFinalidadeEmissao] = useState<string>('Normal');
  const [natureza, setNatureza] = useState<string>('Venda');
  const [tipoDoc, setTipoDoc] = useState<string>('Saída');
  const [desconto, setDesconto] = useState<string>('0,00');
  const [tipoOper, setTipoOper] = useState<string>('Operação Interna');
  const [operacao, setOperacao] = useState<string>('Presencial');
  const [formaPgto, setFormaPgto] = useState<string>('À Vista');
  const [percCreditoSimples, setPercCreditoSimples] = useState<string>('0,00');
  const [cfopAlternativo, setCfopAlternativo] = useState<string>('');
  const [consumidorFinal, setConsumidorFinal] = useState<boolean>(false);

  // Adicionais
  const [numeroPedido, setNumeroPedido] = useState<string>('');
  const [nomeVendedor, setNomeVendedor] = useState<string>('');
  const [outrasDespesasAcessorias, setOutrasDespesasAcessorias] = useState<string>('0,00');
  const [obsAdicionais, setObsAdicionais] = useState<string>('');
  const [infAdFisco, setInfAdFisco] = useState<string>('');

  // Histórico
  const [historico, setHistorico] = useState<Array<{id:string; acao:string; descricao:string; dataHora:string; usuarioNome:string}>>([]);
  const [loadingHistorico, setLoadingHistorico] = useState<boolean>(false);

  const total = useMemo(() => itens.reduce((acc, it) => acc + it.quantidade * it.valorUnit, 0), [itens]);

  useEffect(() => {
    // Carrega produtos ativos para auto completar
    const load = async () => {
      const resp = await fetch('/api/produtos/list?filtro=ativos');
      if (!resp.ok) return;
      const data = await resp.json();
      setProdutos(data);
    };
    load();
  }, []);

  useEffect(() => {
    // Carrega naturezas quando abrir modal ou ao montar para cache
    const load = async () => {
      try {
        const resp = await fetch('/api/naturezas/list?filtro=ativos');
        if (resp.ok) {
          const data = await resp.json();
          setNaturezas(data);
        }
      } catch {}
    };
    if (showNaturezasModal || naturezas.length === 0) load();
  }, [showNaturezasModal]);

  useEffect(() => {
    // Carregar histórico quando aba for ativada e houver ID (edição)
    const loadLogs = async () => {
      if (activeTab !== 'historico') return;
      const id = (nfe as any)?.id;
      if (!id) return; // novo: ainda não existe histórico
      try {
        setLoadingHistorico(true);
        const resp = await fetch(`/api/logs/nfe?id=${id}`);
        if (resp.ok) {
          const data = await resp.json();
          setHistorico(data);
        } else {
          setHistorico([]);
        }
      } catch {
        setHistorico([]);
      } finally {
        setLoadingHistorico(false);
      }
    };
    loadLogs();
  }, [activeTab, nfe]);

  // Garante seleção da transportadora após carregar a lista (edição)
  useEffect(() => {
    const nf: any = nfe as any;
    if (nf?.transportadoraId && transportadoras.length > 0) {
      const tr = transportadoras.find(t => t.id === nf.transportadoraId) || null;
      if (tr) {
        setTransportadoraSelecionada(tr);
        setTransportadoraId(tr.id);
      }
    }
  }, [nfe, transportadoras]);

  useEffect(() => {
    // Carrega operadoras de cartão
    const load = async () => {
      try {
        const resp = await fetch('/api/operadoras/list?filtro=ativos');
        if (resp.ok) {
          const data = await resp.json();
          setOperadoras(data);
        }
      } catch {}
    };
    load();
  }, []);

  // Atualiza número quando a série muda (apenas ao criar)
  useEffect(() => {
    const updateNumero = async () => {
      if (!isNew) return;
      try {
        const resp = await fetch(`/api/nfe/next-numero?serie=${serie || 1}`);
        if (!resp.ok) return;
        const data = await resp.json();
        if (data?.nextNumero) setNumero(Number(data.nextNumero));
      } catch {}
    };
    updateNumero();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [serie]);

  useEffect(() => {
    // Carrega tomadores ativos para seleção
    const load = async () => {
      const resp = await fetch('/api/tomadores/list?filtro=ativos');
      if (!resp.ok) return;
      const data = await resp.json();
      setTomadores(data);
    };
    load();
  }, []);

  useEffect(() => {
    // Carrega transportadoras
    const load = async () => {
      const resp = await fetch('/api/transportadoras/list?filtro=ativos');
      if (!resp.ok) return;
      const data = await resp.json();
      setTransportadoras(data);
    };
    load();
  }, []);

  // Helpers de máscara de moeda (pt-BR)
  const toCurrency = (num: number) => num.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const parseCurrency = (str: string) => {
    const s = (str || '').replace(/\./g, '').replace(/,/g, '.');
    const n = parseFloat(s);
    return isNaN(n) ? 0 : n;
  };
  const handleCurrencyInput = (value: string, setter: (v: string) => void) => {
    // Mantém somente dígitos
    const digits = (value || '').replace(/\D/g, '');
    const n = parseFloat(digits) / 100;
    setter(toCurrency(isNaN(n) ? 0 : n));
  };

  // Formata YYYY-MM-DD -> DD/MM/YYYY
  const formatDateBR = (iso?: string) => {
    if (!iso) return '';
    const [y, m, d] = iso.split('-');
    if (!y || !m || !d) return iso;
    return `${d.padStart(2,'0')}/${m.padStart(2,'0')}/${y}`;
  };

  // Nº Documento: manter só dígitos (até 3) durante a digitação;
  // aplicar zero à esquerda somente ao sair do campo (onBlur)
  const handleNumeroDocumento = (value: string) => {
    const digits = (value || '').replace(/\D/g, '').slice(0, 3);
    setNumeroDocumento(digits);
  };
  const handleNumeroDocumentoBlur = () => {
    if (!numeroDocumento) return;
    setNumeroDocumento(numeroDocumento.padStart(3, '0'));
  };

  // Converte qualquer valor de data para 'YYYY-MM-DD' (compatível com input type=date)
  const toInputDate = (val: any): string | undefined => {
    if (!val) return undefined;
    try {
      const d = new Date(val);
      if (isNaN(d.getTime())) return undefined;
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${y}-${m}-${day}`;
    } catch {
      return undefined;
    }
  };

  useEffect(() => {
    // Carregar itens quando editar uma NF-e existente
    if (nfe && Array.isArray((nfe as any).itens)) {
      const mapped: ItemEdit[] = (nfe as any).itens.map((it: any) => ({
        produtoId: it.produtoId || undefined,
        descricao: String(it.descricao || ''),
        quantidade: Number(it.quantidade) || 0,
        valorUnit: Number(it.valorUnit) || 0,
        ncm: it.ncm || undefined,
        cfop: it.cfop || undefined,
        cst: it.cst || undefined,
        ipi: it.ipi !== null && it.ipi !== undefined ? Number(it.ipi) : undefined,
        pis: it.pis !== null && it.pis !== undefined ? Number(it.pis) : undefined,
        cofins: it.cofins !== null && it.cofins !== undefined ? Number(it.cofins) : undefined,
      }));
      setItens(mapped);

      // Campos de transporte
      const nf: any = nfe as any;
      if (nf) {
        if (nf.modalidadeFrete !== undefined && nf.modalidadeFrete !== null) setModalidadeFrete(Number(nf.modalidadeFrete));
        if (nf.transportadoraId) {
          setTransportadoraId(String(nf.transportadoraId));
          const tr = transportadoras.find(t => t.id === nf.transportadoraId) || null;
          if (tr) setTransportadoraSelecionada(tr);
        }

      // Pagamentos existentes ao editar
      if (nf && Array.isArray((nf as any).pagamentos)) {
        const list = (nf as any).pagamentos.map((p: any) => ({
          formaPagamentoCodigo: Number(p.formaPagamentoCodigo),
          formaPagamentoDescricao: String(p.formaPagamentoDescricao || ''),
          numeroParcela: p.numeroParcela ? Number(p.numeroParcela) : undefined,
          numeroDocumento: p.numeroDocumento || undefined,
          dataVencimento: toInputDate(p.dataVencimento),
          valor: Number(p.valor) || 0,
          operadoraCartaoId: p.operadoraCartaoId || undefined,
          autorizacao: p.autorizacao || undefined,
        }));
        setPagamentos(list);
      }
        if (nf.ufVeiculo) setUfVeiculo(String(nf.ufVeiculo));
        if (nf.placaVeiculo) setPlacaVeiculo(String(nf.placaVeiculo));
        if (nf.valorFrete !== undefined && nf.valorFrete !== null) setValorFrete(toCurrency(Number(nf.valorFrete)));
        if (nf.volumes !== undefined && nf.volumes !== null) setVolumes(String(nf.volumes));
        if (nf.tipoVolume) setTipoVolume(String(nf.tipoVolume));
        if (nf.marcaVolume) setMarcaVolume(String(nf.marcaVolume));
        if (nf.pesoBruto !== undefined && nf.pesoBruto !== null) setPesoBruto(toCurrency(Number(nf.pesoBruto)));
        if (nf.pesoLiquido !== undefined && nf.pesoLiquido !== null) setPesoLiquido(toCurrency(Number(nf.pesoLiquido)));
      }

      // Campos de Dados da NF-e
      if (nf) {
        if (nf.finalidadeEmissao) setFinalidadeEmissao(String(nf.finalidadeEmissao));
        if (nf.natureza) setNatureza(String(nf.natureza));
        if (nf.tipoDoc) setTipoDoc(String(nf.tipoDoc));
        if (nf.desconto !== undefined && nf.desconto !== null) setDesconto(toCurrency(Number(nf.desconto)));
        if (nf.tipoOper) setTipoOper(String(nf.tipoOper));
        if (nf.operacao) setOperacao(String(nf.operacao));
        if (nf.formaPgto) setFormaPgto(String(nf.formaPgto));
        if (nf.percCreditoSimples !== undefined && nf.percCreditoSimples !== null) setPercCreditoSimples(toCurrency(Number(nf.percCreditoSimples)));
        if (nf.cfopAlternativo) setCfopAlternativo(String(nf.cfopAlternativo));
        if (nf.consumidorFinal !== undefined && nf.consumidorFinal !== null) setConsumidorFinal(Boolean(nf.consumidorFinal));
      }

      // Aba Adicionais
      if (nf) {
        if (nf.numeroPedido) setNumeroPedido(String(nf.numeroPedido));
        if (nf.nomeVendedor) setNomeVendedor(String(nf.nomeVendedor));
        if (nf.outrasDespesasAcessorias !== undefined && nf.outrasDespesasAcessorias !== null) setOutrasDespesasAcessorias(toCurrency(Number(nf.outrasDespesasAcessorias)));
        if (nf.obsAdicionais) setObsAdicionais(String(nf.obsAdicionais));
        if (nf.infAdFisco) setInfAdFisco(String(nf.infAdFisco));
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nfe]);

  useEffect(() => {
    // Focar no campo de quantidade após adicionar um item
    if (focusIndex !== null) {
      const el = quantidadeInputsRef.current[focusIndex];
      if (el) {
        el.focus();
        el.select();
      }
      setFocusIndex(null);
    }
  }, [focusIndex, itens.length]);

  const produtosFiltrados = useMemo(() => {
    const q = buscaProduto.trim().toLowerCase();
    if (!q) return produtos.slice(0, 10);
    return produtos.filter((p: any) => String(p.descricao).toLowerCase().includes(q)).slice(0, 10);
  }, [buscaProduto, produtos]);

  const adicionarItem = (p: Produto) => {
    setItens(prev => {
      const next = [
        ...prev,
        {
          produtoId: p.id,
          descricao: p.descricao || '',
          quantidade: 1,
          valorUnit: p.precoVenda ? Number(p.precoVenda) : 0,
        },
      ];
      // define o índice para focar (última linha)
      setTimeout(() => setFocusIndex(next.length - 1), 0);
      return next;
    });
    setActiveTab('itens');
  };

  const atualizarItem = (index: number, patch: Partial<ItemEdit>) => {
    setItens(prev => prev.map((it, i) => i === index ? { ...it, ...patch } : it));
  };

  const removerItem = (index: number) => {
    setItens(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Validação: Tomador obrigatório
      if (!cnpjCliente || !nomeCliente) {
        toast.error('Selecione um tomador antes de salvar.');
        setActiveTab('dados');
        setShowTomadoresModal(true);
        return;
      }

      const payload = {
        id: nfe?.id,
        numero,
        serie,
        ambiente,
        cnpjCliente,
        nomeCliente,
        dataEmissao,
        status,
        protocolo,
        chaveAcesso,
        itens,
        // Transporte
        modalidadeFrete,
        transportadoraId: transportadoraId || null,
        ufVeiculo: ufVeiculo || null,
        placaVeiculo: placaVeiculo || null,
        valorFrete: parseCurrency(valorFrete),
        volumes: Number(volumes || '0'),
        tipoVolume: tipoVolume || null,
        marcaVolume: marcaVolume || null,
        pesoBruto: parseCurrency(pesoBruto),
        pesoLiquido: parseCurrency(pesoLiquido),
        // Dados da NFe
        finalidadeEmissao,
        natureza,
        tipoDoc,
        desconto: parseCurrency(desconto),
        tipoOper,
        operacao,
        formaPgto,
        percCreditoSimples: parseCurrency(percCreditoSimples),
        cfopAlternativo: cfopAlternativo || null,
        consumidorFinal,
        // Pagamentos
        pagamentos: pagamentos.map(p => ({
          formaPagamentoCodigo: p.formaPagamentoCodigo,
          formaPagamentoDescricao: p.formaPagamentoDescricao,
          numeroParcela: p.numeroParcela,
          numeroDocumento: p.numeroDocumento,
          dataVencimento: p.dataVencimento,
          valor: p.valor,
          operadoraCartaoId: p.operadoraCartaoId,
          autorizacao: p.autorizacao,
        })),
        // Adicionais
        numeroPedido: numeroPedido || null,
        nomeVendedor: nomeVendedor || null,
        outrasDespesasAcessorias: parseCurrency(outrasDespesasAcessorias),
        obsAdicionais: obsAdicionais || null,
        infAdFisco: infAdFisco || null,
      };
      const url = `/api/nfe/${isNew ? 'create' : 'update'}`;
      const resp = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!resp.ok) throw new Error('Falha ao salvar a NF-e');
      toast.success('NF-e salva com sucesso');
      router.push('/nfe');
    } catch (err: any) {
      console.error(err);
      toast.error('Erro ao salvar NF-e');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Cabeçalho principal */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-gray-50 p-4 rounded border">
        <div>
          <label className="block text-sm text-gray-600 mb-1">Número</label>
          <input
            value={numero}
            onChange={(e)=>setNumero(Number(e.target.value)||0)}
            type="number"
            className={`h-10 w-full rounded-md border px-3 bg-gray-100 text-gray-600 border-gray-200 cursor-not-allowed`}
            required
            readOnly
            disabled
          />
        </div>
        <div>
          <label className="block text-sm text-gray-600 mb-1">Série</label>
          <input
            value={serie}
            onChange={(e)=>setSerie(Number(e.target.value)||1)}
            type="number"
            className={`h-10 w-full rounded-md border px-3 bg-gray-100 text-gray-600 border-gray-200 cursor-not-allowed`}
            readOnly
            disabled
          />
        </div>
        {/* Status somente informativo (badge) */}
        <div>
          <label className="block text-sm text-gray-600 mb-1">Status</label>
          <div className="h-10 flex items-center">
            <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
              status === '0' ? 'bg-red-100 text-red-800' :
              status === '1' ? 'bg-green-100 text-green-800' :
              status === '2' ? 'bg-gray-200 text-gray-800' :
              status === '6' ? 'bg-yellow-100 text-yellow-800' :
              'bg-blue-100 text-blue-800'
            }`}>
              {status === '0' ? 'Não transmitida' : status === '1' ? 'Autorizada' : status === '2' ? 'Cancelada' : status === '6' ? 'Inutilizada' : status}
            </span>
          </div>
        </div>
        <div className="md:col-span-1">
          <label className="block text-sm text-gray-600 mb-1">Chave de Acesso</label>
          <input
            value={chaveAcesso}
            type="text"
            className="h-10 w-full rounded-md border px-3 bg-gray-100 text-gray-600 border-gray-200 cursor-not-allowed"
            readOnly
            disabled
            title="Campo somente leitura. A chave de acesso é gerada pelo sistema após a autorização."
          />
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm text-gray-600 mb-1">Tomador (CNPJ/CPF)</label>
          <div className="flex gap-1">
            <input value={cnpjCliente} readOnly className="h-10 w-full rounded-md border border-gray-300 px-3 bg-gray-100" />
            <button type="button" onClick={()=>setShowTomadoresModal(true)} className="px-3 py-2 text-sm border rounded flex items-center gap-2"><Users size={16}/> Selecionar</button>
          </div>
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm text-gray-600 mb-1">Nome do Tomador</label>
          <input value={nomeCliente} readOnly className="h-10 w-full rounded-md border border-gray-300 px-3 bg-gray-100" />
        </div>
      </div>

      {/* Abas */}
      <div className="border-b mb-2 flex gap-2">
        {[
          { id: 'dados', label: 'Dados da NF-e' },
          { id: 'itens', label: 'Itens da Nota' },
          { id: 'transporte', label: 'Transporte' },
          { id: 'adicionais', label: 'Adicionais' },
          { id: 'pagamento', label: 'Pagamento' },
          { id: 'historico', label: 'Histórico' },
        ].map(t => (
          <button type="button" key={t.id} onClick={() => setActiveTab(t.id as any)} className={`px-3 py-2 text-sm rounded-t ${activeTab===t.id? 'bg-white border-x border-t' : 'bg-gray-100'} `}>{t.label}</button>
        ))}
      </div>

      {activeTab==='dados' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Linha 1 */}
          <div>
            <label className="block text-sm text-gray-600 mb-1">Data Emissão</label>
            <input value={dataEmissao} readOnly type="date" className="h-10 w-full rounded-md border border-gray-300 px-3 bg-gray-100" />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">Finalidade de Emissão</label>
            <select value={finalidadeEmissao} onChange={(e)=>setFinalidadeEmissao(e.target.value)} className="h-10 w-full rounded-md border border-gray-300 px-3">
              <option>Normal</option>
              <option>Complementar</option>
              <option>Ajuste</option>
              <option>Devolução</option>
            </select>
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">Protocolo</label>
            <input value={protocolo} readOnly type="text" className="h-10 w-full rounded-md border border-gray-300 px-3 bg-gray-100" />
          </div>

          {/* Linha 2 */}
          <div>
            <label className="block text-sm text-gray-600 mb-1">Natureza</label>
            <div className="flex gap-2">
              <input value={natureza} readOnly className="h-10 w-full rounded-md border border-gray-300 px-3 bg-gray-100" />
              <button type="button" onClick={()=>setShowNaturezasModal(true)} className="px-3 py-2 text-sm border rounded">Selecionar</button>
            </div>
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">Forma Pgto</label>
            <select value={formaPgto} onChange={(e)=>setFormaPgto(e.target.value)} className="h-10 w-full rounded-md border border-gray-300 px-3">
              <option>À Vista</option>
              <option>A Prazo</option>
              <option>Outros</option>
            </select>
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">Valor Total (auto)</label>
            <input value={total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} readOnly className="h-10 w-full rounded-md border border-gray-300 px-3 bg-gray-100" />
          </div>

          {/* Linha 3 */}
          <div>
            <label className="block text-sm text-gray-600 mb-1">Tipo Doc.</label>
            <select value={tipoDoc} onChange={(e)=>setTipoDoc(e.target.value)} className="h-10 w-full rounded-md border border-gray-300 px-3">
              <option>Saída</option>
              <option>Entrada</option>
            </select>
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">Perc Crédito Simples</label>
            <input value={percCreditoSimples} onChange={(e)=>handleCurrencyInput(e.target.value, setPercCreditoSimples)} className="h-10 w-full rounded-md border border-gray-300 px-3 text-right" />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">Desconto</label>
            <input value={desconto} onChange={(e)=>handleCurrencyInput(e.target.value, setDesconto)} className="h-10 w-full rounded-md border border-gray-300 px-3 text-right" />
          </div>

          {/* Linha 4 */}
          <div>
            <label className="block text-sm text-gray-600 mb-1">Tipo Oper.</label>
            <select value={tipoOper} onChange={(e)=>setTipoOper(e.target.value)} className="h-10 w-full rounded-md border border-gray-300 px-3">
              <option>Operação Interna</option>
              <option>Interestadual</option>
              <option>Exterior</option>
            </select>
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">CFOP Alternativo</label>
            <input value={cfopAlternativo} onChange={(e)=>setCfopAlternativo(e.target.value)} className="h-10 w-full rounded-md border border-gray-300 px-3" />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">Operação</label>
            <select value={operacao} onChange={(e)=>setOperacao(e.target.value)} className="h-10 w-full rounded-md border border-gray-300 px-3">
              <option>Presencial</option>
              <option>Não Presencial</option>
              <option>Teleatendimento</option>
              <option>Internet</option>
            </select>
          </div>

          {/* Linha 5 */}
          <div className="md:col-span-1 flex items-center gap-2">
            <input id="consumidorFinal" checked={consumidorFinal} onChange={(e)=>setConsumidorFinal(e.target.checked)} type="checkbox" className="h-4 w-4" />
            <label htmlFor="consumidorFinal" className="text-sm text-gray-700">Consumidor Final</label>
          </div>
        </div>
      )}

      {/* Modal de Naturezas */}
      {showNaturezasModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={()=>setShowNaturezasModal(false)} />
          <div className="relative bg-white rounded-lg shadow-lg w-full max-w-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-semibold">Selecionar Natureza</h3>
              <button onClick={()=>setShowNaturezasModal(false)} className="text-gray-600 hover:text-gray-800">✕</button>
            </div>
            <div className="mb-3">
              <label className="block text-sm text-gray-600 mb-1">Buscar</label>
              <input value={buscaNatureza} onChange={(e)=>setBuscaNatureza(e.target.value)} placeholder="Descrição" className="h-10 w-full rounded-md border border-gray-300 px-3" />
            </div>
            <div className="border rounded max-h-80 overflow-auto">
              {naturezas
                .filter(n => {
                  const q = buscaNatureza.trim().toLowerCase();
                  if (!q) return true;
                  return String(n.descricao).toLowerCase().includes(q);
                })
                .slice(0, 100)
                .map(n => (
                  <button key={n.id} type="button" onClick={()=>{ setNatureza(n.descricao); setShowNaturezasModal(false); setBuscaNatureza(''); }} className="w-full text-left px-3 py-2 hover:bg-gray-50 border-b last:border-b-0">
                    <div className="font-medium">{n.descricao}</div>
                  </button>
                ))}
              {naturezas.length === 0 && (
                <div className="p-3 text-sm text-gray-500">Nenhuma natureza encontrada.</div>
              )}
            </div>
            <div className="mt-3 text-right">
              <button onClick={()=>setShowNaturezasModal(false)} className="px-3 py-2 text-sm border rounded">Fechar</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Transportadoras */}
      {showTransportadorasModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={()=>setShowTransportadorasModal(false)} />
          <div className="relative bg-white rounded-lg shadow-lg w-full max-w-2xl p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-semibold">Selecionar Transportadora</h3>
              <button onClick={()=>setShowTransportadorasModal(false)} className="text-gray-600 hover:text-gray-800">✕</button>
            </div>
            <div className="mb-3">
              <label className="block text-sm text-gray-600 mb-1">Buscar</label>
              <input
                value={buscaTransportadora}
                onChange={(e)=>setBuscaTransportadora(e.target.value)}
                placeholder="Razão social ou código"
                className="h-10 w-full rounded-md border border-gray-300 px-3"
              />
            </div>
            <div className="border rounded max-h-80 overflow-auto">
              {transportadoras
                .filter(t => {
                  const q = buscaTransportadora.trim().toLowerCase();
                  if (!q) return true;
                  return String(t.razaoSocial).toLowerCase().includes(q) || String(t.codigo).toLowerCase().includes(q);
                })
                .slice(0, 50)
                .map((t) => (
                <button
                  type="button"
                  key={t.id}
                  onClick={() => {
                    setTransportadoraSelecionada(t);
                    setTransportadoraId(t.id);
                    setShowTransportadorasModal(false);
                    setBuscaTransportadora('');
                  }}
                  className="w-full text-left px-3 py-2 hover:bg-gray-50 border-b last:border-b-0"
                >
                  <div className="font-medium">{t.razaoSocial}</div>
                  <div className="text-xs text-gray-500">{t.codigo} • {t.cpfCnpj}</div>
                </button>
              ))}
              {transportadoras.length === 0 && (
                <div className="p-3 text-sm text-gray-500">Nenhuma transportadora encontrada.</div>
              )}
            </div>
            <div className="mt-3 text-right">
              <button onClick={()=>setShowTransportadorasModal(false)} className="px-3 py-2 text-sm border rounded">Fechar</button>
            </div>
          </div>
        </div>
      )}

      {activeTab==='itens' && (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2 items-end">
            <button type="button" onClick={()=>setShowProdutosModal(true)} className="px-3 py-2 text-sm border rounded flex items-center gap-2"><PlusCircle size={16}/> Adicionar Produto</button>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="p-2 text-left">Produto/Descrição</th>
                  <th className="p-2 text-right">Qtd</th>
                  <th className="p-2 text-right">Vlr Unit</th>
                  <th className="p-2 text-right">Vlr Total</th>
                  <th className="p-2"></th>
                </tr>
              </thead>
              <tbody>
                {itens.map((it, idx) => (
                  <tr key={idx} className="border-b">
                    <td className="p-2">
                      <input value={it.descricao} onChange={(e)=>atualizarItem(idx, { descricao: e.target.value })} className="w-full border rounded px-2 py-1" />
                    </td>
                    <td className="p-2 text-right">
                      <input
                        ref={(el) => { quantidadeInputsRef.current[idx] = el; }}
                        type="number"
                        step="0.01"
                        value={it.quantidade}
                        onChange={(e)=>atualizarItem(idx, { quantidade: Number(e.target.value)||0 })}
                        className="w-24 border rounded px-2 py-1 text-right"
                      />
                    </td>
                    <td className="p-2 text-right">
                      <input type="number" step="0.01" value={it.valorUnit} onChange={(e)=>atualizarItem(idx, { valorUnit: Number(e.target.value)||0 })} className="w-24 border rounded px-2 py-1 text-right" />
                    </td>
                    <td className="p-2 text-right">{(it.quantidade*it.valorUnit).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                    <td className="p-2 text-right">
                      <button type="button" onClick={()=>removerItem(idx)} className="px-2 py-1 border rounded text-red-600 flex items-center gap-1"><Trash2 size={14}/> Remover</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="text-right font-medium">Total dos Produtos: {total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
        </div>
      )}

      {activeTab==='transporte' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Modalidade do Frete */}
          <div>
            <label className="block text-sm text-gray-600 mb-1">Modalidade do Frete</label>
            <select value={modalidadeFrete} onChange={(e)=>setModalidadeFrete(Number(e.target.value))} className="h-10 w-full rounded-md border border-gray-300 px-3">
              <option value={0}>Frete por conta do Remetente</option>
              <option value={1}>Frete por conta do Destinatário</option>
              <option value={2}>Frete por conta de Terceiros</option>
              <option value={3}>Transporte Próprio por conta do Remetente</option>
              <option value={4}>Transporte Próprio por conta do Destinatário</option>
              <option value={9}>Sem Ocorrência de Transporte</option>
            </select>
          </div>

          {/* Transportadora */}
          <div className="md:col-span-2">
            <label className="block text-sm text-gray-600 mb-1">Transportadora</label>
            {transportadoraSelecionada ? (
              <div className="p-2 border rounded bg-gray-50 text-sm">
                <div className="flex flex-wrap gap-3 items-center justify-between">
                  <div>
                    <div className="font-medium">{transportadoraSelecionada.razaoSocial}</div>
                    <div className="text-gray-600">{transportadoraSelecionada.cpfCnpj}</div>
                  </div>
                  <button type="button" className="px-2 py-1 border rounded" onClick={()=>{ setTransportadoraSelecionada(null); setTransportadoraId(''); }}>Trocar</button>
                </div>
              </div>
            ) : (
              <button type="button" onClick={()=>setShowTransportadorasModal(true)} className="px-3 py-2 text-sm border rounded">Selecionar Transportadora</button>
            )}
          </div>

          <div className="md:col-span-1">
            {/* Utiliza o mesmo componente de UF da aba Tomadores. Ignora município */}
            <UfMunicipioSelector
              defaultUf={ufVeiculo}
              defaultCodigoMunicipio=""
              onUfChange={(uf) => setUfVeiculo((uf || '').toUpperCase())}
              onMunicipioChange={() => { /* ignorado no contexto de transporte */ }}
              showMunicipio={false}
            />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">Placa Veículo</label>
            <input value={placaVeiculo} onChange={(e)=>setPlacaVeiculo(e.target.value.toUpperCase())} className="h-10 w-full rounded-md border border-gray-300 px-3" />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">Valor Frete</label>
            <input value={valorFrete} onChange={(e)=>handleCurrencyInput(e.target.value, setValorFrete)} className="h-10 w-full rounded-md border border-gray-300 px-3 text-right" />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">Volumes</label>
            <input value={volumes} onChange={(e)=>setVolumes(e.target.value.replace(/\D/g, ''))} className="h-10 w-full rounded-md border border-gray-300 px-3 text-right" />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">Tipo Volume</label>
            <input value={tipoVolume} onChange={(e)=>setTipoVolume(e.target.value)} className="h-10 w-full rounded-md border border-gray-300 px-3" />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">Marca Volume</label>
            <input value={marcaVolume} onChange={(e)=>setMarcaVolume(e.target.value)} className="h-10 w-full rounded-md border border-gray-300 px-3" />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">Peso Bruto</label>
            <input value={pesoBruto} onChange={(e)=>handleCurrencyInput(e.target.value, setPesoBruto)} className="h-10 w-full rounded-md border border-gray-300 px-3 text-right" />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">Peso Líquido</label>
            <input value={pesoLiquido} onChange={(e)=>handleCurrencyInput(e.target.value, setPesoLiquido)} className="h-10 w-full rounded-md border border-gray-300 px-3 text-right" />
          </div>
        </div>
      )}

      {activeTab==='adicionais' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm text-gray-600 mb-1">Número do Pedido</label>
              <input value={numeroPedido} onChange={(e)=>setNumeroPedido(e.target.value)} className="h-10 w-full rounded-md border border-gray-300 px-3" />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Outras Despesas Acess.</label>
              <input value={outrasDespesasAcessorias} onChange={(e)=>handleCurrencyInput(e.target.value, setOutrasDespesasAcessorias)} className="h-10 w-full rounded-md border border-gray-300 px-3 text-right" />
            </div>
          </div>

          <div>
            <label className="block text-sm text-gray-600 mb-1">Nome do Vendedor</label>
            <input value={nomeVendedor} onChange={(e)=>setNomeVendedor(e.target.value)} className="h-10 w-full rounded-md border border-gray-300 px-3" />
          </div>

          <div>
            <label className="block text-sm text-gray-600 mb-1">Obs. Adicionais</label>
            <textarea value={obsAdicionais} onChange={(e)=>setObsAdicionais(e.target.value)} rows={4} className="w-full rounded-md border border-gray-300 px-3 py-2"></textarea>
          </div>

          <div>
            <label className="block text-sm text-gray-600 mb-1">Inf. Ad. Fisco</label>
            <textarea value={infAdFisco} onChange={(e)=>setInfAdFisco(e.target.value)} rows={4} className="w-full rounded-md border border-gray-300 px-3 py-2"></textarea>
          </div>
        </div>
      )}

      {activeTab==='pagamento' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm text-gray-600 mb-1">Nº Documento</label>
              <input value={numeroDocumento} onChange={(e)=>handleNumeroDocumento(e.target.value)} onBlur={handleNumeroDocumentoBlur} maxLength={3} className="h-10 w-full rounded-md border border-gray-300 px-3" />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Data de Vencimento</label>
              <input type="date" value={dataVencimento} onChange={(e)=>setDataVencimento(e.target.value)} className="h-10 w-full rounded-md border border-gray-300 px-3" />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Valor</label>
              <input value={valorPagamento} onChange={(e)=>handleCurrencyInput(e.target.value, setValorPagamento)} className="h-10 w-full rounded-md border border-gray-300 px-3 text-right" />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Forma de Pagamento</label>
              <select value={formaPagamentoCodigo} onChange={(e)=>setFormaPagamentoCodigo(Number(e.target.value))} className="h-10 w-full rounded-md border border-gray-300 px-3">
                {formasPagamento.map(fp => (
                  <option key={fp.codigo} value={fp.codigo}>{fp.descricao}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Campos de cartão visíveis quando a forma for 03 ou 04 */}
          {(formaPagamentoCodigo === 3 || formaPagamentoCodigo === 4) && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm text-gray-600 mb-1">Operadora de Cartão</label>
                <select value={operadoraCartaoId} onChange={(e)=>setOperadoraCartaoId(e.target.value)} className="h-10 w-full rounded-md border border-gray-300 px-3">
                  <option value="">Selecione</option>
                  {operadoras.map((op:any) => (
                    <option key={op.id} value={op.id}>{op.descricao}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Autorização</label>
                <input value={autorizacao} onChange={(e)=>setAutorizacao(e.target.value)} className="h-10 w-full rounded-md border border-gray-300 px-3" />
              </div>
            </div>
          )}

          <div className="flex gap-2">
            <button type="button" onClick={() => {
              const fp = formasPagamento.find(f=>f.codigo===formaPagamentoCodigo);
              const valor = parseCurrency(valorPagamento);
              if (!fp || valor<=0) { toast.error('Informe forma e valor.'); return; }
              // Data obrigatória
              if (!dataVencimento) { toast.error('Informe a data de vencimento.'); return; }
              setPagamentos(prev => {
                const parcelaAuto = prev.length + 1;
                return ([
                  ...prev,
                  {
                    formaPagamentoCodigo,
                    formaPagamentoDescricao: fp.descricao,
                    numeroParcela: parcelaAuto,
                    numeroDocumento: numeroDocumento || undefined,
                    dataVencimento: dataVencimento || undefined,
                    valor,
                    operadoraCartaoId: (formaPagamentoCodigo===3||formaPagamentoCodigo===4) && operadoraCartaoId ? operadoraCartaoId : undefined,
                    autorizacao: (formaPagamentoCodigo===3||formaPagamentoCodigo===4) && autorizacao ? autorizacao : undefined,
                  }
                ]);
              });
              // limpar campos de lançamento
              setNumeroDocumento('');
              setDataVencimento('');
              setValorPagamento('');
              setOperadoraCartaoId('');
              setAutorizacao('');
            }} className="px-3 py-2 text-sm border rounded">Lançar</button>
            <button type="button" onClick={()=>{ setNumeroDocumento(''); setDataVencimento(''); setValorPagamento(''); setOperadoraCartaoId(''); setAutorizacao(''); }} className="px-3 py-2 text-sm border rounded">Limpar</button>
            <div className="ml-auto text-sm text-gray-700 flex items-center">Total dos Pagamentos:&nbsp;<b>{pagamentos.reduce((a,b)=>a+b.valor,0).toLocaleString('pt-BR',{minimumFractionDigits:2})}</b></div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="p-2 text-left">Parc</th>
                  <th className="p-2 text-left">Vencimento</th>
                  <th className="p-2 text-right">Valor</th>
                  <th className="p-2 text-left">Forma</th>
                  <th className="p-2 text-left">Operadora</th>
                  <th className="p-2 text-left">Autorização</th>
                  <th className="p-2"></th>
                </tr>
              </thead>
              <tbody>
                {pagamentos.map((p, idx) => (
                  <tr key={idx} className="border-b">
                    <td className="p-2">{p.numeroParcela ?? ''}</td>
                    <td className="p-2">{formatDateBR(p.dataVencimento)}</td>
                    <td className="p-2 text-right">{p.valor.toLocaleString('pt-BR',{minimumFractionDigits:2})}</td>
                    <td className="p-2">{p.formaPagamentoDescricao}</td>
                    <td className="p-2">{(operadoras.find(o=>o.id===p.operadoraCartaoId)?.descricao) || ''}</td>
                    <td className="p-2">{p.autorizacao ?? ''}</td>
                    <td className="p-2 text-right"><button type="button" className="px-2 py-1 border rounded" onClick={()=>setPagamentos(prev=>prev.filter((_,i)=>i!==idx))}>Remover</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab==='historico' && (
        <div className="space-y-3">
          {!nfe?.id ? (
            <div className="text-sm text-gray-600">Esta NF-e ainda não foi salva. O histórico será exibido após a criação.</div>
          ) : loadingHistorico ? (
            <div className="text-sm text-gray-600">Carregando histórico...</div>
          ) : historico.length === 0 ? (
            <div className="text-sm text-gray-600">Nenhum evento registrado para esta NFe.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="p-2 text-left">Data/Hora</th>
                    <th className="p-2 text-left">Usuário</th>
                    <th className="p-2 text-left">Ação</th>
                    <th className="p-2 text-left">Descrição</th>
                  </tr>
                </thead>
                <tbody>
                  {historico.map((l) => (
                    <tr key={l.id} className="border-b align-top">
                      <td className="p-2">{new Date(l.dataHora).toLocaleString('pt-BR')}</td>
                      <td className="p-2">{l.usuarioNome || '-'}</td>
                      <td className="p-2">{l.acao}</td>
                      <td className="p-2 whitespace-pre-wrap">{l.descricao}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      <div className="flex items-center justify-end gap-3 pt-2">
        <Link href="/nfe" className="px-4 py-2 rounded bg-gray-100 text-gray-700 hover:bg-gray-200 flex items-center gap-2"><ArrowLeft size={16}/> Voltar</Link>
        <button type="submit" className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700 flex items-center gap-2"><Save size={16}/> Salvar</button>
      </div>

      {/* Modal de Produtos */}
      {showProdutosModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={()=>setShowProdutosModal(false)} />
          <div className="relative bg-white rounded-lg shadow-lg w-full max-w-2xl p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-semibold">Selecionar Produto</h3>
              <button onClick={()=>setShowProdutosModal(false)} className="text-gray-600 hover:text-gray-800">✕</button>
            </div>
            <div className="mb-3">
              <label className="block text-sm text-gray-600 mb-1">Buscar</label>
              <input
                value={buscaProduto}
                onChange={(e)=>setBuscaProduto(e.target.value)}
                placeholder="Descrição do produto"
                className="h-10 w-full rounded-md border border-gray-300 px-3"
              />
            </div>
            <div className="border rounded max-h-80 overflow-auto">
              {(produtosFiltrados.length === 0) && (
                <div className="p-3 text-sm text-gray-500">Nenhum produto encontrado.</div>
              )}
              {produtosFiltrados.map((p)=> (
                <button
                  type="button"
                  key={p.id}
                  onClick={() => {
                    adicionarItem(p as any);
                    setShowProdutosModal(false);
                    setBuscaProduto('');
                  }}
                  className="w-full text-left px-3 py-2 hover:bg-gray-50 border-b last:border-b-0"
                >
                  <div className="font-medium">{p.descricao}</div>
                  <div className="text-xs text-gray-500">{(p as any).codigo || ''} {(p as any).ncm ? `• NCM ${String((p as any).ncm)}` : ''}</div>
                </button>
              ))}
            </div>
            <div className="mt-3 text-right">
              <button onClick={()=>setShowProdutosModal(false)} className="px-3 py-2 text-sm border rounded">Fechar</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Tomadores */}
      {showTomadoresModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={()=>setShowTomadoresModal(false)} />
          <div className="relative bg-white rounded-lg shadow-lg w-full max-w-2xl p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-semibold">Selecionar Tomador</h3>
              <button onClick={()=>setShowTomadoresModal(false)} className="text-gray-600 hover:text-gray-800">✕</button>
            </div>
            <div className="mb-3">
              <label className="block text-sm text-gray-600 mb-1">Buscar</label>
              <input
                value={buscaTomador}
                onChange={(e)=>setBuscaTomador(e.target.value)}
                placeholder="Nome ou CPF/CNPJ"
                className="h-10 w-full rounded-md border border-gray-300 px-3"
              />
            </div>
            <div className="border rounded max-h-80 overflow-auto">
              {tomadores
                .filter(t => {
                  const q = buscaTomador.trim().toLowerCase();
                  if (!q) return true;
                  return String(t.razaoSocial).toLowerCase().includes(q) || String(t.cpfCnpj).toLowerCase().includes(q);
                })
                .slice(0, 50)
                .map((t) => (
                <button
                  type="button"
                  key={t.id}
                  onClick={() => {
                    setCnpjCliente(t.cpfCnpj);
                    setNomeCliente(t.razaoSocial);
                    setShowTomadoresModal(false);
                    setBuscaTomador('');
                  }}
                  className="w-full text-left px-3 py-2 hover:bg-gray-50 border-b last:border-b-0"
                >
                  <div className="font-medium">{t.razaoSocial}</div>
                  <div className="text-xs text-gray-500">{t.cpfCnpj}</div>
                </button>
              ))}
              {tomadores.length === 0 && (
                <div className="p-3 text-sm text-gray-500">Nenhum tomador encontrado.</div>
              )}
            </div>
            <div className="mt-3 text-right">
              <button onClick={()=>setShowTomadoresModal(false)} className="px-3 py-2 text-sm border rounded">Fechar</button>
            </div>
          </div>
        </div>
      )}
    </form>
  );
}
