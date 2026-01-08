'use client';

import dynamic from 'next/dynamic';
import { Prestador } from '@/types/interfaces';

// Importar o componente de forma dinâmica para evitar erros de hidratação
const PrestadorForm = dynamic(() => import('./PrestadorForm'), { ssr: false });

interface PrestadorFormWrapperProps {
  isNew: boolean;
  prestador: Prestador | null;
  defaultValues: any;
}

export default function PrestadorFormWrapper({ isNew, prestador, defaultValues }: PrestadorFormWrapperProps) {
  return (
    <div className="bg-white shadow rounded-lg p-6 w-full mx-auto">
      <PrestadorForm isNew={isNew} prestador={prestador} defaultValues={defaultValues} />
    </div>
  );
}
