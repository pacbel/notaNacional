"use client";

import { useState } from 'react';

interface CampoFiltro {
  nome: string;
  label: string;
  tipo: 'texto' | 'select' | 'data' | 'numero';
  opcoes?: { valor: string; label: string }[];
  placeholder?: string;
}

interface FiltrosRelatorioProps {
  campos: CampoFiltro[];
  onFiltrar: (filtros: Record<string, string | number>) => void;
}

export default function FiltrosRelatorio({ campos, onFiltrar }: FiltrosRelatorioProps) {
  const [filtros, setFiltros] = useState<Record<string, string | number>>({});

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    const novosFiltros: Record<string, string | number> = {
      ...filtros,
      [name]: value
    };
    setFiltros(novosFiltros);
    // Aplica os filtros automaticamente quando um campo é alterado
    onFiltrar(novosFiltros);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Não é mais necessário, pois os filtros são aplicados automaticamente
  };

  const handleLimpar = () => {
    const filtrosVazios = campos.reduce((acc, campo) => {
      acc[campo.nome] = '';
      return acc;
    }, {} as Record<string, string>);
    
    setFiltros(filtrosVazios);
    onFiltrar({});
  };

  return (
    <div className="bg-white shadow rounded-lg p-4 mb-6">
      <h2 className="text-lg font-semibold mb-4">Filtros</h2>
      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {campos.map((campo) => (
          <div key={campo.nome}>
            <label htmlFor={campo.nome} className="block text-sm font-medium text-gray-700 mb-1">
              {campo.label}
            </label>
            
            {campo.tipo === 'select' ? (
              <select
                id={campo.nome}
                name={campo.nome}
                value={filtros[campo.nome] || ''}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">{campo.placeholder || `Todos os ${campo.label.toLowerCase()}`}</option>
                {campo.opcoes?.map((opcao) => (
                  <option key={opcao.valor} value={opcao.valor}>
                    {opcao.label}
                  </option>
                ))}
              </select>
            ) : campo.tipo === 'data' ? (
              <input
                type="date"
                id={campo.nome}
                name={campo.nome}
                value={filtros[campo.nome] || ''}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            ) : campo.tipo === 'numero' ? (
              <input
                type="number"
                id={campo.nome}
                name={campo.nome}
                value={filtros[campo.nome] || ''}
                onChange={handleChange}
                placeholder={campo.placeholder}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            ) : (
              <input
                type="text"
                id={campo.nome}
                name={campo.nome}
                value={filtros[campo.nome] || ''}
                onChange={handleChange}
                placeholder={campo.placeholder}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            )}
          </div>
        ))}

        <div className="md:col-span-3 flex justify-end space-x-2 mt-4">
          <button
            type="button"
            onClick={handleLimpar}
            className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Limpar Filtros
          </button>
          {/* Botão Filtrar removido conforme solicitado */}
        </div>
      </form>
    </div>
  );
}
