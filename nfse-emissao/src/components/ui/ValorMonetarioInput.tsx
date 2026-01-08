'use client';

import { ChangeEvent, useState, useEffect } from 'react';
import { formatarValorDigitacao, converterParaNumero, formatarNumero } from '@/utils/formatters';

interface ValorMonetarioInputProps {
  name: string;
  value?: number;
  onChange?: (valor: number) => void;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  placeholder?: string;
  isPercentual?: boolean;
}

/**
 * Componente para entrada de valores monetários com formatação automática
 * Permite a digitação fluida de valores com vírgula como separador decimal
 */
export default function ValorMonetarioInput({
  name,
  value = 0,
  onChange,
  required = false,
  disabled = false,
  className = '',
  placeholder = '0,00',
  isPercentual = false
}: ValorMonetarioInputProps) {
  // Estado para controlar o valor exibido durante a digitação
  const [valorExibido, setValorExibido] = useState<string>('');
  
  // Atualiza o valor exibido quando o valor da prop muda
  useEffect(() => {
    // Se estiver em modo de edição (o usuário está digitando), não atualize
    if (document.activeElement !== document.querySelector(`input[name="${name}"]`)) {
      setValorExibido(isPercentual 
        ? formatarNumero(value * 100) 
        : formatarNumero(value));
    }
  }, [value, name, isPercentual]);
  
  // Manipulador para quando o valor é alterado pelo usuário
  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const valorDigitado = e.target.value;
    
    // Formata o valor durante a digitação
    const valorFormatado = formatarValorDigitacao(valorDigitado);
    setValorExibido(valorFormatado);
    
    // Converte para número e notifica o componente pai
    if (onChange) {
      const valorNumerico = converterParaNumero(valorFormatado);
      onChange(isPercentual ? valorNumerico / 100 : valorNumerico);
    }
  };
  
  // Quando o campo perde o foco, formata o valor corretamente
  const handleBlur = () => {
    const valorNumerico = converterParaNumero(valorExibido);
    setValorExibido(formatarNumero(isPercentual ? valorNumerico : valorNumerico));
  };
  
  // Quando o campo recebe foco, permite edição mais natural
  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    // Seleciona todo o texto ao receber foco
    e.target.select();
  };
  
  return (
    <div className="relative">
      <input
        type="text"
        name={name}
        value={valorExibido}
        onChange={handleChange}
        onBlur={handleBlur}
        onFocus={handleFocus}
        required={required}
        disabled={disabled}
        placeholder={placeholder}
        className={`mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary ${className}`}
      />
      {isPercentual && (
        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
          <span className="text-gray-500">%</span>
        </div>
      )}
    </div>
  );
}
