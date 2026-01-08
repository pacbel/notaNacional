import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Tomador } from '@/types/interfaces';
import TomadorFormWrapper from './TomadorFormWrapper';

export default async function TomadorFormPage({ params }: { params: { id: string } }) {
  // Aguardar os parâmetros da rota
  const routeParams = await Promise.resolve(params);

  // Buscar dados do tomador se for edição
  const isNew = routeParams.id === 'novo';
  const tomador = !isNew ? await prisma.tomador.findUnique({
    where: { id: routeParams.id }
  }) as Tomador | null : null;

  // Preparar os valores padrão
  const defaultValues = {
    razaoSocial: tomador?.razaoSocial ?? '',
    cnpj: tomador?.cpfCnpj ?? '',
    inscricaoMunicipal: tomador?.inscricaoMunicipal ?? '',
    inscricaoEstadual: (tomador as any)?.inscricaoEstadual ?? '',
    email: tomador?.email ?? '',
    telefone: tomador?.telefone ?? '',
    endereco: tomador?.endereco ?? '',
    numero: tomador?.numero ?? '',
    complemento: tomador?.complemento ?? '',
    bairro: tomador?.bairro ?? '',
    cep: tomador?.cep ?? '',
    uf: tomador?.uf ?? '',
    codigoMunicipio: tomador?.codigoMunicipio ?? ''
  };

  return (
    <div className="w-full p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">{isNew ? 'Novo Tomador' : 'Editar Tomador'}</h1>
        <Link href="/tomadores" className="bg-gray-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-700 transition-colors">
          Voltar
        </Link>
      </div>
      
      <TomadorFormWrapper isNew={isNew} tomador={tomador} defaultValues={defaultValues} />
    </div>
  );
}
