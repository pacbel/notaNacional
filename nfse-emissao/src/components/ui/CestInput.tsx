'use client';

import React, { useEffect, useState } from 'react';

interface CestInputProps {
  name?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  required?: boolean;
}

// CEST: 7 dígitos. Exibição: 00.000.00
export default function CestInput({ name = 'cest', defaultValue = '', onChange, required = false }: CestInputProps) {
  const [displayValue, setDisplayValue] = useState('');

  const format = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, 7);
    if (digits.length <= 2) return digits;
    if (digits.length <= 5) return `${digits.slice(0, 2)}.${digits.slice(2)}`;
    return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 7)}`;
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
        placeholder="00.000.00"
        required={required}
      />
      <input type="hidden" name={name} value={displayValue.replace(/\D/g, '')} />
    </div>
  );
}
