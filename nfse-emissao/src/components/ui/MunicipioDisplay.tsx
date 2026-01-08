'use client';

import { useEffect, useState } from 'react';
import { getNomeMunicipio } from '@/lib/ibge/utils';

interface MunicipioDisplayProps {
  codigoMunicipio: string;
  uf: string;
}

export default function MunicipioDisplay({ codigoMunicipio, uf }: MunicipioDisplayProps) {
  const [nomeMunicipio, setNomeMunicipio] = useState<string>('');

  useEffect(() => {
    if (codigoMunicipio) {
      const nome = getNomeMunicipio(codigoMunicipio);
      setNomeMunicipio(nome);
    }
  }, [codigoMunicipio]);

  return (
    <span title={`${nomeMunicipio} - ${uf}`} className="flex items-center">
      {nomeMunicipio ? (
        <span className="font-medium">{nomeMunicipio} <span className="text-gray-500 ml-1">({uf})</span></span>
      ) : (
        <span className="text-gray-400">{codigoMunicipio}/{uf}</span>
      )}
    </span>
  );
}
