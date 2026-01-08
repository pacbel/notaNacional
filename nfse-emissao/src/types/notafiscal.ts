import { Prestador } from './prestador';
import { Tomador } from './tomador';
import { ItemNotaFiscal } from './itemnotafiscal';

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
  dataEmissao: string;
  competencia: string;
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
  xmlEnvio?: string;
  xmlRetorno?: string;
  createdAt: string;
  updatedAt: string;
  prestador?: Prestador;
  tomador?: Tomador;
  itens?: ItemNotaFiscal[];
}

export interface ConsultaMensagemRetorno {
  Codigo: string;
  Mensagem: string;
}

export interface ConsultaListaXML {
  CompNfse: string[];
  MensagemRetorno: ConsultaMensagemRetorno[];
}

// Estendendo ConsultaMensagemRetorno para incluir o XML original como propriedade opcional
export interface ConsultaMensagemRetornoComXML extends ConsultaMensagemRetorno {
  _xml?: string;
}