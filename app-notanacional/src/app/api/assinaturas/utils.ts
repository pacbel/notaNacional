import { Prisma } from "@prisma/client";

export const assinaturaSelect = {
  id: true,
  clienteId: true,
  prestadorId: true,
  servicoId: true,
  intervalo: true,
  descricao: true,
  valor: true,
  vencimentoInicial: true,
  dataFim: true,
  ativo: true,
  createdAt: true,
  updatedAt: true,
  cliente: {
    select: {
      id: true,
      nomeRazaoSocial: true,
      documento: true,
    },
  },
  servico: {
    select: {
      id: true,
      descricao: true,
      valorUnitario: true,
      pTotTribFed: true,
      pTotTribEst: true,
      pTotTribMun: true,
    },
  },
} satisfies Prisma.AssinaturaSelect;

export type AssinaturaEntity = Prisma.AssinaturaGetPayload<{ select: typeof assinaturaSelect }>;

export function serializeAssinatura(assinatura: AssinaturaEntity) {
  return {
    ...assinatura,
    valor: assinatura.valor.toNumber(),
    vencimentoInicial: assinatura.vencimentoInicial.toISOString().split('T')[0],
    dataFim: assinatura.dataFim ? assinatura.dataFim.toISOString().split('T')[0] : null,
    servico: {
      ...assinatura.servico,
      valorUnitario: assinatura.servico.valorUnitario.toNumber(),
      pTotTribFed: assinatura.servico.pTotTribFed?.toNumber() ?? null,
      pTotTribEst: assinatura.servico.pTotTribEst?.toNumber() ?? null,
      pTotTribMun: assinatura.servico.pTotTribMun?.toNumber() ?? null,
    },
    createdAt: assinatura.createdAt.toISOString(),
    updatedAt: assinatura.updatedAt.toISOString(),
  };
}
