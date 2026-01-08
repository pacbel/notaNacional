import { Metadata } from 'next';
import { prisma } from '@/lib/prisma';
import TomadoresContainer from './TomadoresContainer';
import { Briefcase } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Relatório de Tomadores - Sistema de Emissão de NFS-e',
  description: 'Relatório de tomadores cadastrados no sistema',
};

export default async function TomadoresPage() {
  // Buscar todos os prestadores para o filtro
  const prestadores = await prisma.prestador.findMany({
    select: {
      id: true,
      razaoSocial: true,
      cnpj: true,
    },
    orderBy: {
      razaoSocial: 'asc',
    },
  });

  return (
    <div>
      <div className="mb-6 flex items-start gap-4">
        <div className="mt-1">
          <Briefcase className="h-8 w-8 text-blue-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Relatório de Tomadores</h1>
          <p className="text-gray-600">Gere relatórios de tomadores cadastrados no sistema</p>
        </div>
      </div>

      <TomadoresContainer prestadores={prestadores} />
    </div>
  );
}
