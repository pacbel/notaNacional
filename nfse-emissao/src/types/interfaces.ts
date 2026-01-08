import type { Prestador } from './prestador';

export interface Tomador {
  id: string;
  cpfCnpj: string;
  tipo: string;
  razaoSocial: string;
  inscricaoMunicipal?: string;
  inscricaoEstadual?: string;
  email: string;
  telefone: string;
  endereco: string;
  numero: string;
  complemento?: string;
  bairro: string;
  codigoMunicipio: string;
  uf: string;
  cep: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Servico {
  id: string;
  descricao: string;
  codigoCnae?: string;
  codigoNbs?: string;
  unidade?: string;
  valorUnitario: number;
  codigoMunicipio?: string;
  codigoPais?: string;
  codigoServico?: string;
  issRetido: boolean;
  outrasRetencoes: number;
  descontoCondicionado: number;
  descontoIncondicionado: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface NotaFiscal {
  id: string;
  numero: string;
  serie: string;
  tipo: string;
  status: string;
  ambiente: number;
  naturezaOperacao: number;
  optanteSimplesNacional: boolean;
  incentivadorCultural: boolean;
  statusNfse?: string;
  codigoVerificacao?: string;
  dataEmissao: Date;
  competencia: Date;
  prestadorId: string;
  tomadorId: string;
  valorServicos: number;
  valorDeducoes: number;
  valorPis: number;
  valorCofins: number;
  valorInss: number;
  valorIr: number;
  valorCsll: number;
  outrasRetencoes: number;
  valorLiquidoNfse: number;
  discriminacao: string;
  codigoCancelamento?: string;
  motivoCancelamento?: string;
  nfseSubstituidaId?: string;
  protocolo?: string;
  xmlEnvio?: string;
  xmlRetorno?: string;
  createdAt: Date;
  updatedAt: Date;
  prestador: Prestador;
  tomador: Tomador;
  itens: ItemNotaFiscal[];
}

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
  createdAt: Date;
  updatedAt: Date;
  notaFiscal: NotaFiscal;
  servico: Servico;
}
