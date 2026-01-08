'use client';

import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import ServicosClient from '@/app/servicos/ServicosClient';
import { Servico as ServicoCompleto } from '@/types/servico';

export default function ServicosWrapper() {
  const searchParams = useSearchParams();
  const [servicos, setServicos] = useState<ServicoCompleto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filtro, setFiltro] = useState('ativos');

  useEffect(() => {
    const carregarServicos = async () => {
      try {
        setLoading(true);
        setError(null);

        const filtroParam = searchParams.get('filtro');
        const filtroAtual = filtroParam || 'ativos';
        setFiltro(filtroAtual);

        const response = await fetch(`/api/servicos/list?filtro=${filtroAtual}`);

        if (!response.ok) {
          throw new Error('Erro ao carregar serviços');
        }

        const data = await response.json();

        const servicosCompletos: ServicoCompleto[] = data.map((servico: any) => ({
          ...servico,
          valorUnitario: servico.valorUnitario ?? 0,
          aliquota: servico.aliquota ?? 0,
          issRetido: servico.issRetido ?? false,
          valorDeducoes: servico.valorDeducoes ?? 0,
          descontoCondicionado: servico.descontoCondicionado ?? 0,
          descontoIncondicionado: servico.descontoIncondicionado ?? 0,
          valorPis: servico.valorPis ?? 0,
          valorCofins: servico.valorCofins ?? 0,
          valorInss: servico.valorInss ?? 0,
          valorIr: servico.valorIr ?? 0,
          valorCsll: servico.valorCsll ?? 0,
          outrasRetencoes: servico.outrasRetencoes ?? 0,
          codigoMunicipio: servico.codigoMunicipio ?? '',
          exigibilidadeIss: servico.exigibilidadeIss ?? 1,
          itemListaServico: servico.itemListaServico ?? '',
          codigoTributacao: servico.codigoTributacao ?? '',
        }));

        setServicos(servicosCompletos);
      } catch (error) {
        console.error('Erro ao carregar serviços:', error);
        setError('Ocorreu um erro ao carregar os serviços. Por favor, tente novamente.');
      } finally {
        setLoading(false);
      }
    };

    carregarServicos();
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
  
  return <ServicosClient servicos={servicos} filtroAtual={filtro} />;
}
