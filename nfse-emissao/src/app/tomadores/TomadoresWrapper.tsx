'use client';

import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import TomadoresClient from '@/app/tomadores/TomadoresClient';

interface Tomador {
  id: string;
  razaoSocial: string;
  cpfCnpj: string;
  tipo: string;
  codigoMunicipio: string;
  uf: string;
  ativo: boolean;
}

export default function TomadoresWrapper() {
  const searchParams = useSearchParams();
  const [tomadores, setTomadores] = useState<Tomador[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filtro, setFiltro] = useState('ativos');

  useEffect(() => {
    const carregarTomadores = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Obter o filtro da URL
        const filtroParam = searchParams.get('filtro');
        const filtroAtual = filtroParam || 'ativos';
        setFiltro(filtroAtual);
        
        // Buscar tomadores da API
        const response = await fetch(`/api/tomadores/list?filtro=${filtroAtual}`);
        
        if (!response.ok) {
          throw new Error('Erro ao carregar tomadores');
        }
        
        const data = await response.json();
        setTomadores(data);
      } catch (error) {
        console.error('Erro ao carregar tomadores:', error);
        setError('Ocorreu um erro ao carregar os tomadores. Por favor, tente novamente.');
      } finally {
        setLoading(false);
      }
    };
    
    carregarTomadores();
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
  
  return <TomadoresClient tomadores={tomadores} filtroAtual={filtro} />;
}
