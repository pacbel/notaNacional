'use client';

import { useEffect, useState } from 'react';
import { getNomeAtividade } from '@/lib/tributacao/utils';

interface CodigoTributacaoDisplayProps {
  codigo: string;
}

export default function CodigoTributacaoDisplay({ codigo }: CodigoTributacaoDisplayProps) {
  const [nomeAtividade, setNomeAtividade] = useState<string>('');

  useEffect(() => {
    if (codigo) {
      const nome = getNomeAtividade(codigo);
      setNomeAtividade(nome);
    }
  }, [codigo]);

  return (
    <span title={nomeAtividade} className="flex items-center">
      {nomeAtividade ? (
        <span className="font-medium">{nomeAtividade} <span className="text-gray-500 ml-1">({codigo})</span></span>
      ) : (
        <span className="text-gray-400">{codigo}</span>
      )}
    </span>
  );
}