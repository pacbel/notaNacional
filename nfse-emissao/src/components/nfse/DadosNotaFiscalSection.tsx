'use client';

import { useState, useEffect } from 'react';
import { NotaFiscal, Prestador, Tomador } from './NFSeForm';

interface DadosNotaFiscalSectionProps {
  prestadores: Prestador[];
  tomadores: Tomador[];
  notaFiscal: Partial<NotaFiscal> | null;
  onPrestadorChange: (prestador: Prestador | null) => void;
  onTomadorChange?: (tomador: Tomador | null) => void; // Adicionada prop para o tomador
  onNotaFiscalChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void;
}

export function DadosNotaFiscalSection({ 
  prestadores, 
  tomadores, 
  notaFiscal, 
  onPrestadorChange, 
  onTomadorChange, // Recebe a nova prop
  onNotaFiscalChange
}: DadosNotaFiscalSectionProps) {
  // Função para formatar a data atual como YYYY-MM
  const formatarDataAtual = () => {
    const hoje = new Date();
    const ano = hoje.getFullYear();
    const mes = String(hoje.getMonth() + 1).padStart(2, '0');
    return `${ano}-${mes}`;
  };
  
  // Função para formatar a data de competência recebida da API
  const formatarCompetenciaParaInput = (dataStr: string) => {
    if (!dataStr) return '';
    
    try {
      // Tentar converter para objeto Date
      const data = new Date(dataStr);
      if (isNaN(data.getTime())) return '';
      
      // Formatar como YYYY-MM para o input type="month"
      const ano = data.getFullYear();
      const mes = String(data.getMonth() + 1).padStart(2, '0');
      return `${ano}-${mes}`;
    } catch (error) {
      console.error('Erro ao formatar competência:', error);
      return '';
    }
  };

  const [competencia, setCompetencia] = useState<string>('');

  useEffect(() => {
    if (notaFiscal) {
      setCompetencia(notaFiscal.competencia ? formatarCompetenciaParaInput(notaFiscal.competencia) : '');
    } else {
      setCompetencia('');
    }
  }, [notaFiscal]);

  const handlePrestadorChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const prestadorId = e.target.value;
    const prestador = prestadores.find(p => p.id === prestadorId) || null;
    onPrestadorChange(prestador);
  };

  const handleTomadorChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    if (onTomadorChange) {
      const tomadorId = e.target.value;
      const tomador = tomadores.find(t => t.id === tomadorId) || null;
      onTomadorChange(tomador);
    }
  };

  // Usar a data atual se não houver competência definida
  useEffect(() => {
    if (!competencia) {
      setCompetencia(formatarDataAtual());
    }
  }, [competencia]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="col-span-2">
        <h2 className="text-lg font-semibold mb-4">Dados da Nota Fiscal</h2>
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Prestador</label>
        <select 
          name="prestadorId"
          className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
          value={notaFiscal?.prestadorId || ''}
          onChange={handlePrestadorChange}
          required
          data-testid="prestador-select"
        >
          <option value="">Selecione um prestador</option>
          {prestadores.map((prestador) => (
            <option key={prestador.id} value={prestador.id}>
              {prestador.razaoSocial} - {prestador.cnpj}
            </option>
          ))}
        </select>
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Tomador</label>
        <select 
          name="tomadorId"
          className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
          value={notaFiscal?.tomadorId || ''}
          onChange={handleTomadorChange}
          required
          data-testid="tomador-select"
        >
          <option value="">Selecione um tomador</option>
          {tomadores.map((tomador) => (
            <option key={tomador.id} value={tomador.id}>
              {tomador.razaoSocial} - {tomador.cpfCnpj}
            </option>
          ))}
        </select>
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Competência (Mês/Ano)</label>
        <input 
          type="month" 
          name="competencia"
          className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
          value={competencia}
          onChange={(e) => setCompetencia(e.target.value)}
          required
        />
      </div>
      
      <div className="col-span-2">
        <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
        <textarea 
          id="descricao"
          name="descricao"
          rows={3}
          className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
          value={notaFiscal?.descricao || ''}
          onChange={onNotaFiscalChange}
        ></textarea>
      </div>
    </div>
  );
}
