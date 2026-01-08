'use client';

import dynamic from 'next/dynamic';
import type { Nfe } from './page';

const NfeForm: any = dynamic(() => import('./NfeForm'), { ssr: false });

interface NfeFormWrapperProps {
  isNew: boolean;
  nfe: Nfe | null;
  defaultValues: {
    numero: number;
    serie: number;
    ambiente: number;
    cnpjCliente: string;
    nomeCliente: string;
    dataEmissao: string;
    valorTotal: number;
    status: string;
    protocolo: string;
    chaveAcesso: string;
    danfeImpresso: boolean;
  };
}

export default function NfeFormWrapper({ isNew, nfe, defaultValues }: NfeFormWrapperProps) {
  return (
    <div className="bg-white shadow rounded-lg p-6 w-full mx-auto">
      <NfeForm isNew={isNew} nfe={nfe} defaultValues={defaultValues} />
    </div>
  );
}
