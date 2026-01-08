'use client';

import React, { useEffect, useState } from 'react';

interface CfopInputProps {
  name?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  required?: boolean;
}

// CFOP: 4 dígitos numéricos
export default function CfopInput({ name = 'cfop', defaultValue = '', onChange, required = false }: CfopInputProps) {
  const [displayValue, setDisplayValue] = useState('');

  const format = (value: string) => value.replace(/\D/g, '').slice(0, 4);

  useEffect(() => {
    if (defaultValue) setDisplayValue(format(defaultValue));
  }, [defaultValue]);

  return (
    <div className="relative">
      <input
        type="text"
        value={displayValue}
        onChange={(e) => {
          const v = format(e.target.value);
          setDisplayValue(v);
          onChange?.(v);
        }}
        className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
        placeholder="0000"
        required={required}
      />
      <input type="hidden" name={name} value={displayValue} />
    </div>
  );
}
