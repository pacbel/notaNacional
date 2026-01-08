'use client';

import { useState, useEffect } from 'react';
import { NotaFiscal } from './NFSeForm';

interface IntermediarioSectionProps {
  notaFiscal: NotaFiscal | null;
}

export function IntermediarioSection({ notaFiscal }: IntermediarioSectionProps) {
  const [tipoIntermediario, setTipoIntermediario] = useState<string>(
    notaFiscal?.tipoIntermediario || 'naoExiste'
  );
  const [razaoSocial, setRazaoSocial] = useState<string>(
    notaFiscal?.intermediarioRazaoSocial || ''
  );
  const [cpfCnpj, setCpfCnpj] = useState<string>(
    notaFiscal?.intermediarioCpfCnpj || ''
  );
  const [inscricaoMunicipal, setInscricaoMunicipal] = useState<string>(
    notaFiscal?.intermediarioInscricaoMunicipal || ''
  );

  useEffect(() => {
    if (notaFiscal) {
      setTipoIntermediario(notaFiscal.tipoIntermediario || 'naoExiste');
      setRazaoSocial(notaFiscal.intermediarioRazaoSocial || '');
      setCpfCnpj(notaFiscal.intermediarioCpfCnpj || '');
      setInscricaoMunicipal(notaFiscal.intermediarioInscricaoMunicipal || '');
    }
  }, [notaFiscal]);

  return (
    <div className="mt-8">
      <div className="bg-purple-50 p-6 rounded-md border border-purple-200">
        <h2 className="text-lg font-semibold mb-4 text-purple-800">Intermediário do Serviço</h2>
        
        <div className="mb-4">
          <div className="flex items-center space-x-6">
            <div className="flex items-center">
              <input 
                type="radio" 
                id="naoExiste" 
                name="tipoIntermediario" 
                value="naoExiste"
                className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300"
                checked={tipoIntermediario === 'naoExiste'}
                onChange={() => setTipoIntermediario('naoExiste')}
              />
              <label htmlFor="naoExiste" className="ml-2 block text-sm text-gray-700">
                Não existe intermediário
              </label>
            </div>
            <div className="flex items-center">
              <input 
                type="radio" 
                id="existe" 
                name="tipoIntermediario" 
                value="existe"
                className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300"
                checked={tipoIntermediario === 'existe'}
                onChange={() => setTipoIntermediario('existe')}
              />
              <label htmlFor="existe" className="ml-2 block text-sm text-gray-700">
                Existe intermediário
              </label>
            </div>
          </div>
        </div>
        
        <div id="intermediario-campos" className={`grid grid-cols-1 md:grid-cols-3 gap-4 ${tipoIntermediario === 'naoExiste' ? 'hidden' : ''}`}>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Razão Social</label>
            <input 
              type="text" 
              name="intermediarioRazaoSocial"
              className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
              value={razaoSocial}
              onChange={(e) => setRazaoSocial(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">CPF/CNPJ</label>
            <input 
              type="text" 
              name="intermediarioCpfCnpj"
              className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
              value={cpfCnpj}
              onChange={(e) => setCpfCnpj(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Inscrição Municipal</label>
            <input 
              type="text" 
              name="intermediarioInscricaoMunicipal"
              className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
              value={inscricaoMunicipal}
              onChange={(e) => setInscricaoMunicipal(e.target.value)}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
