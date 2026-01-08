import React, { useState, useEffect } from 'react';

interface InscricaoMunicipalInputProps {
  defaultValue?: string;
  onChange?: (value: string) => void;
  required?: boolean;
}

const InscricaoMunicipalInput: React.FC<InscricaoMunicipalInputProps> = ({ defaultValue = '', onChange, required = false }) => {
  const [displayValue, setDisplayValue] = useState('');

  // Formata a Inscriu00e7u00e3o Municipal para exibiu00e7u00e3o
  // Como a formatau00e7u00e3o pode variar por municu00edpio, vamos usar uma formatau00e7u00e3o genu00e9rica
  // que separa os du00edgitos em grupos de 3 (XXX.XXX.XXX)
  const formatInscricaoMunicipal = (value: string): string => {
    // Remove todos os caracteres nu00e3o numu00e9ricos
    const numericValue = value.replace(/\D/g, '');
    
    // Formata em grupos de 3 du00edgitos
    let formatted = '';
    for (let i = 0; i < numericValue.length; i++) {
      if (i > 0 && i % 3 === 0) {
        formatted += '.';
      }
      formatted += numericValue[i];
    }
    
    return formatted;
  };

  // Inicializa com o valor padru00e3o formatado
  useEffect(() => {
    if (defaultValue) {
      setDisplayValue(formatInscricaoMunicipal(defaultValue));
    }
  }, [defaultValue]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value;
    const formattedValue = formatInscricaoMunicipal(rawValue);
    setDisplayValue(formattedValue);
    
    // Passa apenas os nu00fameros para o callback onChange
    if (onChange) {
      const numericValue = rawValue.replace(/\D/g, '');
      onChange(numericValue);
    }
  };

  return (
    <div className="relative">
      <input
        type="text"
        value={displayValue}
        onChange={handleChange}
        className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
        placeholder="XXX.XXX.XXX"
        required={required}
      />
      <input 
        type="hidden" 
        name="inscricaoMunicipal" 
        value={displayValue.replace(/\D/g, '')}
      />
    </div>
  );
};

export default InscricaoMunicipalInput;
