'use client';

import dynamic from 'next/dynamic';
import type { Produto } from './page';

// Import dinâmico para evitar erros de hidratação em componentes com hooks
// Tipado como any para evitar erro de IntrinsicAttributes no TS quando usado com props customizadas
const ProdutoForm: any = dynamic(() => import('./ProdutoForm'), { ssr: false });

interface ProdutoFormWrapperProps {
  isNew: boolean;
  produto: Produto | null;
  defaultValues: {
    codigo: string;
    codigoBarras: string;
    descricao: string;
    ncm: string;
    cfop: string;
    unComercial: string;
    unTributaria: string;
    qtdComercial: number;
    qtdTributaria: number;
    precoVenda: number;
    informacoesAdicionais: string;
    crt: string;
  };
}

export default function ProdutoFormWrapper({ isNew, produto, defaultValues }: ProdutoFormWrapperProps) {
  return (
    <div className="bg-white shadow rounded-lg p-6 w-full mx-auto">
      <ProdutoForm isNew={isNew} produto={produto} defaultValues={defaultValues} />
    </div>
  );
}
