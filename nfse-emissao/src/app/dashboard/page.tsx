import { prisma } from '@/lib/prisma';
import DashboardClient from './DashboardClient';

export default async function DashboardPage() {
  async function safeCount(label: string, fn: () => Promise<number>): Promise<number> {
    try {
      return await fn();
    } catch (error) {
      console.error(`[Dashboard] Falha ao contar ${label}:`, error);
      return 0;
    }
  }
  
  // Buscar contadores do banco de dados
  const [
    prestadoresCount,
    tomadoresCount,
    servicosCount,
    notasCount,
    produtosCount,
    transportadorasCount,
    operadorasCount,
    nfeCount,
  ] = await Promise.all([
    safeCount('prestadores', () => prisma.prestador.count()),
    safeCount('tomadores', () => prisma.tomador.count()),
    safeCount('servicos', () => prisma.servico.count()),
    safeCount('notas fiscais', () => prisma.notafiscal.count()),
    safeCount('produtos', () => prisma.produto.count()),
    safeCount('transportadoras', () => prisma.transportadora.count()),
    safeCount('operadorasCartao', () => prisma.operadoraCartao.count()),
    safeCount('nfe', () => prisma.nfe.count()),
  ]);

  return (
    <DashboardClient
      prestadoresCount={prestadoresCount}
      tomadoresCount={tomadoresCount}
      servicosCount={servicosCount}
      notasCount={notasCount}
      produtosCount={produtosCount}
      transportadorasCount={transportadorasCount}
      operadorasCount={operadorasCount}
      nfeCount={nfeCount}
    />
  );
}
