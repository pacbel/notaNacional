'use client';

import { useState, useEffect } from 'react';
import { NotaFiscal } from './NFSeForm';

interface ConstrucaoCivilSectionProps {
  notaFiscal: NotaFiscal | null;
}

export function ConstrucaoCivilSection({ notaFiscal }: ConstrucaoCivilSectionProps) {
  const [numeroMatricula, setNumeroMatricula] = useState<string>(
    notaFiscal?.construcaoCivilNumeroMatricula || ''
  );
  const [numeroArt, setNumeroArt] = useState<string>(
    notaFiscal?.construcaoCivilNumeroArt || ''
  );

  useEffect(() => {
    if (notaFiscal) {
      setNumeroMatricula(notaFiscal.construcaoCivilNumeroMatricula || '');
      setNumeroArt(notaFiscal.construcaoCivilNumeroArt || '');
    }
  }, [notaFiscal]);

  return (
    <div className="mt-8">
      <div className="bg-orange-50 p-6 rounded-md border border-orange-200">
        <h3 className="text-lg font-semibold mb-4 text-orange-800">Construção Civil</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Número da Matrícula CEI da obra ou da empresa</label>
            <input 
              type="text" 
              name="construcaoCivilNumeroMatricula"
              className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
              value={numeroMatricula}
              onChange={(e) => setNumeroMatricula(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Número da ART</label>
            <input 
              type="text" 
              name="construcaoCivilNumeroArt"
              className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
              value={numeroArt}
              onChange={(e) => setNumeroArt(e.target.value)}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
