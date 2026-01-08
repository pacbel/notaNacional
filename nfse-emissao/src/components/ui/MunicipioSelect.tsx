'use client';

import { useEffect, useState } from 'react';
import { getMunicipios } from '@/lib/ibge/utils';

interface MunicipioSelectProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
  required?: boolean;
  disabled?: boolean;
}

export default function MunicipioSelect({
  value,
  onChange,
  className = '',
  required = false,
  disabled = false
}: MunicipioSelectProps) {
  const [municipios, setMunicipios] = useState<{ codigo: string; nome: string }[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [filteredMunicipios, setFilteredMunicipios] = useState<{ codigo: string; nome: string }[]>([]);

  useEffect(() => {
    // Carregar os municípios
    const municipiosObj = getMunicipios();
    const municipiosArray = Object.entries(municipiosObj)
      .map(([codigo, nome]) => ({
        codigo,
        nome
      }))
      .sort((a, b) => a.nome.localeCompare(b.nome));
    
    setMunicipios(municipiosArray);
    setFilteredMunicipios(municipiosArray);
    setIsLoading(false);
  }, []);

  // Filtrar municípios quando o termo de busca mudar
  useEffect(() => {
    if (!searchTerm) {
      setFilteredMunicipios(municipios);
      return;
    }

    const termoBusca = searchTerm.toLowerCase();
    const filtered = municipios.filter(
      municipio => 
        municipio.nome.toLowerCase().includes(termoBusca) || 
        municipio.codigo.includes(termoBusca)
    );
    
    setFilteredMunicipios(filtered);
  }, [searchTerm, municipios]);

  return (
    <div className="w-full">
      <div className="relative">
        <input
          type="text"
          placeholder="Buscar município..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 mb-2 text-sm"
          disabled={disabled}
        />
      </div>
      
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm ${className}`}
        required={required}
        disabled={disabled || isLoading}
        style={{ maxWidth: '100%', textOverflow: 'ellipsis' }}
      >
        <option value="">Selecione o município</option>
        {filteredMunicipios.map((municipio) => (
          <option key={municipio.codigo} value={municipio.codigo}>
            {municipio.nome} ({municipio.codigo})
          </option>
        ))}
      </select>
      
      {isLoading && (
        <div className="mt-1 text-sm text-gray-500">Carregando municípios...</div>
      )}
    </div>
  );
}
