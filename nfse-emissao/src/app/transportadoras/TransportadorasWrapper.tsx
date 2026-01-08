'use client';

import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import TransportadorasClient from '@/app/transportadoras/TransportadorasClient';

export interface TransportadoraListItem {
  id: string;
  codigo: string;
  razaoSocial: string;
  endereco: string;
  uf: string;
  codigoMunicipio: string;
  cpfCnpj: string;
  inscricaoEstadual?: string | null;
  ufVeiculo?: string | null;
  placaVeiculo?: string | null;
  ativo: boolean;
}

export default function TransportadorasWrapper() {
  const searchParams = useSearchParams();
  const [transportadoras, setTransportadoras] = useState<TransportadoraListItem[]>([]);
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

        const response = await fetch(`/api/transportadoras/list?filtro=${filtroAtual}`);
        if (response.ok) {
          const data = await response.json();
          setTransportadoras(data as TransportadoraListItem[]);
        } else {
          setTransportadoras([]);
        }
      } catch (e) {
        setError('Não foi possível carregar as transportadoras.');
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

  return <TransportadorasClient transportadoras={transportadoras} filtroAtual={filtro} />;
}
