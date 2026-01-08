'use client';

import dynamic from 'next/dynamic';
import type { Operadora } from './page';

const OperadoraForm: any = dynamic(() => import('./OperadoraForm'), { ssr: false });

interface OperadoraFormWrapperProps {
  isNew: boolean;
  operadora: Operadora | null;
  defaultValues: {
    codigo: string;
    bandeiraCodigo: string;
    bandeiraDescricao: string;
    descricao: string;
    cnpj: string;
    endereco: string;
    uf: string;
    codigoMunicipio: string;
  };
}

export default function OperadoraFormWrapper({ isNew, operadora, defaultValues }: OperadoraFormWrapperProps) {
  return (
    <div className="bg-white shadow rounded-lg p-6 w-full mx-auto">
      <OperadoraForm isNew={isNew} operadora={operadora} defaultValues={defaultValues} />
    </div>
  );
}
