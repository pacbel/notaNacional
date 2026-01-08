import { Metadata } from 'next';
import { prisma } from '@/lib/prisma';
import LogsContainer from './LogsContainer';
import { ClipboardList } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Relatório de Logs - Sistema de Emissão de NFS-e',
  description: 'Relatório de logs do sistema',
};

export default async function LogsPage() {
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
          <ClipboardList className="h-8 w-8 text-blue-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Relatório de Logs</h1>
          <p className="text-gray-600">Gere relatórios de logs do sistema para auditoria</p>
        </div>
      </div>

      <LogsContainer prestadores={prestadores} />
    </div>
  );
}
