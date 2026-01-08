import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import NaturezaFormWrapper from './NaturezaFormWrapper';

export type Natureza = {
  id: string;
  descricao: string;
  ativo: boolean;
};

export default async function NaturezaFormPage({ params }: { params: { id: string } }) {
  const routeParams = await Promise.resolve(params);
  const isNew = routeParams.id === 'novo';
  const natureza = !isNew ? await prisma.natureza.findUnique({ where: { id: routeParams.id } }) as unknown as Natureza | null : null;

  const def = {
    descricao: natureza?.descricao ?? '',
  };

  return (
    <div className="w-full p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">{isNew ? 'Nova Natureza' : 'Editar Natureza'}</h1>
        <Link href="/naturezas" className="bg-gray-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-700 transition-colors">Voltar</Link>
      </div>
      <NaturezaFormWrapper isNew={isNew} natureza={natureza} defaultValues={def} />
    </div>
  );
}
