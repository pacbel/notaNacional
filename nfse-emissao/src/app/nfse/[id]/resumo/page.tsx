import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import AcoesResumo from './AcoesResumo';

export default async function ResumoNFSePage({ params }: { params: Promise<{ id: string }> }) {
  // Resolver os parâmetros da rota
  const resolvedParams = await params;
  
  // Buscar dados da nota fiscal
  const notaFiscal = await prisma.notafiscal.findUnique({
    where: { id: resolvedParams.id },
    include: {
      prestador: true,
      tomador: true,
      itemnotafiscal: {
        include: { servico: true }
      }
    }
  });

  if (!notaFiscal) {
    return (
      <div className="container mx-auto p-8">
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg">
          <h2 className="text-lg font-semibold">Nota fiscal não encontrada</h2>
          <Link href="/nfse" className="text-blue-600 hover:text-blue-900 mt-4 inline-block">
            Voltar para listagem
          </Link>
        </div>
      </div>
    );
  }

  // O componente AcoesResumo foi movido para um arquivo separado com 'use client'

  return (
    <div className="container mx-auto p-8">
      <div className="bg-white shadow rounded-lg p-6">
        <h1 className="text-2xl font-bold mb-4">Resumo da NFS-e</h1>
        <div className="mb-4">
          <b>Número:</b> {notaFiscal.numero} / <b>Série:</b> {notaFiscal.serie} <br />
          <b>Prestador:</b> {notaFiscal.prestador?.razaoSocial} <br />
          <b>Tomador:</b> {notaFiscal.tomador?.razaoSocial} <br />
          <b>Valor:</b> {notaFiscal.valorServicos?.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} <br />
          <b>Status:</b> {notaFiscal.status === '1' ? 'Normal' : (notaFiscal.status === '2' ? 'Cancelada' : 'Erro')}<br />
          <b>Protocolo:</b> {notaFiscal.protocolo || '-'}
        </div>
        {/* Ações de transmissão ou salvar */}
        <AcoesResumo id={notaFiscal.id} transmitida={!!notaFiscal.protocolo} protocolo={notaFiscal.protocolo ?? undefined} />
      </div>
    </div>
  );
}
