'use client';

import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import ProdutosClient from '@/app/produtos/ProdutosClient';

export interface ProdutoListItem {
  id: string;
  codigo: string;
  descricao: string;
  ncm?: string;
  cfop?: string;
  unidade?: string;
  precoVenda?: number;
  ativo: boolean;
}

export default function ProdutosWrapper() {
  const searchParams = useSearchParams();
  const [produtos, setProdutos] = useState<ProdutoListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filtro, setFiltro] = useState('ativos');

  useEffect(() => {
    const carregar = async () => {
      try {
        setLoading(true);
        setError(null);

        const filtroParam = searchParams.get('filtro');
        const filtroAtual = filtroParam || 'ativos';
        setFiltro(filtroAtual);

        // Endpoint a ser implementado no backend
        const response = await fetch(`/api/produtos/list?filtro=${filtroAtual}`);
        if (response.ok) {
          const data = await response.json();
          setProdutos(data as ProdutoListItem[]);
        } else {
          // Enquanto a API não existe, manter exemplo vazio e mensagem de placeholder
          setProdutos([]);
        }
      } catch (e) {
        setError('Não foi possível carregar os produtos.');
      } finally {
        setLoading(false);
      }
    };
    carregar();
  }, [searchParams]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 text-center">
        <h1 className="text-2xl font-bold text-red-600 mb-4">Erro</h1>
        <p className="text-gray-700">{error}</p>
      </div>
    );
  }

  return <ProdutosClient produtos={produtos} filtroAtual={filtro} />;
}
