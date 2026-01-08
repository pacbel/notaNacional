import { Servico } from './servico';

export interface ItemNotaFiscal {
  id: string;
  notaFiscalId: string;
  servicoId: string;
  quantidade: number;
  valorUnitario: number;
  valorTotal: number;
  desconto: number;
  tributavel: boolean;
  codigoTributacao?: string;
  discriminacao: string;
  createdAt: string;
  updatedAt: string;
  servico?: Servico;
}
