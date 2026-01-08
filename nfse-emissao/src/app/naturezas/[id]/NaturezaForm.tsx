'use client';

import Link from 'next/link';
import { ArrowLeft, Save, Tag } from 'lucide-react';
import { Toaster } from 'react-hot-toast';

export interface NaturezaDTO {
  id: string;
  descricao: string;
  ativo: boolean;
}

interface NaturezaFormProps {
  isNew: boolean;
  natureza: NaturezaDTO | null;
  defaultValues: { descricao: string };
}

export default function NaturezaForm({ isNew, natureza, defaultValues }: NaturezaFormProps) {
  return (
    <>
      <Toaster position="top-right" />
      <form action={`/api/naturezas/${isNew ? 'create' : 'update'}`} method="POST" className="space-y-6 w-full max-w-full">
        {!isNew && <input type="hidden" name="id" value={natureza?.id} />}

        <div className="grid grid-cols-1 gap-6 w-full">
          <div className="md:col-span-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
            <input
              type="text"
              name="descricao"
              className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
              defaultValue={defaultValues.descricao}
              required
            />
          </div>
        </div>

        <div className="mt-6 flex items-center justify-end">
          <div className="flex gap-4">
            <Link href="/naturezas" className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600 transition flex items-center gap-2">
              <ArrowLeft size={18} />
              <span>Voltar</span>
            </Link>
            <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition flex items-center gap-2" id="salvarNatureza">
              <Save size={18} />
              <span>Salvar</span>
            </button>
          </div>
        </div>
      </form>
    </>
  );
}
