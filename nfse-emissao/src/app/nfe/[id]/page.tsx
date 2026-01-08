import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import NfeFormWrapper from './NfeFormWrapper';
import { cookies } from 'next/headers';
import { verifyJwt } from '@/services/authService';

export type Nfe = {
  id: string;
  numero: number;
  serie: number;
  cnpjCliente: string;
  nomeCliente?: string | null;
  dataEmissao: string;
  valorTotal: number;
  status: string;
  protocolo?: string | null;
  chaveAcesso?: string | null;
  danfeImpresso: boolean;
};

export default async function NfeFormPage({ params }: { params: { id: string } }) {
  const routeParams = await Promise.resolve(params);
  const isNew = routeParams.id === 'novo';
  const nfe = !isNew ? await prisma.nfe.findUnique({ where: { id: routeParams.id }, include: { itens: true, pagamentos: true } }) as unknown as Nfe | null : null;

  // Para nova NFe: calcula próximo número por série.
  // Se não houver NFe anterior, usar dados do prestador logado (nfeSerie, numeroNfeAtual) para iniciar a contagem.
  let defaultSerie = nfe?.serie ?? 1;
  let nextNumero = 1;
  let defaultAmbiente = 2; // 1 Produção, 2 Homologação
  if (isNew) {
    // 1) tenta obter do banco o maior número pela série default (1)
    const agg = await prisma.nfe.aggregate({ _max: { numero: true }, where: { serie: defaultSerie } });
    const maxNumero = agg._max.numero ?? 0;

    if (maxNumero > 0) {
      nextNumero = maxNumero + 1;
    } else {
      // 2) sem NFe existente: usar dados do prestador logado
      const cookieStore = await cookies();
      const token = cookieStore.get('auth-token')?.value;
      if (token) {
        try {
          const payload = await verifyJwt(token);
          const prestador = await prisma.prestador.findUnique({ where: { id: payload.prestadorId } });
          if (prestador) {
            // prestador.nfeSerie é string no schema; converter para número
            const serieFromPrestador = Number(prestador.nfeSerie || '1') || 1;
            defaultSerie = serieFromPrestador;
            nextNumero = prestador.numeroNfeAtual || 1;
            defaultAmbiente = prestador.nfeAmbiente ?? 2;
          } else {
            nextNumero = 1;
            defaultSerie = 1;
            defaultAmbiente = 2;
          }
        } catch {
          nextNumero = 1;
          defaultSerie = 1;
          defaultAmbiente = 2;
        }
      } else {
        nextNumero = 1;
        defaultSerie = 1;
        defaultAmbiente = 2;
      }
    }
  }

  const def = {
    numero: nfe?.numero ?? nextNumero,
    serie: nfe?.serie ?? defaultSerie,
    ambiente: defaultAmbiente,
    cnpjCliente: nfe?.cnpjCliente ?? '',
    nomeCliente: nfe?.nomeCliente ?? '',
    dataEmissao: nfe?.dataEmissao ? new Date(nfe.dataEmissao).toISOString().slice(0,10) : new Date().toISOString().slice(0,10),
    valorTotal: nfe?.valorTotal ?? 0,
    status: nfe?.status ?? '0',
    protocolo: nfe?.protocolo ?? '',
    chaveAcesso: nfe?.chaveAcesso ?? '',
    danfeImpresso: nfe?.danfeImpresso ?? false,
  };

  return (
    <div className="w-full p-6">
      <NfeFormWrapper isNew={isNew} nfe={nfe} defaultValues={def} />
    </div>
  );
}
