'use client';

import { useState, useEffect } from 'react';

interface IssRetidoSelectProps {
  value?: boolean;
  onChange?: (isRetido: boolean) => void;
}

export default function IssRetidoSelect({ value = false, onChange }: IssRetidoSelectProps) {
  const [issRetido, setIssRetido] = useState<boolean>(value);

  useEffect(() => {
    setIssRetido(value);
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newValue = e.target.value === '1';
    setIssRetido(newValue);
    
    if (onChange) {
      onChange(newValue);
    }
  };

  return (
    <div>
      <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
        ISS Retido
      </label>
      <select
        name="issRetido"
        value={issRetido ? '1' : '0'}
        onChange={handleChange}
        className="mt-1 block w-full px-2 sm:px-3 py-1 sm:py-2 text-xs sm:text-sm bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
        data-testid="issRetido-select"
      >
        <option value="0">Não</option>
        <option value="1">Sim</option>
      </select>
      {issRetido && (
        <p className="text-[10px] sm:text-xs text-amber-600 mt-1">
          Atenção: Com ISS retido, o valor do ISS não será calculado automaticamente.
        </p>
      )}
    </div>
  );
}
