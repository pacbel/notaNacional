import { Metadata } from 'next';
import { prisma } from '@/lib/prisma';
import ServicosContainer from './ServicosContainer';
import { FileSpreadsheet } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Relatório de Serviços - Sistema de Emissão de NFS-e',
  description: 'Relatório de serviços cadastrados no sistema',
};

export default async function ServicosPage() {
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
          <FileSpreadsheet className="h-8 w-8 text-blue-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Relatório de Serviços</h1>
          <p className="text-gray-600">Gere relatórios de serviços cadastrados no sistema</p>
        </div>
      </div>

      <ServicosContainer prestadores={prestadores} />
    </div>
  );
}
