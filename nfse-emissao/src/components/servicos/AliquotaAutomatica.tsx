'use client';

import { useEffect, useState } from 'react';
import ValorMonetarioInput from '@/components/ui/ValorMonetarioInput';

interface AliquotaAutomaticaProps {
  codigoTributacao: string;
  value?: number;
  onChange?: (valor: number) => void;
}

export default function AliquotaAutomatica({ codigoTributacao, value = 0, onChange }: AliquotaAutomaticaProps) {
  const [aliquota, setAliquota] = useState<number>(value);
  const [aliquotaManual, setAliquotaManual] = useState<boolean>(true);

  const handleChange = (valor: number) => {
    setAliquota(valor);
    setAliquotaManual(true);
    
    if (onChange) {
      onChange(valor);
    }
  };

  return (
    <div>
      <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Alíquota (%)</label>
      <ValorMonetarioInput
        name="aliquota"
        value={aliquota}
        onChange={handleChange}
        isPercentual={true}
        required
        data-testid="aliquota-input"
      />
    </div>
  );
}
