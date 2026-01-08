import Link from 'next/link';
import ProdutoFormWrapper from './ProdutoFormWrapper';
import { prisma } from '@/lib/prisma';

export type Produto = {
  id: string;
  codigo: string;
  codigoBarras?: string;
  descricao: string;
  ncm?: string;
  cfop?: string;
  unComercial?: string;
  unTributaria?: string;
  qtdComercial?: number;
  qtdTributaria?: number;
  precoVenda?: number;
  informacoesAdicionais?: string;
  crt?: string;
  ativo: boolean;
};

export default async function ProdutoFormPage({ params }: { params: { id: string } }) {
  const routeParams = await Promise.resolve(params);
  const isNew = routeParams.id === 'novo';
  const produto = !isNew ? await prisma.produto.findUnique({ where: { id: routeParams.id } }) as unknown as Produto | null : null;

  const defaultValues = {
    codigo: produto?.codigo ?? '',
    codigoBarras: produto?.codigoBarras ?? '',
    descricao: produto?.descricao ?? '',
    ncm: produto?.ncm ?? '',
    cfop: produto?.cfop ?? '',
    unComercial: produto?.unComercial ?? '',
    unTributaria: produto?.unTributaria ?? '',
    qtdComercial: produto?.qtdComercial ?? 1,
    qtdTributaria: produto?.qtdTributaria ?? 1,
    precoVenda: produto?.precoVenda ?? 0,
    informacoesAdicionais: produto?.informacoesAdicionais ?? '',
    crt: produto?.crt ?? 'SN',
  };

  return (
    <div className="w-full p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">{isNew ? 'Novo Produto' : 'Editar Produto'}</h1>
        <Link href="/produtos" className="bg-gray-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-700 transition-colors">
          Voltar
        </Link>
      </div>

      <ProdutoFormWrapper isNew={isNew} produto={produto} defaultValues={defaultValues} />
    </div>
  );
}
