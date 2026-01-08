import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import OperadoraFormWrapper from './OperadoraFormWrapper';

export type Operadora = {
  id: string;
  codigo: string;
  bandeiraCodigo: string;
  bandeiraDescricao: string;
  descricao: string;
  cnpj: string;
  endereco?: string | null;
  uf?: string | null;
  codigoMunicipio?: string | null;
  ativo: boolean;
};

export default async function OperadoraFormPage({ params }: { params: { id: string } }) {
  const routeParams = await Promise.resolve(params);
  const isNew = routeParams.id === 'novo';
  const operadora = !isNew ? await prisma.operadoraCartao.findUnique({ where: { id: routeParams.id } }) as unknown as Operadora | null : null;

  const def = {
    codigo: operadora?.codigo ?? '',
    bandeiraCodigo: operadora?.bandeiraCodigo ?? '01',
    bandeiraDescricao: operadora?.bandeiraDescricao ?? 'Visa',
    descricao: operadora?.descricao ?? '',
    cnpj: operadora?.cnpj ?? '',
    endereco: operadora?.endereco ?? '',
    uf: operadora?.uf ?? '',
    codigoMunicipio: operadora?.codigoMunicipio ?? '',
  };

  return (
    <div className="w-full p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">{isNew ? 'Nova Operadora' : 'Editar Operadora'}</h1>
        <Link href="/operadoras" className="bg-gray-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-700 transition-colors">Voltar</Link>
      </div>
      <OperadoraFormWrapper isNew={isNew} operadora={operadora} defaultValues={def} />
    </div>
  );
}
