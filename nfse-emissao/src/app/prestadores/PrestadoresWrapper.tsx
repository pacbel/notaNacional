'use client';

import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import PrestadoresClient from '@/app/prestadores/PrestadoresClient';
import { formatarCnpj } from '@/utils/formatters';

// Definir a interface para o tipo Prestador
interface Prestador {
  id: string;
  cnpj: string;
  razaoSocial: string;
  inscricaoMunicipal: string;
  nomeFantasia: string | null;
  email: string;
  telefone: string;
  endereco: string;
  numero: string;
  complemento: string | null;
  bairro: string;
  codigoMunicipio: string;
  uf: string;
  cep: string;
  ativo: boolean;
  cnpjFormatado?: string;
  [key: string]: any;
}

// Componente wrapper que carrega os dados no lado do cliente
export default function PrestadoresWrapper() {
  const searchParams = useSearchParams();
  const [prestadores, setPrestadores] = useState<Prestador[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filtro, setFiltro] = useState('ativos');

  useEffect(() => {
    const carregarPrestadores = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Obter o filtro da URL
        const filtroParam = searchParams.get('filtro');
        const filtroAtual = filtroParam || 'ativos';
        setFiltro(filtroAtual);
        
        // Buscar prestadores da API
        const response = await fetch(`/api/prestadores/list?filtro=${filtroAtual}`);
        
        if (!response.ok) {
          throw new Error('Erro ao carregar prestadores');
        }
        
        const data = await response.json();
        
        // Formatar CNPJ para exibição
        const prestadoresFormatados = data.map((p: Prestador) => ({
          ...p,
          cnpjFormatado: formatarCnpj(p.cnpj)
        }));
        
        setPrestadores(prestadoresFormatados);
      } catch (error) {
        console.error('Erro ao carregar prestadores:', error);
        setError('Ocorreu um erro ao carregar os prestadores. Por favor, tente novamente.');
      } finally {
        setLoading(false);
      }
    };
    
    carregarPrestadores();
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
  
  return <PrestadoresClient prestadores={prestadores} filtroAtual={filtro} />;
}
