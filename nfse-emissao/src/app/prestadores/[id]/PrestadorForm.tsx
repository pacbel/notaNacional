'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Save, CreditCard, CheckCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import UfMunicipioSelector from '@/components/ui/UfMunicipioSelector';
import CepInput from '@/components/ui/CepInput';
import CnpjInput from '@/components/ui/CnpjInput';
import InscricaoMunicipalInput from '@/components/ui/InscricaoMunicipalInput';
import TelefoneInput from '@/components/ui/TelefoneInput';
import RegimeEspecialTributacaoSelect from '@/components/ui/RegimeEspecialTributacaoSelect';
import { CepResponse } from '@/services/cepService';
import { toast, Toaster } from 'react-hot-toast';
import { Prestador } from '@/types/prestador';
import UploadCertificado from '@/components/ui/UploadCertificado';
import UploadLogomarca from '@/components/ui/UploadLogomarca';
import ValorMonetarioInput from '@/components/ui/ValorMonetarioInput';

interface PrestadorFormProps {
  isNew: boolean;
  prestador: Prestador | null;
  defaultValues: {
    razaoSocial: string;
    cnpj: string;
    nomeFantasia: string;
    inscricaoMunicipal: string;
    email: string;
    telefone: string;
    endereco: string;
    numero: string;
    complemento: string;
    bairro: string;
    cep: string;
    uf: string;
    codigoMunicipio: string;
    serie: string;
    ambiente: number;
    optanteSimplesNacional: boolean;
    incentivadorCultural: boolean;
    numeroRpsAtual: number;
    regimeEspecialTributacao?: number;
    exibirConstrucaoCivil?: boolean;
    customer_id_asaas?: string;
    integrado_asaas?: boolean;
    emitirNfse?: boolean;
    emitirNfe?: boolean;
    nfeAmbiente?: number;
    numeroNfeAtual?: number;
    nfeSerie?: string;
  };
}

export default function PrestadorForm({ isNew, prestador, defaultValues }: PrestadorFormProps) {
  const { token, isMaster, isAdmin, setIntegradoAsaas: updateAuthIntegradoAsaas } = useAuth();
  const [uf, setUf] = useState<string>(defaultValues.uf);
  const [codigoMunicipio, setCodigoMunicipio] = useState<string>(defaultValues.codigoMunicipio);
  const [endereco, setEndereco] = useState<string>(defaultValues.endereco);
  const [bairro, setBairro] = useState<string>(defaultValues.bairro);
  const [regimeEspecialTributacao, setRegimeEspecialTributacao] = useState<number>(defaultValues.regimeEspecialTributacao || 0);
  const [opSimpNac, setOpSimpNac] = useState<number>((prestador as any)?.opSimpNac ?? ((defaultValues.optanteSimplesNacional ? 3 : 1)));
  const [incentivadorCultural, setIncentivadorCultural] = useState<boolean>(defaultValues.incentivadorCultural || false);
  const [exibirConstrucaoCivil, setExibirConstrucaoCivil] = useState<boolean>(defaultValues.exibirConstrucaoCivil || false);
  const [customerIdAsaas, setCustomerIdAsaas] = useState<string>(defaultValues.customer_id_asaas || '');
  const [integradoAsaas, setIntegradoAsaas] = useState<boolean>(defaultValues.integrado_asaas || false);
  const [integrando, setIntegrando] = useState<boolean>(false);
  const [emitirNfse, setEmitirNfse] = useState<boolean>(defaultValues.emitirNfse ?? true);
  const [emitirNfe, setEmitirNfe] = useState<boolean>(defaultValues.emitirNfe ?? false);
  // Novos estados migrados de Serviço
  const [codigoTributacao, setCodigoTributacao] = useState<string>((prestador as any)?.codigoTributacao || (defaultValues as any)?.codigoTributacao || '');
  const [itemListaServico, setItemListaServico] = useState<string>((prestador as any)?.itemListaServico || (defaultValues as any)?.itemListaServico || '');
  const [categoria, setCategoria] = useState<string>('');
  const [aliquota, setAliquota] = useState<number>((prestador as any)?.aliquota ?? (defaultValues as any)?.aliquota ?? 0);
  // Parâmetros avançados
  const [codigoTribNacional, setCodigoTribNacional] = useState<string>((prestador as any)?.codigoTribNacional || (defaultValues as any)?.codigoTribNacional || '');
  const [exigibilidadeIss, setExigibilidadeIss] = useState<number>((prestador as any)?.exigibilidadeIss ?? (defaultValues as any)?.exigibilidadeIss ?? 2);
  const [issRetido, setIssRetido] = useState<boolean>((prestador as any)?.issRetido ?? (defaultValues as any)?.issRetido ?? false);
  const [tipoImunidade, setTipoImunidade] = useState<number>((prestador as any)?.tipoImunidade ?? (defaultValues as any)?.tipoImunidade ?? 0);
  const [valorTribFederal, setValorTribFederal] = useState<number>((prestador as any)?.valorTribFederal ?? (defaultValues as any)?.valorTribFederal ?? 0);
  const [valorTribEstadual, setValorTribEstadual] = useState<number>((prestador as any)?.valorTribEstadual ?? (defaultValues as any)?.valorTribEstadual ?? 0);
  const [totalTribMunicipal, setTotalTribMunicipal] = useState<number>((prestador as any)?.totalTribMunicipal ?? (defaultValues as any)?.totalTribMunicipal ?? 0);
  const [ativo, setAtivo] = useState<boolean>((prestador as any)?.ativo ?? (defaultValues as any)?.ativo ?? true);
  const [tpRetIssqn, setTpRetIssqn] = useState<number>((prestador as any)?.tpRetIssqn ?? (defaultValues as any)?.tpRetIssqn ?? 1);

  useEffect(() => {
    console.log('PrestadorForm - props/defaultValues/prestador recebidos:', {
      prestador,
      defaultValues,
    });
    console.log('PrestadorForm - estados iniciais (tributação):', {
      codigoTribNacional,
      codigoTributacao,
      itemListaServico,
      aliquota,
      exigibilidadeIss,
      issRetido,
      tipoImunidade,
      valorTribFederal,
      valorTribEstadual,
      totalTribMunicipal,
    });
  }, []);

  useEffect(() => {
    console.log('PrestadorForm - mudança tributação:', {
      codigoTributacao,
      itemListaServico,
      categoria,
      aliquota,
      exigibilidadeIss,
      issRetido,
      tpRetIssqn,
      tipoImunidade,
      valorTribFederal,
      valorTribEstadual,
      totalTribMunicipal,
    });
  }, [codigoTributacao, itemListaServico, categoria, aliquota, exigibilidadeIss, issRetido, tpRetIssqn, tipoImunidade, valorTribFederal, valorTribEstadual, totalTribMunicipal]);

  // Quando não for Imune, resetar tipoImunidade para 0 (Não se aplica)
  useEffect(() => {
    if (exigibilidadeIss !== 4 && tipoImunidade !== 0) {
      setTipoImunidade(0);
    }
  }, [exigibilidadeIss]);

  function deriveCodigoNacionalFromItem(codigoItem?: string): string {
    const raw = String(codigoItem || '').trim();
    if (!raw) return '';
    // Aceita formatos "II.SS" ou "IISS" e converte para IISS00
    const onlyDigits = raw.replace(/\D+/g, '');
    if (onlyDigits.length === 4) {
      return `${onlyDigits.slice(0, 2)}${onlyDigits.slice(2)}00`;
    }
    if (onlyDigits.length === 2) {
      return `${onlyDigits}0000`;
    }
    if (onlyDigits.length === 6) {
      return onlyDigits; // já no formato nacional
    }
    return '';
  }

  // Quando o prestador for carregado/alterado, sincronizar estados tributários
  useEffect(() => {
    if (!prestador) return;
    console.log('PrestadorForm - sincronizando estados a partir de prestador:', prestador);
    setCodigoTribNacional((prestador as any)?.codigoTribNacional || '');
    setCodigoTributacao((prestador as any)?.codigoTributacao || '');
    setItemListaServico((prestador as any)?.itemListaServico || '');
    setAliquota((prestador as any)?.aliquota ?? 0);
    setExigibilidadeIss((prestador as any)?.exigibilidadeIss ?? 2);
    setIssRetido((prestador as any)?.issRetido ?? false);
    setTpRetIssqn((prestador as any)?.tpRetIssqn ?? 1);
    setTipoImunidade((prestador as any)?.tipoImunidade ?? 0);
    setValorTribFederal((prestador as any)?.valorTribFederal ?? 0);
    setValorTribEstadual((prestador as any)?.valorTribEstadual ?? 0);
    setTotalTribMunicipal((prestador as any)?.totalTribMunicipal ?? 0);
    setAtivo((prestador as any)?.ativo ?? true);
  }, [prestador]);

  // Fallback: se prestador não tiver campos (primeiro render), usar defaultValues
  useEffect(() => {
    if (prestador) return; // já tratamos no efeito acima
    const d: any = defaultValues || {};
    if (
      d?.codigoTributacao ||
      d?.codigoTribNacional ||
      d?.itemListaServico ||
      typeof d?.aliquota !== 'undefined'
    ) {
      console.log('PrestadorForm - aplicando fallback de defaultValues para estados tributários:', d);
      setCodigoTribNacional(d.codigoTribNacional || '');
      setCodigoTributacao(d.codigoTributacao || '');
      setItemListaServico(d.itemListaServico || '');
      setAliquota(d.aliquota ?? 0);
      setExigibilidadeIss(d.exigibilidadeIss ?? 2);
      setIssRetido(d.issRetido ?? false);
      setTpRetIssqn((d as any).tpRetIssqn ?? 1);
      setTipoImunidade(d.tipoImunidade ?? 0);
      setValorTribFederal(d.valorTribFederal ?? 0);
      setValorTribEstadual(d.valorTribEstadual ?? 0);
      setTotalTribMunicipal(d.totalTribMunicipal ?? 0);
      setAtivo(d.ativo ?? true);
    }
  }, []);

  // Função para lidar com os dados do CEP encontrado
  const handleCepFound = async (data: CepResponse) => {
    
    // Preencher os campos de endereço
    setEndereco(data.logradouro);
    setBairro(data.bairro);
    
    // Primeiro resetar o código do município
    setCodigoMunicipio('');
    
    // Depois atualizar a UF
    setUf(data.uf);
    
    // Aguardar um momento para garantir que a UF seja atualizada e os municípios carregados
    setTimeout(() => {
      // Buscar e atualizar o código do município usando o código IBGE
      if (data.ibge) {
        // O código IBGE do município vem completo (ex: 3106200)
        const codigoMunicipio = data.ibge;
        setCodigoMunicipio(codigoMunicipio);
      }
    }, 500);

    // Exibir mensagem de sucesso
    //toast.success('CEP encontrado! Endereço preenchido automaticamente.');
  };

  return (
    <>
      <Toaster position="top-right" />
      <form 
        action={`/api/prestadores/${isNew ? 'create' : 'update'}`} 
        method="POST" 
        className="space-y-6 w-full max-w-full"
      >
        {!isNew && <input type="hidden" name="id" value={prestador?.id} />}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 w-full">
          <div className="md:col-span-2 lg:col-span-3 xl:col-span-4">
            <label htmlFor="razaoSocial" className="block text-sm font-medium text-gray-700 mb-1">Razão Social</label>
            <input 
              id="razaoSocial"
              type="text" 
              name="razaoSocial"
              className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary" 
              defaultValue={defaultValues.razaoSocial}
              required 
            />
          </div>
          
          <div className="md:col-span-2 lg:col-span-3 xl:col-span-4 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label htmlFor="nomeFantasia" className="block text-sm font-medium text-gray-700 mb-1">Nome Fantasia</label>
              <input 
                id="nomeFantasia"
                type="text" 
                name="nomeFantasia"
                className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary" 
                defaultValue={defaultValues.nomeFantasia}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Situação perante o Simples Nacional</label>
              <select
                name="opSimpNac"
                className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
                value={opSimpNac}
                onChange={(e) => setOpSimpNac(parseInt(e.target.value))}
              >
                <option value={1}>1 - Não Optante</option>
                <option value={2}>2 - Optante - Microempreendedor Individual (MEI)</option>
                <option value={3}>3 - Optante - Microempresa ou Empresa de Pequeno Porte (ME/EPP)</option>
              </select>
              {/* Campo legado derivado para compatibilidade com APIs atuais */}
              <input type="hidden" name="optanteSimplesNacional" value={opSimpNac === 1 ? 'false' : 'true'} />
            </div>
            
            <div className="flex items-center">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Incentivador Cultural</label>
                <input 
                  type="checkbox" 
                  name="incentivadorCultural"
                  className="mt-1 h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded" 
                  checked={incentivadorCultural}
                  onChange={(e) => setIncentivadorCultural(e.target.checked)}
                />
              </div>
            </div>
          </div>
          
          <div>
            <label htmlFor="cnpj" className="block text-sm font-medium text-gray-700 mb-1">CNPJ</label>
            <CnpjInput
              defaultValue={defaultValues.cnpj}
              required
              fieldName="cnpj"
            />
          </div>

          <div>
            <label htmlFor="inscricaoMunicipal" className="block text-sm font-medium text-gray-700 mb-1">Inscrição Municipal</label>
            <InscricaoMunicipalInput
              defaultValue={defaultValues.inscricaoMunicipal}
              required
            />
          </div>
          
          <div>
            <label htmlFor="inscricaoEstadual" className="block text-sm font-medium text-gray-700 mb-1">Inscrição Estadual</label>
            <input
              id="inscricaoEstadual"
              type="text"
              name="inscricaoEstadual"
              className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
              defaultValue={(defaultValues as any).inscricaoEstadual || ''}
            />
          </div>
          
          <div>
            <label htmlFor="telefone" className="block text-sm font-medium text-gray-700 mb-1">Telefone</label>
            <TelefoneInput
              defaultValue={defaultValues.telefone}
              required
            />
          </div>
          
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">E-mail</label>
            <input 
              id="email"
              type="email" 
              name="email"
              className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary" 
              defaultValue={defaultValues.email}
              required 
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Regime Especial de Tributação</label>
            <div className="w-full">
              <RegimeEspecialTributacaoSelect
                value={regimeEspecialTributacao}
                onChange={(value) => setRegimeEspecialTributacao(value)}
              />
            </div>
            {/* O campo name já foi adicionado diretamente no componente RegimeEspecialTributacaoSelect */}
          </div>

          <div>
            <label htmlFor="cep" className="block text-sm font-medium text-gray-700 mb-1">CEP</label>
            <CepInput 
              defaultValue={defaultValues.cep} 
              onCepFound={handleCepFound} 
            />
          </div>
          
          <div className="md:col-span-2 lg:col-span-3 xl:col-span-4">
            <label htmlFor="endereco" className="block text-sm font-medium text-gray-700 mb-1">Endereço</label>
            <input 
              id="endereco"
              type="text" 
              name="endereco"
              className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary" 
              value={endereco}
              onChange={(e) => setEndereco(e.target.value)}
              required 
            />
          </div>
          
          <div>
            <label htmlFor="numero" className="block text-sm font-medium text-gray-700 mb-1">Número</label>
            <input 
              id="numero"
              type="text" 
              name="numero"
              className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary" 
              defaultValue={defaultValues.numero}
              required 
            />
          </div>
          
          <div>
            <label htmlFor="complemento" className="block text-sm font-medium text-gray-700 mb-1">Complemento</label>
            <input 
              id="complemento"
              type="text" 
              name="complemento"
              className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary" 
              defaultValue={defaultValues.complemento}
            />
          </div>
          
          <div>
            <label htmlFor="bairro" className="block text-sm font-medium text-gray-700 mb-1">Bairro</label>
            <input 
              id="bairro"
              type="text" 
              name="bairro"
              className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary" 
              value={bairro}
              onChange={(e) => setBairro(e.target.value)}
              required 
            />
          </div>
          
          {/* UF e Município logo após o Bairro */}
          <div className="md:col-span-2 lg:col-span-3 xl:col-span-4 mt-4 mb-4">
            <UfMunicipioSelector 
              defaultUf={uf}
              defaultCodigoMunicipio={codigoMunicipio}
              onUfChange={setUf}
              onMunicipioChange={setCodigoMunicipio}
            />
          </div>
          
          {/* Quadro de Emissão de NFS-e */}
          <div className="md:col-span-2 lg:col-span-3 xl:col-span-4 border rounded-lg p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Emissão de NFS-e</h3>
              <label className="inline-flex items-center gap-2">
                <input
                  type="checkbox"
                  name="emitirNfse"
                  className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                  checked={emitirNfse}
                  onChange={(e) => setEmitirNfse(e.target.checked)}
                />
                <span className="text-sm text-gray-700">Ativar emissão de NFS-e</span>
              </label>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Ambiente (NFSe)</label>
                <select 
                  name="ambiente"
                  className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
                  defaultValue={defaultValues.ambiente}
                  required
                >
                  <option value={2}>Homologação</option>
                  <option value={1}>Produção</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Número RPS Atual</label>
                <input 
                  type="number" 
                  name="numeroRpsAtual"
                  className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary" 
                  defaultValue={defaultValues.numeroRpsAtual || 100}
                  min={1}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Série (NFSe)</label>
                <input 
                  type="text" 
                  name="serie"
                  className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary" 
                  defaultValue={defaultValues.serie}
                  required 
                />
              </div>
              <div className="md:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Código de Tributação Municipal/CTISS</label>
                  <input
                    type="text"
                    name="codigoTributacao"
                    className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
                    value={codigoTributacao}
                    onChange={(e) => setCodigoTributacao(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Item da Lista de Serviços (ex.: 1.02 ou 1405)</label>
                  <input
                    type="text"
                    name="itemListaServico"
                    className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
                    value={itemListaServico}
                    onChange={(e) => {
                      const v = e.target.value;
                      setItemListaServico(v);
                      // Não autoderivar mais o nacional; usuário poderá informar diretamente no campo ao lado
                    }}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Código de Tributação Nacional (6 dígitos)</label>
                  <input
                    type="text"
                    name="codigoTribNacional"
                    className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
                    value={codigoTribNacional}
                    inputMode="numeric"
                    pattern="[0-9]{6}"
                    maxLength={6}
                    onChange={(e) => {
                      const v = e.target.value.replace(/\D+/g, '').slice(0, 6);
                      setCodigoTribNacional(v);
                    }}
                    title="Informe exatamente 6 dígitos (apenas números)."
                    placeholder="Ex.: 170100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Alíquota (%)</label>
                  <ValorMonetarioInput
                    name="aliquota"
                    value={aliquota}
                    onChange={setAliquota}
                    isPercentual={true}
                    data-testid="aliquota-prestador-input"
                  />
                </div>
              </div>
              <div className="md:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tributação ISSQN</label>
                  <select
                    name="exigibilidadeIss"
                    className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
                    value={exigibilidadeIss}
                    onChange={(e) => setExigibilidadeIss(parseInt(e.target.value))}
                  >
                    <option value={1}>1 - Exigível</option>
                    <option value={2}>2 - Tributado no Município</option>
                    <option value={3}>3 - Isento</option>
                    <option value={4}>4 - Imune</option>
                    <option value={5}>5 - Exigibilidade Suspensa por Decisão Judicial</option>
                    <option value={6}>6 - Exigibilidade Suspensa por Procedimento Administrativo</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Retenção ISSQN</label>
                  <select
                    name="tpRetIssqn"
                    className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
                    value={tpRetIssqn}
                    onChange={(e) => setTpRetIssqn(parseInt(e.target.value))}
                  >
                    <option value={1}>1 - ISSQN não retido (prestador recolhe)</option>
                    <option value={2}>2 - ISSQN retido pelo tomador</option>
                    <option value={3}>3 - ISSQN retido pelo intermediário</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tipo Imunidade</label>
                  <select
                    name="tipoImunidade"
                    className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
                    value={tipoImunidade}
                    onChange={(e) => setTipoImunidade(parseInt(e.target.value))}
                  >
                    <option value={0}>0 - Não se aplica</option>
                    <option value={1}>1</option>
                    <option value={2}>2</option>
                    <option value={3}>3</option>
                  </select>
                </div>
              </div>
              <div className="md:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Valor Tributação Federal</label>
                  <ValorMonetarioInput
                    name="valorTribFederal"
                    value={valorTribFederal}
                    onChange={setValorTribFederal}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Valor Tributação Estadual</label>
                  <ValorMonetarioInput
                    name="valorTribEstadual"
                    value={valorTribEstadual}
                    onChange={setValorTribEstadual}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Total Tributação Municipal</label>
                  <ValorMonetarioInput
                    name="totalTribMunicipal"
                    value={totalTribMunicipal}
                    onChange={setTotalTribMunicipal}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Ativo</label>
                <select
                  name="ativo"
                  className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
                  value={ativo ? 'true' : 'false'}
                  onChange={(e) => setAtivo(e.target.value === 'true')}
                >
                  <option value="true">Sim</option>
                  <option value="false">Não</option>
                </select>
              </div>
            </div>
          </div>

          {/* Quadro de Emissão de NF-e */}
          <div className="md:col-span-2 lg:col-span-3 xl:col-span-4 border rounded-lg p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Emissão de NF-e</h3>
              <label className="inline-flex items-center gap-2">
                <input
                  type="checkbox"
                  name="emitirNfe"
                  className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                  checked={emitirNfe}
                  onChange={(e) => setEmitirNfe(e.target.checked)}
                />
                <span className="text-sm text-gray-700">Ativar emissão de NF-e</span>
              </label>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Ambiente (NFe)</label>
                <select 
                  name="nfeAmbiente"
                  className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
                  defaultValue={defaultValues.nfeAmbiente ?? 2}
                >
                  <option value={2}>Homologação</option>
                  <option value={1}>Produção</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Número NF-e Atual</label>
                <input 
                  type="number" 
                  name="numeroNfeAtual"
                  className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary" 
                  defaultValue={defaultValues.numeroNfeAtual ?? 1}
                  min={1}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Série (NFe)</label>
                <input 
                  type="text" 
                  name="nfeSerie"
                  className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary" 
                  defaultValue={defaultValues.nfeSerie ?? '1'}
                />
              </div>
            </div>
          </div>
          
          {/* Opções adicionais */}
          <div className="md:col-span-2 lg:col-span-3 xl:col-span-4 grid grid-cols-1 md:grid-cols-3 gap-6 mt-4 mb-2">
            <div className="flex items-center">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Empresa de Construção Civil</label>
                <input 
                  type="checkbox" 
                  name="exibirConstrucaoCivil"
                  className="mt-1 h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded" 
                  checked={exibirConstrucaoCivil}
                  onChange={(e) => {
                    const newValue = e.target.checked;
                    setExibirConstrucaoCivil(newValue);
                  }}
                />
              </div>
            </div>
          </div>

        </div>

        {/* Upload do Certificado Digital e Logomarca */}
        <div className="w-full md:col-span-2 lg:col-span-3 xl:col-span-4 flex flex-wrap gap-6">
          <div className="flex-grow">
            <UploadCertificado prestadorId={prestador?.id?.toString()} />
          </div>
          <div className="flex-shrink-0">
            <UploadLogomarca prestadorId={prestador?.id?.toString()} cnpj={defaultValues.cnpj} />
          </div>
        </div>

        {/* Seção de Integração com Meio de Pagamento - Só mostrada para prestadores não integrados */}
        {!isNew && !useAuth().integradoAsaas     && (
          <div className="w-full md:col-span-2 lg:col-span-3 xl:col-span-4 border-t border-gray-200 pt-6 mt-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
              <CreditCard className="mr-2" />
              Integração com Meio de Pagamento
            </h3>
            
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <div>
                <p className="text-sm text-gray-700 mb-3">
                  Este prestador ainda não está integrado com o ASAAS. A integração permite gerenciar cobranças e mensalidades.
                </p>
                <input type="hidden" name="customer_id_asaas" value={customerIdAsaas} />
                <input type="hidden" name="integrado_asaas" value={integradoAsaas ? 'true' : 'false'} />
                
                <button 
                    type="button"
                    onClick={async () => {
                      if (!prestador?.id) return;
                      if (!confirm('Tem certeza que deseja integrar este prestador com o ASAAS?')) return;
                      
                      try {
                        setIntegrando(true);
                        const response = await fetch('/api/prestadores/integrar-asaas', {
                          method: 'POST',
                          headers: {
                            'Content-Type': 'application/json'
                          },
                          credentials: 'include',
                          body: JSON.stringify({ prestadorId: prestador.id }),
                        });

                        if (!response.ok) {
                          const errorData = await response.json();
                          throw new Error(errorData.error || errorData.message || 'Erro ao integrar prestador com ASAAS');
                        }

                        const data = await response.json();
                        toast.success('Prestador integrado com o ASAAS com sucesso');
                        
                        // Atualizar estado local
                        setIntegradoAsaas(true);
                        setCustomerIdAsaas(data.customerId);
                        
                        // Atualizar o contexto global de autenticação
                        updateAuthIntegradoAsaas(true);
                        
                        // Recarregar a página após um curto delay
                        setTimeout(() => {
                          window.location.reload();
                        }, 2000);

                      } catch (error: any) {
                        console.error('Erro ao integrar prestador com ASAAS:', error);
                        toast.error(error.message || 'Erro ao integrar prestador com ASAAS');
                      } finally {
                        setIntegrando(false);
                      }
                    }}
                    disabled={integrando}
                    className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition flex items-center gap-2 mt-2"
                  >
                    <CreditCard size={18} />
                    <span>{integrando ? 'Integrando...' : 'Integrar com ASAAS'}</span>
                  </button>
                </div>
            </div>
          </div>
        )}
        
        {/* Exibir informação de integração para prestadores já integrados */}
        {!isNew && integradoAsaas && (
          <div className="w-full md:col-span-2 lg:col-span-3 xl:col-span-4 border-t border-gray-200 pt-6 mt-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
              <CheckCircle className="mr-2 text-green-600" />
              Prestador Integrado
            </h3>
            
            <div className="bg-green-50 p-4 rounded-lg border border-green-200">
              <div>
                <p className="text-sm text-gray-700 mb-3">
                  Este prestador já está integrado com o ASAAS. ID do cliente: {customerIdAsaas}
                </p>
                <input type="hidden" name="customer_id_asaas" value={customerIdAsaas} />
                <input type="hidden" name="integrado_asaas" value="true" />
              </div>
            </div>
          </div>
        )}

        <div className="mt-6 flex items-center justify-end">
          <div className="flex gap-4">
            <Link 
              href="/prestadores" 
              className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600 transition flex items-center gap-2"
            >
              <ArrowLeft size={18} />
              <span>Voltar</span>
            </Link>
            <button 
              type="submit" 
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition flex items-center gap-2"
              id="salvarPrestador"
            >
              <Save size={18} />
              <span>{isNew ? 'Criar' : 'Salvar'}</span>
            </button>
          </div>
        </div>
      </form>
    </>
  );
}
