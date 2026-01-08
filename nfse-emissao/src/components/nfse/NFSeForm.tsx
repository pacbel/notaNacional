'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { ArrowLeft, Save } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { DadosNotaFiscalSection } from './DadosNotaFiscalSection';
import { ServicosSection } from './ServicosSection';
import { ValoresSection } from './ValoresSection';
import { IntermediarioSection } from './IntermediarioSection';
import { ConstrucaoCivilSection } from './ConstrucaoCivilSection';
import { ClientCalculos } from './ClientCalculos';

// Interfaces de Dados
export interface Prestador {
  id: string;
  razaoSocial: string;
  cnpj: string;
  inscricaoMunicipal: string;
  proximoNumeroRps: number;
  serieRps: string;
  ambiente: string;
  optanteSimplesNacional: boolean;
  incentivadorCultural: boolean;
  exibirConstrucaoCivil: boolean;
  aliquota?: number; // decimal, ex.: 0.025
  tpRetIssqn?: number; // 1 nao retido, 2 retido tomador, 3 retido intermediario
}

export interface Tomador {
  id: string;
  razaoSocial: string;
  cpfCnpj: string;
  inscricaoMunicipal?: string;
  endereco?: string;
  numero?: string;
  complemento?: string;
  bairro?: string;
  codigoMunicipio?: string;
  uf?: string;
  cep?: string;
  telefone?: string;
  email?: string;
}

export interface Servico {
  id: string;
  descricao: string;
  valorUnitario: number;
  codigoTributacao?: string;
  itemListaServico?: string;
}

export interface ServicoItem {
  servicoId: string;
  quantidade: number;
  valorUnitario: number;
  valorTotal: number;
}

export interface NotaFiscal {
  id?: string;
  numeroRps?: number;
  serieRps?: string;
  ambiente?: string;
  prestadorId: string;
  tomadorId: string;
  competencia: string;
  descricao?: string;
  valorServicos: number;
  baseCalculo?: number;
  valorIss?: number;
  aliquota: number;
  issRetido: boolean;
  valorDeducoes: number;
  descontoCondicionado: number;
  descontoIncondicionado: number;
  valorPis: number;
  valorCofins: number;
  valorInss: number;
  valorIr: number;
  valorCsll: number;
  outrasRetencoes?: number;
  valorLiquidoNfse: number;
  tipoIntermediario: string;
  intermediarioRazaoSocial?: string;
  intermediarioCpfCnpj?: string;
  intermediarioInscricaoMunicipal?: string;
  construcaoCivilNumeroMatricula?: string;
  construcaoCivilNumeroArt?: string;
  servicos: ServicoItem[];
  status?: string;
}

interface NFSeFormProps {
  notaFiscalId?: string;
  initialData?: Partial<NotaFiscal>;
}

export function NFSeForm({ notaFiscalId, initialData }: NFSeFormProps) {
  // --- Estados do Componente ---
  const [prestadores, setPrestadores] = useState<Prestador[]>([]);
  const [tomadores, setTomadores] = useState<Tomador[]>([]);
  const [servicos, setServicos] = useState<Servico[]>([]);
  const [loading, setLoading] = useState(true);
  const [notaFiscal, setNotaFiscal] = useState<Partial<NotaFiscal>>(initialData || {});

  // --- Valores Derivados ---
  const prestadorSelecionado = useMemo(() => {
    return prestadores.find(p => p.id === notaFiscal?.prestadorId) || null;
  }, [notaFiscal?.prestadorId, prestadores]);

  const tomadorSelecionado = useMemo(() => {
    return tomadores.find(t => t.id === notaFiscal?.tomadorId) || null;
  }, [notaFiscal?.tomadorId, tomadores]);
  const [itensServico, setItensServico] = useState<ServicoItem[]>([{ servicoId: '', quantidade: 1, valorUnitario: 0, valorTotal: 0 }]);
  
  const router = useRouter();
  const isEditing = !!notaFiscalId;

  // --- Handlers de Mudança ---
  const handleNotaFiscalChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const isCheckbox = type === 'checkbox';
    const checked = (e.target as HTMLInputElement).checked;

    const parsedValue = name === 'issRetido'
      ? (isCheckbox ? checked : value === 'true')
      : !isNaN(Number(value.replace(',', '.'))) && value.trim() !== ''
      ? parseFloat(value.replace(',', '.'))
      : value;

    setNotaFiscal(prev => ({ ...prev, [name]: parsedValue }));
  };

  const handlePrestadorSelecionadoChange = useCallback((prestador: Prestador | null) => {
    // Ao mudar o prestador em uma nova nota, atualiza os dados relacionados ao RPS
    if (!notaFiscalId && prestador) {
      const aliqPercent = typeof prestador.aliquota === 'number' ? (prestador.aliquota * 100) : 0;
      const issRet = (prestador.tpRetIssqn ?? 1) === 1 ? false : true;
      setNotaFiscal(prev => ({
        ...prev,
        prestadorId: prestador.id,
        numeroRps: prestador.proximoNumeroRps,
        serieRps: prestador.serieRps,
        ambiente: prestador.ambiente,
        aliquota: aliqPercent,
        issRetido: issRet,
      }));
    } else {
      // Para uma nota existente, ou se o prestador for nulo, apenas atualiza o ID
      setNotaFiscal(prev => ({
        ...prev,
        prestadorId: prestador?.id || '',
      }));
    }
  }, [notaFiscalId]);

  const handleTomadorSelecionadoChange = useCallback((tomador: Tomador | null) => {
    setNotaFiscal(prev => ({ ...prev, tomadorId: tomador?.id || '' }));
  }, []);

  // --- Efeitos (Hooks) ---

  // Efeito para buscar dados iniciais (ao montar ou ao mudar o ID da nota)
  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const dadosApoioResponse = await fetch('/api/nfse/dados');
        if (!dadosApoioResponse.ok) throw new Error('Falha ao buscar dados de apoio');
        const dadosApoio = await dadosApoioResponse.json();
        
        const loadedPrestadores: Prestador[] = dadosApoio.prestadores || [];
        const loadedTomadores: Tomador[] = dadosApoio.tomadores || [];
        const loadedServicos: Servico[] = dadosApoio.servicos || [];

        setPrestadores(loadedPrestadores);
        setTomadores(loadedTomadores);
        setServicos(loadedServicos);

        if (notaFiscalId) {
          // Modo Edição: Carrega a nota existente
          const notaResponse = await fetch(`/api/nfse/${notaFiscalId}`);
          if (!notaResponse.ok) throw new Error('Nota fiscal não encontrada');
          const notaCarregada: NotaFiscal = await notaResponse.json();
          setNotaFiscal(notaCarregada);
          setItensServico(notaCarregada.servicos?.length > 0 ? notaCarregada.servicos : [{ servicoId: '', quantidade: 1, valorUnitario: 0, valorTotal: 0 }]);
        
        } else if (initialData && Object.keys(initialData).length > 0) {
            // Modo Criação com Dados Iniciais: Usa os dados da prop
            setNotaFiscal(initialData);
            // Garante que initialData.servicos não é undefined antes de acessar .length
            setItensServico(initialData.servicos && initialData.servicos.length > 0 ? initialData.servicos : [{ servicoId: '', quantidade: 1, valorUnitario: 0, valorTotal: 0 }]);

        } else {
          // Modo Criação do Zero: Inicializa uma nota nova com dados do primeiro prestador
          const primeiroPrestador = loadedPrestadores.length > 0 ? loadedPrestadores[0] : null;
          const aliqPercent = (primeiroPrestador && typeof primeiroPrestador.aliquota === 'number') ? (primeiroPrestador.aliquota * 100) : 0;
          const issRet = (primeiroPrestador?.tpRetIssqn ?? 1) === 1 ? false : true;
          const novaNota: Partial<NotaFiscal> = {
            competencia: new Date().toISOString().split('T')[0],
            prestadorId: primeiroPrestador?.id || '',
            tomadorId: '',
            numeroRps: primeiroPrestador?.proximoNumeroRps,
            serieRps: primeiroPrestador?.serieRps,
            ambiente: primeiroPrestador?.ambiente,
            valorServicos: 0, baseCalculo: 0, aliquota: aliqPercent, issRetido: issRet, valorDeducoes: 0, descontoCondicionado: 0, descontoIncondicionado: 0, valorPis: 0, valorCofins: 0, valorInss: 0, valorIr: 0, valorCsll: 0, outrasRetencoes: 0, valorLiquidoNfse: 0, tipoIntermediario: '0', servicos: [],
          };
          setNotaFiscal(novaNota);
          setItensServico([{ servicoId: '', quantidade: 1, valorUnitario: 0, valorTotal: 0 }]);
        }
      } catch (error) {
        console.error('Erro ao buscar dados para o formulário NFSe:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  // A dependência deve ser apenas notaFiscalId. initialData é usado apenas na montagem inicial.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [notaFiscalId]);

  // Efeito para calcular totais e atualizar descrição de forma atômica
  const itensServicoJson = JSON.stringify(itensServico);
  useEffect(() => {
    const currentItens = JSON.parse(itensServicoJson) as ServicoItem[];

    // --- Cálculos ---
    const valorServicos = currentItens.reduce((sum, item) => sum + (Number(item.valorTotal) || 0), 0);
    const valorDeducoes = Number(notaFiscal.valorDeducoes) || 0;
    const descontoIncondicionado = Number(notaFiscal.descontoIncondicionado) || 0;
    const descontoCondicionado = Number(notaFiscal.descontoCondicionado) || 0;
    const baseCalculo = valorServicos - valorDeducoes - descontoIncondicionado;
    const aliquota = Number(notaFiscal.aliquota) || 0;
    const valorIss = baseCalculo * (aliquota / 100);
    const outrasRetencoes = Number(notaFiscal.outrasRetencoes) || 0;
    const issRetido = notaFiscal.issRetido ? valorIss : 0;
    const valorPis = Number(notaFiscal.valorPis) || 0;
    const valorCofins = Number(notaFiscal.valorCofins) || 0;
    const valorInss = Number(notaFiscal.valorInss) || 0;
    const valorIr = Number(notaFiscal.valorIr) || 0;
    const valorCsll = Number(notaFiscal.valorCsll) || 0;
    const valorLiquidoNfse = valorServicos - valorPis - valorCofins - valorInss - valorIr - valorCsll - issRetido - outrasRetencoes - descontoCondicionado - descontoIncondicionado;

    // --- Descrição ---
    const novaDescricao = currentItens
      .map(item => {
        const servico = servicos.find(s => s.id === item.servicoId);
        return servico?.descricao;
      })
      .filter(Boolean)
      .join('; ');

    // --- Atualização Atômica do Estado ---
    setNotaFiscal(prev => {
      // Previne a atualização se nenhum valor relevante mudou
      if (
        prev.descricao === novaDescricao &&
        prev.valorServicos === valorServicos &&
        prev.baseCalculo === baseCalculo &&
        prev.valorIss === valorIss &&
        prev.valorLiquidoNfse === valorLiquidoNfse
      ) {
        return prev;
      }

      return {
        ...prev,
        descricao: novaDescricao,
        valorServicos,
        baseCalculo,
        valorIss,
        valorLiquidoNfse,
      };
    });
  }, [
    itensServicoJson,
    servicos,
    notaFiscal.valorDeducoes,
    notaFiscal.descontoIncondicionado,
    notaFiscal.descontoCondicionado,
    notaFiscal.outrasRetencoes,
    notaFiscal.issRetido,
    notaFiscal.aliquota,
    notaFiscal.valorPis,
    notaFiscal.valorCofins,
    notaFiscal.valorInss,
    notaFiscal.valorIr,
    notaFiscal.valorCsll,
  ]);

  // --- Submissão do Formulário ---
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // Validação dos itens de serviço
    if (itensServico.length === 0 || itensServico.some(item => !item.servicoId)) {
      alert('Por favor, adicione pelo menos um serviço válido.');
      return;
    }
    const formData = new FormData(e.currentTarget);
    Object.entries(notaFiscal).forEach(([key, value]) => {
      if (!formData.has(key) && value !== undefined && value !== null) {
        formData.append(key, String(value));
      }
    });

    try {
      const response = await fetch(isEditing ? `/api/nfse/${notaFiscalId}/editar` : '/api/nfse/salvar', {
        method: 'POST',
        body: formData,
      });
      if (response.ok) {
        router.push('/nfse');
      } else {
        const errorData = await response.json();
        alert(`Erro: ${errorData.message}`);
      }
    } catch (error) {
      alert('Ocorreu um erro de comunicação. Tente novamente.');
    }
  };

  // --- Renderização ---
  if (loading) {
    return <div className="flex justify-center items-center h-screen">Carregando...</div>;
  }

  return (
    <div className="container mx-auto p-4 bg-white rounded-lg shadow-md">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">
          {isEditing ? 'Editar Nota Fiscal de Serviço' : 'Emitir Nova Nota Fiscal de Serviço'}
        </h1>
      </div>
      <form onSubmit={handleSubmit} data-testid="nfse-form">
        {/* Campos ocultos */}
        <input type="hidden" name="serieRps" value={prestadorSelecionado?.serieRps || "1"} />
        <input type="hidden" name="ambiente" value={prestadorSelecionado?.ambiente || "2"} />
        <input type="hidden" name="optanteSimplesNacional" value={prestadorSelecionado?.optanteSimplesNacional ? "1" : "0"} />
        <input type="hidden" name="incentivadorCultural" value={prestadorSelecionado?.incentivadorCultural ? "1" : "0"} />
        
        {/* Seções do formulário */}
        <DadosNotaFiscalSection 
          prestadores={prestadores} 
          tomadores={tomadores} 
          notaFiscal={notaFiscal} 
          onPrestadorChange={handlePrestadorSelecionadoChange}
          onTomadorChange={handleTomadorSelecionadoChange}
          isEditing={isEditing}
          onNotaFiscalChange={handleNotaFiscalChange}
        />
        <ServicosSection 
          servicos={servicos} 
          itens={itensServico}
          setItens={setItensServico}
        />
        <ValoresSection 
          notaFiscal={notaFiscal} 
          onChange={handleNotaFiscalChange}
        />
        <IntermediarioSection 
          notaFiscal={notaFiscal as NotaFiscal}
        />
        {prestadorSelecionado?.exibirConstrucaoCivil && (
          <ConstrucaoCivilSection 
            notaFiscal={notaFiscal as NotaFiscal}
          />
        )}
        
        {/* Ações */}
        <div className="mt-6 flex items-center justify-end">
          <div className="flex gap-4">
            <Link href="/nfse" className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600 transition flex items-center gap-2">
              <ArrowLeft size={18} />
              <span>Voltar</span>
            </Link>
            <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition flex items-center gap-2" data-testid="submit-button">
              <Save size={18} />
              <span>{isEditing ? 'Atualizar' : 'Salvar'}</span>
            </button>
          </div>
        </div>
      </form>
      <ClientCalculos servicos={servicos} />
    </div>
  );
}
