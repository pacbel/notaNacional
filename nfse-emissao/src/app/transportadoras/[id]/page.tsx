import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import TransportadoraFormWrapper from './TransportadoraFormWrapper';

export type Transportadora = {
  id: string;
  codigo: string;
  razaoSocial: string;
  endereco: string;
  uf: string;
  codigoMunicipio: string;
  cpfCnpj: string;
  inscricaoEstadual?: string | null;
  ufVeiculo?: string | null;
  placaVeiculo?: string | null;
  ativo: boolean;
};

export default async function TransportadoraFormPage({ params }: { params: { id: string } }) {
  const routeParams = await Promise.resolve(params);
  const isNew = routeParams.id === 'novo';
  const transportadora = !isNew ? await prisma.transportadora.findUnique({ where: { id: routeParams.id } }) as unknown as Transportadora | null : null;

  const def = {
    codigo: transportadora?.codigo ?? '',
    razaoSocial: transportadora?.razaoSocial ?? '',
    endereco: transportadora?.endereco ?? '',
    uf: transportadora?.uf ?? '',
    codigoMunicipio: transportadora?.codigoMunicipio ?? '',
    cpfCnpj: transportadora?.cpfCnpj ?? '',
    inscricaoEstadual: transportadora?.inscricaoEstadual ?? '',
    ufVeiculo: transportadora?.ufVeiculo ?? '',
    placaVeiculo: transportadora?.placaVeiculo ?? '',
  };

  return (
    <div className="w-full p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">{isNew ? 'Nova Transportadora' : 'Editar Transportadora'}</h1>
        <Link href="/transportadoras" className="bg-gray-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-700 transition-colors">Voltar</Link>
      </div>
      <TransportadoraFormWrapper isNew={isNew} transportadora={transportadora} defaultValues={def} />
    </div>
  );
}
