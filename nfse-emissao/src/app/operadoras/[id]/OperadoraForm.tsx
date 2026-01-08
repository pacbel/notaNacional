'use client';

import Link from 'next/link';
import { ArrowLeft, Save } from 'lucide-react';
import { Toaster } from 'react-hot-toast';
import CnpjInput from '@/components/ui/CnpjInput';
import EstadoMunicipioSelector from '@/components/ui/EstadoMunicipioSelector';
import type { Operadora } from './page';

interface OperadoraFormProps {
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

export default function OperadoraForm({ isNew, operadora, defaultValues }: OperadoraFormProps) {
  return (
    <>
      <Toaster position="top-right" />
      <form action={`/api/operadoras/${isNew ? 'create' : 'update'}`} method="POST" className="space-y-6 w-full max-w-full">
        {!isNew && <input type="hidden" name="id" value={operadora?.id} />}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 w-full">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Código</label>
            <input type="text" name="codigo" className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary" defaultValue={defaultValues.codigo} required />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Bandeira (Código)</label>
            <select name="bandeiraCodigo" className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary" defaultValue={defaultValues.bandeiraCodigo}>
              <option value="01">01 - Visa</option>
              <option value="02">02 - Mastercard</option>
              <option value="03">03 - Amex</option>
              <option value="04">04 - Elo</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Bandeira (Descrição)</label>
            <input type="text" name="bandeiraDescricao" className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary" defaultValue={defaultValues.bandeiraDescricao} />
          </div>

          <div className="md:col-span-2 lg:col-span-3 xl:col-span-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
            <input type="text" name="descricao" className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary" defaultValue={defaultValues.descricao} required />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">CNPJ</label>
            <CnpjInput defaultValue={defaultValues.cnpj} fieldName="cnpj" required />
          </div>

          <div className="md:col-span-2 lg:col-span-3 xl:col-span-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Endereço</label>
            <input type="text" name="endereco" className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary" defaultValue={defaultValues.endereco} />
          </div>

          <div className="md:col-span-2 lg:col-span-3 xl:col-span-4">
            <EstadoMunicipioSelector defaultUf={defaultValues.uf} defaultCodigoMunicipio={defaultValues.codigoMunicipio} />
          </div>
        </div>

        <div className="mt-6 flex items-center justify-end">
          <div className="flex gap-4">
            <Link href="/operadoras" className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600 transition flex items-center gap-2">
              <ArrowLeft size={18} />
              <span>Voltar</span>
            </Link>
            <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition flex items-center gap-2" id="salvarOperadora">
              <Save size={18} />
              <span>Salvar</span>
            </button>
          </div>
        </div>
      </form>
    </>
  );
}
