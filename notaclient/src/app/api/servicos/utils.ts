import { Prisma } from "@prisma/client";

export const servicoSelect = {
  id: true,
  descricao: true,
  codigoTributacaoMunicipal: true,
  codigoTributacaoNacional: true,
  codigoNbs: true,
  valorUnitario: true,
  aliquotaIss: true,
  issRetido: true,
  ativo: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.ServicoSelect;

export type ServicoEntity = Prisma.ServicoGetPayload<{ select: typeof servicoSelect }>;

export function serializeServico(servico: ServicoEntity) {
  return {
    ...servico,
    valorUnitario: servico.valorUnitario.toNumber(),
    aliquotaIss: servico.aliquotaIss?.toNumber() ?? null,
    createdAt: servico.createdAt.toISOString(),
    updatedAt: servico.updatedAt.toISOString(),
  };
}
