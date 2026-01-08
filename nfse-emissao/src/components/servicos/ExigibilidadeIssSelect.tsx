'use client';

import { useState, useEffect } from 'react';

interface ExigibilidadeIssSelectProps {
  value?: number;
  onChange?: (exigibilidade: number) => void;
}

export default function ExigibilidadeIssSelect({ value = 1, onChange }: ExigibilidadeIssSelectProps) {
  const [exigibilidade, setExigibilidade] = useState<number>(value);

  useEffect(() => {
    setExigibilidade(value);
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newValue = parseInt(e.target.value, 10);
    setExigibilidade(newValue);
    
    if (onChange) {
      onChange(newValue);
    }
  };

  return (
    <div>
      <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
        Exigibilidade do ISS
      </label>
      <select
        name="exigibilidadeIss"
        value={exigibilidade}
        onChange={handleChange}
        className="mt-1 block w-full px-2 sm:px-3 py-1 sm:py-2 text-xs sm:text-sm bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
        data-testid="exigibilidadeIss-select"
      >
        <option value="1">1 - Exigível</option>
        <option value="2">2 - Não incidência</option>
        <option value="3">3 - Isenção</option>
        <option value="4">4 - Exportação</option>
        <option value="5">5 - Imunidade</option>
        <option value="6">6 - Exigibilidade Suspensa por Decisão Judicial</option>
        <option value="7">7 - Exigibilidade Suspensa por Processo Administrativo</option>
      </select>
      {exigibilidade !== 1 && (
        <p className="text-[10px] sm:text-xs text-amber-600 mt-1">
          Atenção: Com exigibilidade diferente de &quot;Exigível&quot;, pode ser necessário informar o número do processo.
        </p>
      )}
    </div>
  );
}
