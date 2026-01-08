'use client';

import { useEffect, useState } from 'react';
import axios from 'axios';
import Select, { SingleValue } from 'react-select';
import { listaServicosModel } from '@/types/listaservicosmodel';

interface CodigoTributacaoSelectProps {
  value?: string;
  onChange?: (codigos: listaServicosModel | null) => void;
  onCodigoSelected?: (codigos: listaServicosModel | null) => void;
  required?: boolean;
  className?: string;
  disabled?: boolean;
}

export default function CodigoTributacaoSelect({
  value = '',
  onChange,
  onCodigoSelected,
  required = false,
  className = '',
  disabled = false
}: CodigoTributacaoSelectProps) {
  const [codigos, setCodigos] = useState<listaServicosModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    axios.get('/api/tributacao/codigos')
      .then(res => {
        setCodigos(res.data);
        setLoading(false);
      })
      .catch(() => {
        setErro('Erro ao carregar códigos de tributação');
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    if (onCodigoSelected) {
      const codigoSelecionado = codigos.find(c => c.codigo === value) || null;
      onCodigoSelected(codigoSelecionado);
    }
  }, [value, codigos, onCodigoSelected]);

  // Opções formatadas para o react-select
  const options = codigos.map(codigo => ({
    value: codigo.codigo,
    label: `${codigo.codigo} - ${codigo.descricao}`
  }));

  // Encontrar a opção selecionada
  const selectedOption = options.find(opt => opt.value === value) || null;

  const handleSelectChange = (selected: SingleValue<{ value: string; label: string }>) => {
    const selectedValue = selected ? selected.value : '';
    const codigoSelecionado = codigos.find(c => c.codigo === selectedValue) || null;
    if (onChange) {
      onChange(codigoSelecionado);
    }
    if (onCodigoSelected) {
      onCodigoSelected(codigoSelecionado);
    }
  };

  return (
    <div className="w-full">
      <Select
        className={className}
        value={selectedOption}
        onChange={handleSelectChange}
        options={options}
        isClearable
        isDisabled={disabled || loading}
        placeholder="Selecione o código de tributação"
        required={required}
        styles={{
          menu: (base) => ({ ...base, zIndex: 9999 }),
        }}
        noOptionsMessage={() => loading ? 'Carregando códigos de tributação...' : 'Nenhum código encontrado'}
      />
      {loading && (
        <div className="mt-1 text-sm text-gray-500">Carregando códigos de tributação...</div>
      )}
      {erro && (
        <div className="mt-1 text-sm text-red-500">{erro}</div>
      )}
    </div>
  );
}