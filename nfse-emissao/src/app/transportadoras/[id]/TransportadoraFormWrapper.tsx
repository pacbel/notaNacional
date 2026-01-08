'use client';

import dynamic from 'next/dynamic';
import type { Transportadora } from './page';

// Tipado como any para evitar conflitos de IntrinsicAttributes no SSR
const TransportadoraForm: any = dynamic(() => import('./TransportadoraForm'), { ssr: false });

interface TransportadoraFormWrapperProps {
  isNew: boolean;
  transportadora: Transportadora | null;
  defaultValues: {
    codigo: string;
    razaoSocial: string;
    endereco: string;
    uf: string;
    codigoMunicipio: string;
    cpfCnpj: string;
    inscricaoEstadual: string;
    ufVeiculo: string;
    placaVeiculo: string;
  };
}

export default function TransportadoraFormWrapper({ isNew, transportadora, defaultValues }: TransportadoraFormWrapperProps) {
  return (
    <div className="bg-white shadow rounded-lg p-6 w-full mx-auto">
      <TransportadoraForm isNew={isNew} transportadora={transportadora} defaultValues={defaultValues} />
    </div>
  );
}
