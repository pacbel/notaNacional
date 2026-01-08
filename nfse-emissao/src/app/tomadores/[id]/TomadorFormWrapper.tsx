'use client';

import dynamic from 'next/dynamic';
import { Tomador } from '@/types/interfaces';

// Importar o componente de forma dinâmica para evitar erros de hidratação
const TomadorForm = dynamic(() => import('./TomadorForm'), { ssr: false });

interface TomadorFormWrapperProps {
  isNew: boolean;
  tomador: Tomador | null;
  defaultValues: {
    razaoSocial: string;
    cnpj: string;
    inscricaoMunicipal: string;
    email: string;
    telefone: string;
    endereco: string;
    numero: string;
    complemento: string;
    bairro: string;
    cep: string;
    uf: string;
    codigoMunicipio: string;
  };
}

export default function TomadorFormWrapper({ isNew, tomador, defaultValues }: TomadorFormWrapperProps) {
  return (
    <div className="bg-white shadow rounded-lg p-6 w-full mx-auto">
      <TomadorForm isNew={isNew} tomador={tomador} defaultValues={defaultValues} />
    </div>
  );
}
