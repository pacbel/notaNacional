'use client';

import React, { useEffect, useState } from 'react';

interface CodigoBarrasInputProps {
  name?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  required?: boolean;
}

// Aceita EAN-8/12/13/14 (somente dígitos). Exibe agrupado em blocos para legibilidade.
export default function CodigoBarrasInput({ name = 'codigoBarras', defaultValue = '', onChange, required = false }: CodigoBarrasInputProps) {
  const [displayValue, setDisplayValue] = useState('');

  const format = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, 14);
    // formatação simples em blocos de 4
    return digits.replace(/(.{4})/g, '$1 ').trim();
  };

  useEffect(() => {
    if (defaultValue) setDisplayValue(format(defaultValue));
  }, [defaultValue]);

  return (
    <div className="relative">
      <input
        type="text"
        value={displayValue}
        onChange={(e) => {
          const formatted = format(e.target.value);
          setDisplayValue(formatted);
          onChange?.(formatted.replace(/\D/g, ''));
        }}
        className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
        placeholder="0000 0000 0000 00"
        required={required}
      />
      <input type="hidden" name={name} value={displayValue.replace(/\D/g, '')} />
    </div>
  );
}
