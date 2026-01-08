'use client';

import Link from 'next/link';
import { ArrowLeft, Save } from 'lucide-react';
import { Toaster } from 'react-hot-toast';
import CnpjInput from '@/components/ui/CnpjInput';
import EstadoMunicipioSelector from '@/components/ui/EstadoMunicipioSelector';
import type { Transportadora } from './page';

interface TransportadoraFormProps {
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

export default function TransportadoraForm({ isNew, transportadora, defaultValues }: TransportadoraFormProps) {
  return (
    <>
      <Toaster position="top-right" />
      <form action={`/api/transportadoras/${isNew ? 'create' : 'update'}`} method="POST" className="space-y-6 w-full max-w-full">
        {!isNew && <input type="hidden" name="id" value={transportadora?.id} />}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 w-full">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Código</label>
            <input type="text" name="codigo" className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary" defaultValue={defaultValues.codigo} required />
          </div>

          <div className="md:col-span-2 lg:col-span-3 xl:col-span-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Razão Social</label>
            <input type="text" name="razaoSocial" className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary" defaultValue={defaultValues.razaoSocial} required />
          </div>

          <div className="md:col-span-2 lg:col-span-3 xl:col-span-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Endereço</label>
            <input type="text" name="endereco" className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary" defaultValue={defaultValues.endereco} required />
          </div>

          <div className="md:col-span-2 lg:col-span-3 xl:col-span-4">
            <EstadoMunicipioSelector defaultUf={defaultValues.uf} defaultCodigoMunicipio={defaultValues.codigoMunicipio} />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">CPF/CNPJ</label>
            <CnpjInput defaultValue={defaultValues.cpfCnpj} fieldName="cpfCnpj" required />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">RG/Inscrição Estadual</label>
            <input type="text" name="inscricaoEstadual" className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary" defaultValue={defaultValues.inscricaoEstadual} />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">UF Veículo</label>
            <input type="text" name="ufVeiculo" className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary" defaultValue={defaultValues.ufVeiculo} />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Placa Veículo</label>
            <input type="text" name="placaVeiculo" className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary" defaultValue={defaultValues.placaVeiculo} />
          </div>
        </div>

        <div className="mt-6 flex items-center justify-end">
          <div className="flex gap-4">
            <Link href="/transportadoras" className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600 transition flex items-center gap-2">
              <ArrowLeft size={18} />
              <span>Voltar</span>
            </Link>
            <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition flex items-center gap-2" id="salvarTransportadora">
              <Save size={18} />
              <span>Salvar</span>
            </button>
          </div>
        </div>
      </form>
    </>
  );
}
