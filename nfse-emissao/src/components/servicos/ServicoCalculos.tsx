'use client';

import { useEffect, useState } from 'react';
import { formatarNumero } from '@/utils/formatters';

interface ServicoCalculosProps {
  valorUnitario: number;
  aliquota: number;
  valorDeducoes: number;
  descontoIncondicionado: number;
  descontoCondicionado: number;
  valorPis: number;
  valorCofins: number;
  valorInss: number;
  valorIr: number;
  valorCsll: number;
  outrasRetencoes: number;
  issRetido: boolean;
  onChange?: (valores: {
    baseCalculo: number;
    valorIss: number;
    valorLiquido: number;
  }) => void;
}

export default function ServicoCalculos({
  valorUnitario,
  aliquota,
  valorDeducoes,
  descontoIncondicionado,
  descontoCondicionado,
  valorPis,
  valorCofins,
  valorInss,
  valorIr,
  valorCsll,
  outrasRetencoes,
  issRetido,
  onChange
}: ServicoCalculosProps) {
  const [baseCalculo, setBaseCalculo] = useState(0);
  const [valorIss, setValorIss] = useState(0);
  const [valorLiquido, setValorLiquido] = useState(0);

  // Calcula os valores quando qualquer dependência muda
  useEffect(() => {
    // Cálculo da base de cálculo do ISS
    const baseCalculoISS = Math.max(0, valorUnitario - valorDeducoes - descontoIncondicionado);
    setBaseCalculo(baseCalculoISS);
    
    // Cálculo do valor do ISS (se não for retido)
    const valorISSCalculado = issRetido ? 0 : baseCalculoISS * (aliquota / 100);
    setValorIss(valorISSCalculado);
    
    // Cálculo do valor líquido
    let valorLiquidoCalculado = valorUnitario;
    valorLiquidoCalculado -= valorDeducoes;
    valorLiquidoCalculado -= descontoIncondicionado;
    valorLiquidoCalculado -= descontoCondicionado;
    valorLiquidoCalculado -= valorPis;
    valorLiquidoCalculado -= valorCofins;
    valorLiquidoCalculado -= valorInss;
    valorLiquidoCalculado -= valorIr;
    valorLiquidoCalculado -= valorCsll;
    valorLiquidoCalculado -= outrasRetencoes;
    
    // Subtrair ISS se for retido
    if (issRetido) {
      valorLiquidoCalculado -= valorISSCalculado;
    }
    
    setValorLiquido(Math.max(0, valorLiquidoCalculado));
    
    // Notificar o componente pai sobre os novos valores
    if (onChange) {
      onChange({
        baseCalculo: baseCalculoISS,
        valorIss: valorISSCalculado,
        valorLiquido: Math.max(0, valorLiquidoCalculado)
      });
    }
  }, [
    valorUnitario,
    aliquota,
    valorDeducoes,
    descontoIncondicionado,
    descontoCondicionado,
    valorPis,
    valorCofins,
    valorInss,
    valorIr,
    valorCsll,
    outrasRetencoes,
    issRetido,
    onChange
  ]);

  // Total de retenções federais
  const totalRetencoesFederais = valorPis + valorCofins + valorInss + valorIr + valorCsll + outrasRetencoes;
  
  // Total de deduções e descontos
  const totalDeducoesDescontos = valorDeducoes + descontoIncondicionado + descontoCondicionado;
  
  return (
    <div className="mt-3 sm:mt-4 p-3 sm:p-4 bg-gray-50 rounded-md border border-gray-200">
      <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-2 sm:mb-3">Resumo dos Cálculos Tributários</h3>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 mb-3 sm:mb-4">
        <div>
          <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Base de Cálculo do ISS</label>
          <div className="mt-1 block w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded-md">
            {formatarNumero(baseCalculo)}
          </div>
          <p className="text-[10px] sm:text-xs text-gray-500 mt-1">Valor do serviço - deduções - desconto incondicionado</p>
          <input type="hidden" name="baseCalculo" value={baseCalculo} />
        </div>
        
        <div>
          <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Valor do ISS {issRetido ? '(Retido)' : ''}</label>
          <div className="mt-1 block w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded-md">
            {formatarNumero(valorIss)}
          </div>
          <p className="text-[10px] sm:text-xs text-gray-500 mt-1">
            {issRetido ? 'ISS será retido pelo tomador' : `Base de cálculo x Alíquota (${(aliquota).toFixed(2)}%)`}
          </p>
          <input type="hidden" name="valorIss" value={valorIss} />
        </div>
        
        <div>
          <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Valor Líquido</label>
          <div className="mt-1 block w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded-md font-medium">
            {formatarNumero(valorLiquido)}
          </div>
          <p className="text-[10px] sm:text-xs text-gray-500 mt-1">Valor final após todas as deduções e retenções</p>
          <input type="hidden" name="valorLiquido" value={valorLiquido} />
        </div>
      </div>
      
      <div className="border-t border-gray-200 pt-2 sm:pt-3 mt-2">
        <h4 className="text-xs sm:text-sm font-medium text-gray-700 mb-2">Detalhamento dos valores</h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          <div>
            <table className="min-w-full divide-y divide-gray-200 text-xs sm:text-sm">
              <tbody className="divide-y divide-gray-200">
                <tr>
                  <td className="py-1 text-gray-700">Valor do Serviço</td>
                  <td className="py-1 text-right text-gray-900">{formatarNumero(valorUnitario)}</td>
                </tr>
                <tr>
                  <td className="py-1 text-gray-700">(-) Deduções</td>
                  <td className="py-1 text-right text-gray-900">{formatarNumero(valorDeducoes)}</td>
                </tr>
                <tr>
                  <td className="py-1 text-gray-700">(-) Desconto Incondicionado</td>
                  <td className="py-1 text-right text-gray-900">{formatarNumero(descontoIncondicionado)}</td>
                </tr>
                <tr>
                  <td className="py-1 text-gray-700">(-) Desconto Condicionado</td>
                  <td className="py-1 text-right text-gray-900">{formatarNumero(descontoCondicionado)}</td>
                </tr>
                <tr>
                  <td className="py-1 font-medium text-gray-700">Total Deduções e Descontos</td>
                  <td className="py-1 text-right font-medium text-gray-900">{formatarNumero(totalDeducoesDescontos)}</td>
                </tr>
              </tbody>
            </table>
          </div>
          
          <div>
            <table className="min-w-full divide-y divide-gray-200 text-xs sm:text-sm">
              <tbody className="divide-y divide-gray-200">
                <tr>
                  <td className="py-1 text-gray-700">(-) PIS</td>
                  <td className="py-1 text-right text-gray-900">{formatarNumero(valorPis)}</td>
                </tr>
                <tr>
                  <td className="py-1 text-gray-700">(-) COFINS</td>
                  <td className="py-1 text-right text-gray-900">{formatarNumero(valorCofins)}</td>
                </tr>
                <tr>
                  <td className="py-1 text-gray-700">(-) INSS</td>
                  <td className="py-1 text-right text-gray-900">{formatarNumero(valorInss)}</td>
                </tr>
                <tr>
                  <td className="py-1 text-gray-700">(-) IR</td>
                  <td className="py-1 text-right text-gray-900">{formatarNumero(valorIr)}</td>
                </tr>
                <tr>
                  <td className="py-1 text-gray-700">(-) CSLL</td>
                  <td className="py-1 text-right text-gray-900">{formatarNumero(valorCsll)}</td>
                </tr>
                <tr>
                  <td className="py-1 text-gray-700">(-) Outras Retenções</td>
                  <td className="py-1 text-right text-gray-900">{formatarNumero(outrasRetencoes)}</td>
                </tr>
                <tr>
                  <td className="py-1 font-medium text-gray-700">Total Retenções Federais</td>
                  <td className="py-1 text-right font-medium text-gray-900">{formatarNumero(totalRetencoesFederais)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
