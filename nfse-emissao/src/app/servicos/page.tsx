import { prisma } from '@/lib/prisma';
import ServicosClient from './ServicosClient';
import Link from 'next/link';
import { Grid } from 'lucide-react';
import { Button } from '@/components/ui/button';

// Forçar renderização dinâmica para evitar erro de build com searchParams
export const dynamic = 'force-dynamic';

// Importando o tipo Servico do arquivo de tipos
import { Servico } from '@/types/servico';

export default async function ServicosPage({ searchParams }: { searchParams: { filtro?: string } }) {
  try {
    // Obter o filtro da URL ou usar 'ativos' como padrão
    const params = await Promise.resolve(searchParams);
    const filtro = params.filtro || 'ativos';

    // Definir filtro explicitamente
    let where = {};
    if (filtro === 'ativos') {
      where = { ativo: true };
    } else if (filtro === 'inativos') {
      where = { ativo: false };
    }

    // Buscar serviços do banco de dados
    const servicos = await prisma.servico.findMany({
      where,
      select: {
        id: true,
        descricao: true,
        codigoServico: true,
        valorUnitario: true,
        issRetido: true,
        baseCalculo: true,
        valorIss: true,
        valorLiquido: true,
        valorDeducoes: true,
        descontoCondicionado: true,
        descontoIncondicionado: true,
        valorPis: true,
        valorCofins: true,
        valorInss: true,
        valorIr: true,
        valorCsll: true,
        outrasRetencoes: true,
        ativo: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: {
        descricao: 'asc',
      },
    });
    
    return (
      <div className="container mx-auto px-4 py-6">
        <div className="flex justify-end mb-4">
          <Button variant="outline" size="sm" asChild>
            <Link href="/servicos/cards" className="flex items-center gap-1">
              <Grid size={16} />
              <span>Visualizar em Cards</span>
            </Link>
          </Button>
        </div>
        <ServicosClient servicos={servicos as Servico[]} filtroAtual={filtro} />
      </div>
    );
  } catch (error) {
    console.error('Erro ao carregar serviços:', error);
    return (
      <div className="container mx-auto px-4 py-6">
        <div className="p-8 text-center bg-white rounded-md shadow-sm border border-gray-200">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Erro ao carregar serviços</h1>
          <p className="text-gray-700">Ocorreu um erro ao tentar carregar os serviços. Por favor, tente novamente mais tarde.</p>
        </div>
      </div>
    );
  }
}