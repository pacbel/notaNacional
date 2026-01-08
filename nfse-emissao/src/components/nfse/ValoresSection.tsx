'use client';

import { useState, useEffect } from 'react';
import { NotaFiscal } from './NFSeForm';

interface ValoresSectionProps {
  notaFiscal: Partial<NotaFiscal> | null;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
}

export function ValoresSection({ notaFiscal, onChange }: ValoresSectionProps) {
  const formatValue = (value: number | undefined | null) => {
    return value ? Number(value).toFixed(2).replace('.', ',') : '0,00';
  };

  return (
    <div className="mt-8">
      <div className="bg-blue-50 p-6 rounded-md border border-blue-200">
        <h2 className="text-lg font-semibold mb-4 text-blue-800">Valores e Alíquotas</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Valor dos Serviços</label>
            <input 
              type="text" 
              name="valorServicos"
              data-testid="valor-servicos-input"
              className="mt-1 block w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
              value={formatValue(notaFiscal?.valorServicos)}
              onChange={onChange}
              readOnly
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Base de Cálculo</label>
            <input 
              type="text" 
              name="baseCalculo"
              data-testid="base-calculo-input"
              className="mt-1 block w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
              value={formatValue(notaFiscal?.baseCalculo)}
              onChange={onChange}
              readOnly
            />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Valor Líquido</label>
            <input 
              type="text" 
              name="valorLiquidoNfse"
              data-testid="valor-liquido-input"
              className="mt-1 block w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
              value={formatValue(notaFiscal?.valorLiquidoNfse)}
              readOnly
            />
          </div>
        </div>
      </div>
    </div>
  );
}
