'use client';

import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import NaturezasClient, { NaturezaListItem } from './NaturezasClient';

export default function NaturezasWrapper() {
  const searchParams = useSearchParams();
  const [items, setItems] = useState<NaturezaListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filtro, setFiltro] = useState('ativos');

  useEffect(() => {
    const carregar = async () => {
      try {
        setLoading(true);
        setError(null);
        const filtroAtual = searchParams.get('filtro') || 'ativos';
        setFiltro(filtroAtual);
        const resp = await fetch(`/api/naturezas/list?filtro=${filtroAtual}`);
        if (resp.ok) {
          const data = await resp.json();
          setItems(data as NaturezaListItem[]);
        } else {
          setItems([]);
        }
      } catch {
        setError('Não foi possível carregar as naturezas.');
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

  return <NaturezasClient naturezas={items} filtroAtual={filtro} />;
}
