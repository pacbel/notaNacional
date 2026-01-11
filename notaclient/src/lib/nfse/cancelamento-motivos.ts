export const CANCELAMENTO_MOTIVO_CODES = ["1", "2", "3", "4"] as const;

export type CancelamentoMotivoCodigo = (typeof CANCELAMENTO_MOTIVO_CODES)[number];

export interface CancelamentoMotivo {
  codigo: CancelamentoMotivoCodigo;
  descricao: string;
}

export const CANCELAMENTO_MOTIVOS: readonly CancelamentoMotivo[] = [
  { codigo: "1", descricao: "Erro na emissão da nota" },
  { codigo: "2", descricao: "Serviço não prestado" },
  { codigo: "3", descricao: "Cancelamento por determinação da prefeitura" },
  { codigo: "4", descricao: "Duplicidade na emissão" },
];

export function findCancelamentoMotivo(codigo: string): CancelamentoMotivo | undefined {
  return CANCELAMENTO_MOTIVOS.find((motivo) => motivo.codigo === codigo);
}
