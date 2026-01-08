import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import UsuariosContainer from './UsuariosContainer';

export default async function UsuariosPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await Promise.resolve(params);
  const prestadorId = resolvedParams.id;

  // Verificar se o prestador existe
  const prestador = await prisma.prestador.findUnique({
    where: { id: prestadorId },
  });

  if (!prestador) {
    notFound();
  }

  // Buscar usuários do prestador
  const usuarios = await prisma.usuario.findMany({
    where: { prestadorId },
    orderBy: { nome: 'asc' },
  });

  return (
    <div className="container mx-auto p-8">
      <UsuariosContainer 
        prestador={prestador} 
        usuarios={JSON.parse(JSON.stringify(usuarios))} 
      />
    </div>
  );
}
