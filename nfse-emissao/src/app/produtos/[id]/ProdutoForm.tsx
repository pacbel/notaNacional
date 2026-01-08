'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Save } from 'lucide-react';
import { Toaster } from 'react-hot-toast';
import ValorMonetarioInput from '@/components/ui/ValorMonetarioInput';
import NcmInput from '@/components/ui/NcmInput';
import CfopInput from '@/components/ui/CfopInput';
import CestInput from '@/components/ui/CestInput';
import CodigoBarrasInput from '@/components/ui/CodigoBarrasInput';
import type { Produto } from './page';

export interface ProdutoFormProps {
  isNew: boolean;
  produto: Produto | null;
  defaultValues: {
    codigo: string;
    codigoBarras: string;
    descricao: string;
    ncm: string;
    cfop: string;
    unComercial: string;
    unTributaria: string;
    qtdComercial: number;
    qtdTributaria: number;
    precoVenda: number;
    informacoesAdicionais: string;
    crt: string;
  };
}

export default function ProdutoForm({ isNew, produto, defaultValues }: ProdutoFormProps) {
  const [activeTab, setActiveTab] = useState<'ICMS' | 'IPI' | 'PIS' | 'COFINS' | 'OUTROS'>('ICMS');

  return (
    <>
      <Toaster position="top-right" />
      <form action={`/api/produtos/${isNew ? 'create' : 'update'}`} method="POST" className="space-y-6 w-full max-w-full">
        {!isNew && <input type="hidden" name="id" value={produto?.id} />}

        {/* Dados gerais */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 w-full">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Código</label>
            <input
              type="text"
              name="codigo"
              className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
              defaultValue={defaultValues.codigo}
              required
            />
          </div>
          <div className="md:col-span-2 lg:col-span-2 xl:col-span-3">
            <label className="block text-sm font-medium text-gray-700 mb-1">Código de Barras</label>
            <CodigoBarrasInput defaultValue={defaultValues.codigoBarras} />
          </div>

          <div className="md:col-span-2 lg:col-span-3 xl:col-span-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
            <input
              type="text"
              name="descricao"
              className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
              defaultValue={defaultValues.descricao}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">NCM</label>
            <NcmInput defaultValue={defaultValues.ncm} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">CFOP</label>
            <CfopInput defaultValue={defaultValues.cfop} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">UN Comercial</label>
            <input type="text" name="unComercial" className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary" defaultValue={defaultValues.unComercial} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">UN Tributária</label>
            <input type="text" name="unTributaria" className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary" defaultValue={defaultValues.unTributaria} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Qtde Comercial</label>
            <input type="number" step="0.0001" name="qtdComercial" className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary" defaultValue={defaultValues.qtdComercial} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Qtde Tributária</label>
            <input type="number" step="0.0001" name="qtdTributaria" className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary" defaultValue={defaultValues.qtdTributaria} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">R$ Venda</label>
            <ValorMonetarioInput name="precoVenda" value={defaultValues.precoVenda} />
          </div>

          <div className="md:col-span-2 lg:col-span-3 xl:col-span-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Informações Adicionais</label>
            <textarea name="informacoesAdicionais" rows={3} className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary" defaultValue={defaultValues.informacoesAdicionais} />
          </div>

          <div className="md:col-span-2 lg:col-span-3 xl:col-span-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Código de Regime Tributário (CRT)</label>
            <select name="crt" className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary" defaultValue={defaultValues.crt}>
              <option value="0">Nenhum</option>
              <option value="1">Regime Normal</option>
              <option value="SN">Simples Nacional</option>
            </select>
          </div>
        </div>

        {/* Abas de impostos */}
        <div>
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex flex-wrap gap-2" aria-label="Tabs">
              {(['ICMS','IPI','PIS','COFINS','OUTROS'] as const).map(tab => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setActiveTab(tab)}
                  className={`whitespace-nowrap border-b-2 px-3 py-2 text-sm font-medium ${activeTab === tab ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
                >
                  {tab}
                </button>
              ))}
            </nav>
          </div>

          <div className="mt-4">
            {activeTab === 'ICMS' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">ICMS</label>
                  <select name="icmsCodigo" className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary">
                    <option value="400">400 - Não tributada</option>
                    <option value="000">000 - Tributada integralmente</option>
                    <option value="060">060 - ICMS cobrado anteriormente por substituição tributária</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Origem</label>
                  <select name="icmsOrigem" className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary">
                    <option value="0">Nacional</option>
                    <option value="1">Estrangeira - Importação direta</option>
                    <option value="2">Estrangeira - Adquirida no mercado interno</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Alíquota (%)</label>
                  <ValorMonetarioInput name="icmsAliquota" value={0} isPercentual />
                </div>
              </div>
            )}

            {activeTab === 'IPI' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Situação Tributária IPI</label>
                  <select name="ipiCst" className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary">
                    <option value="53">53 - Saída não tributada</option>
                    <option value="50">50 - Saída tributada</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Classe de Enquadramento</label>
                  <input type="text" name="ipiClasseEnquadramento" className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Código de Enquadramento</label>
                  <input type="text" name="ipiCodigoEnquadramento" defaultValue={produto ? '999' : ''} className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">CNPJ Produtor</label>
                  <input type="text" name="ipiCnpjProdutor" className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Quantidade Selo de Controle</label>
                  <input type="number" step="1" name="ipiQtdeSelo" className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Alíquota (%)</label>
                  <ValorMonetarioInput name="ipiAliquota" value={0} isPercentual />
                </div>
              </div>
            )}

            {activeTab === 'PIS' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Situação Tributária PIS</label>
                  <select name="pisCst" className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary">
                    <option value="09">PIS 09 - Operação com Suspensão da Contribuição</option>
                    <option value="01">01 - Operação Tributável</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">PIS - Alíquota (%)</label>
                  <ValorMonetarioInput name="pisAliquota" value={0} isPercentual />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">PIS ST - Alíquota (%)</label>
                  <ValorMonetarioInput name="pisStAliquota" value={0} isPercentual />
                </div>
              </div>
            )}

            {activeTab === 'COFINS' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Situação Tributária COFINS</label>
                  <select name="cofinsCst" className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary">
                    <option value="09">COFINS 09 - Operação com Suspensão da Contribuição</option>
                    <option value="01">01 - Operação Tributável</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">COFINS - Alíquota (%)</label>
                  <ValorMonetarioInput name="cofinsAliquota" value={0} isPercentual />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">COFINS ST - Alíquota (%)</label>
                  <ValorMonetarioInput name="cofinsStAliquota" value={0} isPercentual />
                </div>
              </div>
            )}

            {activeTab === 'OUTROS' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">CEST</label>
                  <CestInput />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Escala</label>
                  <select name="escala" className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary">
                    <option value="">Selecione...</option>
                    <option value="industrial">Industrial</option>
                    <option value="artesanal">Artesanal</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">CNPJ Fabricante</label>
                  <input type="text" name="cnpjFabricante" className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary" />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Código de Benefício Fiscal</label>
                  <input type="text" name="codigoBeneficioFiscal" className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary" />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Ações */}
        <div className="mt-6 flex items-center justify-end">
          <div className="flex gap-4">
            <Link href="/produtos" className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600 transition flex items-center gap-2">
              <ArrowLeft size={18} />
              <span>Voltar</span>
            </Link>
            <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition flex items-center gap-2" id="salvarProduto">
              <Save size={18} />
              <span>Salvar</span>
            </button>
          </div>
        </div>
      </form>
    </>
  );
}
