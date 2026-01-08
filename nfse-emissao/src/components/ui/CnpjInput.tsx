import React, { useState, useEffect } from 'react';

interface CnpjInputProps {
  defaultValue?: string;
  onChange?: (value: string) => void;
  required?: boolean;
  fieldName?: string; // Nome do campo no formulário
}

const CnpjInput: React.FC<CnpjInputProps> = ({ defaultValue = '', onChange, required = false, fieldName = 'cpfCnpj' }) => {
  const [displayValue, setDisplayValue] = useState('');

  // Formata o CNPJ para exibição: XX.XXX.XXX/XXXX-XX
  const formatCnpj = (value: string): string => {
    // Remove todos os caracteres não numéricos
    const numericValue = value.replace(/\D/g, '');
    
    // Limita a 14 dígitos
    const truncated = numericValue.slice(0, 14);
    
    // Aplica a máscara
    if (truncated.length <= 2) {
      return truncated;
    } else if (truncated.length <= 5) {
      return `${truncated.slice(0, 2)}.${truncated.slice(2)}`;
    } else if (truncated.length <= 8) {
      return `${truncated.slice(0, 2)}.${truncated.slice(2, 5)}.${truncated.slice(5)}`;
    } else if (truncated.length <= 12) {
      return `${truncated.slice(0, 2)}.${truncated.slice(2, 5)}.${truncated.slice(5, 8)}/${truncated.slice(8)}`;
    } else {
      return `${truncated.slice(0, 2)}.${truncated.slice(2, 5)}.${truncated.slice(5, 8)}/${truncated.slice(8, 12)}-${truncated.slice(12, 14)}`;
    }
  };

  // Inicializa com o valor padrão formatado
  useEffect(() => {
    if (defaultValue) {
      setDisplayValue(formatCnpj(defaultValue));
    }
  }, [defaultValue]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value;
    const formattedValue = formatCnpj(rawValue);
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
        type="text"
        value={displayValue}
        onChange={handleChange}
        className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
        placeholder="XX.XXX.XXX/XXXX-XX"
        required={required}
      />
      <input 
        type="hidden" 
        name={fieldName} 
        value={displayValue.replace(/\D/g, '')}
      />
    </div>
  );
};

export default CnpjInput;
