import React, { useState, useEffect } from 'react';

interface TelefoneInputProps {
  defaultValue?: string;
  onChange?: (value: string) => void;
  required?: boolean;
}

const TelefoneInput: React.FC<TelefoneInputProps> = ({ defaultValue = '', onChange, required = false }) => {
  const [displayValue, setDisplayValue] = useState('');

  // Formata o telefone celular para exibição: (XX) XXXXX-XXXX
  const formatTelefone = (value: string): string => {
    // Remove todos os caracteres não numéricos
    const numericValue = value.replace(/\D/g, '');
    
    // Limita a 11 dígitos (formato celular brasileiro)
    const truncated = numericValue.slice(0, 11);
    
    // Aplica a máscara
    if (truncated.length <= 2) {
      return truncated.length > 0 ? `(${truncated}` : truncated;
    } else if (truncated.length <= 7) {
      return `(${truncated.slice(0, 2)}) ${truncated.slice(2)}`;
    } else {
      return `(${truncated.slice(0, 2)}) ${truncated.slice(2, 7)}-${truncated.slice(7)}`;
    }
  };

  // Inicializa com o valor padrão formatado
  useEffect(() => {
    if (defaultValue) {
      setDisplayValue(formatTelefone(defaultValue));
    }
  }, [defaultValue]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value;
    const formattedValue = formatTelefone(rawValue);
    setDisplayValue(formattedValue);
    
    // Passa apenas os números para o callback onChange
    if (onChange) {
      const numericValue = rawValue.replace(/\D/g, '');
      onChange(numericValue);
    }
  };

  return (
    <div className="relative">
      <input
        type="tel"
        value={displayValue}
        onChange={handleChange}
        className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
        placeholder="(XX) XXXXX-XXXX"
        required={required}
      />
      <input 
        type="hidden" 
        name="telefone" 
        value={displayValue.replace(/\D/g, '')}
      />
    </div>
  );
};

export default TelefoneInput;
