'use client';

import { useEffect } from 'react';
import ValorMonetarioInput from '@/components/ui/ValorMonetarioInput';

interface RetencoesFederaisProps {
  regimeTributario?: number; // 1: Simples Nacional, 2: Lucro Presumido, 3: Lucro Real
  valorPis?: number;
  valorCofins?: number;
  valorInss?: number;
  valorIr?: number;
  valorCsll?: number;
  outrasRetencoes?: number;
  onChangeValorPis?: (valor: number) => void;
  onChangeValorCofins?: (valor: number) => void;
  onChangeValorInss?: (valor: number) => void;
  onChangeValorIr?: (valor: number) => void;
  onChangeValorCsll?: (valor: number) => void;
  onChangeOutrasRetencoes?: (valor: number) => void;
}

export default function RetencoesFederais({
  regimeTributario = 0,
  valorPis = 0,
  valorCofins = 0,
  valorInss = 0,
  valorIr = 0,
  valorCsll = 0,
  outrasRetencoes = 0,
  onChangeValorPis,
  onChangeValorCofins,
  onChangeValorInss,
  onChangeValorIr,
  onChangeValorCsll,
  onChangeOutrasRetencoes
}: RetencoesFederaisProps) {
  // Verifica se o prestador é do Simples Nacional (regimes 1, 5 ou 6)
  const isSimples = regimeTributario === 1 || regimeTributario === 5 || regimeTributario === 6;

  // Se for Simples Nacional, zera os valores das retenções federais
  useEffect(() => {
    if (isSimples) {
      if (onChangeValorPis) onChangeValorPis(0);
      if (onChangeValorCofins) onChangeValorCofins(0);
      if (onChangeValorIr) onChangeValorIr(0);
      if (onChangeValorCsll) onChangeValorCsll(0);
    }
  }, [isSimples, onChangeValorPis, onChangeValorCofins, onChangeValorIr, onChangeValorCsll]);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 mt-3 sm:mt-4">
      <div>
        <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Valor do INSS</label>
        <ValorMonetarioInput
          name="valorInss"
          value={valorInss}
          onChange={onChangeValorInss}
          data-testid="valorInss-input"
        />
      </div>
      
      {!isSimples && (
        <>
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Valor do IR</label>
            <ValorMonetarioInput
              name="valorIr"
              value={valorIr}
              onChange={onChangeValorIr}
              data-testid="valorIr-input"
            />
          </div>
          
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Valor do PIS</label>
            <ValorMonetarioInput
              name="valorPis"
              value={valorPis}
              onChange={onChangeValorPis}
              data-testid="valorPis-input"
            />
          </div>
          
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Valor da Cofins</label>
            <ValorMonetarioInput
              name="valorCofins"
              value={valorCofins}
              onChange={onChangeValorCofins}
              data-testid="valorCofins-input"
            />
          </div>
          
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Valor da CSLL</label>
            <ValorMonetarioInput
              name="valorCsll"
              value={valorCsll}
              onChange={onChangeValorCsll}
              data-testid="valorCsll-input"
            />
          </div>
        </>
      )}
      
      {isSimples && (
        <>
          <input type="hidden" name="valorIr" value="0" />
          <input type="hidden" name="valorPis" value="0" />
          <input type="hidden" name="valorCofins" value="0" />
          <input type="hidden" name="valorCsll" value="0" />
        </>
      )}
      
      <div>
        <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Outras retenções</label>
        <ValorMonetarioInput
          name="outrasRetencoes"
          value={outrasRetencoes}
          onChange={onChangeOutrasRetencoes}
          data-testid="outrasRetencoes-input"
        />
      </div>
      
      {isSimples && (
        <div className="col-span-full mt-2">
          <p className="text-xs sm:text-sm text-amber-600">
            <strong>Nota:</strong> Campos de retenções federais (IR, PIS, COFINS, CSLL) foram ocultados pois o prestador está no regime Simples Nacional.
          </p>
        </div>
      )}
    </div>
  );
}
