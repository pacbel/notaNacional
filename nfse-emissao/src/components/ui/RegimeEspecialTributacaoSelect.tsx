'use client';

import React from 'react';
import Select, { StylesConfig } from 'react-select';

interface RegimeEspecialTributacaoSelectProps {
  value: number;
  onChange: (value: number) => void;
  className?: string;
  disabled?: boolean;
}

type OptionType = {
  value: number;
  label: string;
};

const regimesEspeciaisTributacao = [
  { value: 0, label: 'Selecione um regime' },
  { value: 2, label: 'Estimativa' },
  { value: 3, label: 'Sociedade de Profissionais' },
  { value: 4, label: 'Cooperativa' },
  { value: 5, label: 'MEI do Simples Nacional' },
  { value: 6, label: 'ME ou EPP do Simples Nacional' }
];

export default function RegimeEspecialTributacaoSelect({
  value,
  onChange,
  className = '',
  disabled = false
}: RegimeEspecialTributacaoSelectProps) {
  // Encontrar a opção selecionada
  const selectedOption = regimesEspeciaisTributacao.find(option => option.value === value) || null;
  
  // Estilo customizado para o react-select (igual ao UfMunicipioSelector)
  const customStyles: StylesConfig<OptionType, false> = {
    control: (provided) => ({
      ...provided,
      minHeight: '42px',
      height: 'auto',
      boxShadow: 'none',
      padding: '2px 8px',
      '&:hover': {
        borderColor: '#6366F1'
      }
    }),
    menu: (provided) => ({
      ...provided,
      zIndex: 9999,
      width: '100%'
    }),
    menuList: (provided) => ({
      ...provided,
      maxHeight: '250px'
    }),
    option: (provided) => ({
      ...provided,
      whiteSpace: 'normal',
      wordWrap: 'break-word',
      padding: '10px 12px'
    }),
    singleValue: (provided) => ({
      ...provided,
      whiteSpace: 'normal',
      wordWrap: 'break-word',
      maxWidth: '100%'
    }),
    valueContainer: (provided) => ({
      ...provided,
      padding: '2px 8px',
      maxWidth: '100%',
      overflow: 'hidden'
    }),
    input: (provided) => ({
      ...provided,
      maxWidth: '100%'
    })
  };

  return (
    <div>
      <Select
        name="regimeEspecialTributacao-select"
        options={regimesEspeciaisTributacao}
        value={selectedOption}
        onChange={(option) => {
          const regime = (option as OptionType)?.value || 0;
          onChange(regime);
          
          // Atualizar o campo oculto
          const hiddenInput = document.getElementById('regimeEspecialTributacao') as HTMLInputElement;
          if (hiddenInput) {
            hiddenInput.value = regime.toString();
          }
        }}
        placeholder="Selecione um regime"
        isSearchable
        className={`basic-single ${className}`}
        classNamePrefix="select"
        styles={customStyles}
        isDisabled={disabled}
        noOptionsMessage={() => "Nenhum regime encontrado"}
      />
      <input 
        type="hidden" 
        name="regimeEspecialTributacao" 
        value={value} 
        id="regimeEspecialTributacao" 
      />
    </div>
  );
}
