'use client';

import React, { useEffect, useState } from 'react';

interface NcmInputProps {
  name?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  required?: boolean;
}

// NCM: 8 dígitos. Exibição: NNNN.NN.NN
export default function NcmInput({ name = 'ncm', defaultValue = '', onChange, required = false }: NcmInputProps) {
  const [displayValue, setDisplayValue] = useState('');

  const format = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, 8);
    if (digits.length <= 4) return digits;
    if (digits.length <= 6) return `${digits.slice(0, 4)}.${digits.slice(4)}`;
    return `${digits.slice(0, 4)}.${digits.slice(4, 6)}.${digits.slice(6, 8)}`;
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
        placeholder="0000.00.00"
        required={required}
      />
      <input type="hidden" name={name} value={displayValue.replace(/\D/g, '')} />
    </div>
  );
}
