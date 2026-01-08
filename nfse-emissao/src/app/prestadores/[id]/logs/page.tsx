import { prisma } from '@/lib/prisma';
import LogsContainer from './LogsContainer';

interface PageProps {
  params: {
    id: string;
  };
}

export default async function LogsPage({ params }: PageProps) {
  // Garantir que params seja aguardado antes de acessar suas propriedades
  const { id: prestadorId } = await Promise.resolve(params);

  // Buscar dados do prestador
  const prestador = await prisma.prestador.findUnique({
    where: { id: prestadorId },
    select: {
      id: true,
      razaoSocial: true,
    },
  });

  if (!prestador) {
    return <div className="p-8 text-center">Prestador não encontrado.</div>;
  }

  // Buscar usuários do prestador
  const usuarios = await prisma.usuario.findMany({
    where: { prestadorId },
    select: {
      id: true,
      nome: true,
      username: true,
    },
    orderBy: {
      nome: 'asc',
    },
  });

  return <LogsContainer prestador={prestador} usuarios={usuarios} />;
}
