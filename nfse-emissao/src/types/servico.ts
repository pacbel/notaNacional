/**
 * Interface que define um serviço no sistema, com todos os campos necessários
 * para os cálculos tributários conforme a legislação da Prefeitura de Belo Horizonte
 */
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
  
  // Campos tributários obrigatórios
  issRetido: boolean;
  valorDeducoes: number;
  descontoCondicionado: number;
  descontoIncondicionado: number;
  
  // Retenções federais
  valorPis: number;
  valorCofins: number;
  valorInss: number;
  valorIr: number;
  valorCsll: number;
  outrasRetencoes: number;
  
  // Campos calculados
  baseCalculo?: number | null;
  valorIss?: number | null;
  valorLiquido?: number | null;
  
  // Controle
  ativo: boolean;
  createdAt: string | Date;
  updatedAt: string | Date;
}

export interface Aliquota {
  aliquota: number;
}

export interface CodigoTributacao {
  ctiss: string;
  ctissdescricao: string;
  subitem?: string;
  aliquota: number;
  aliquotas?: Aliquota[];
}
