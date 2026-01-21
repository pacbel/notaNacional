import { Prisma, type TipoDocumento } from "@prisma/client";

export interface PartyBase {
  cnpj: string;
  codigoMunicipio: string;
  inscricaoMunicipal?: string | null;
  telefone?: string | null;
  email?: string | null;
}

export interface TomadorBase {
  tipoTomador?: TomadorTipo;
  tipoDocumento?: TipoDocumento | "CPF" | "CNPJ" | null;
  documento?: string | null;
  nomeRazaoSocial: string;
  codigoMunicipio?: string | null;
  logradouro?: string | null;
  numero?: string | null;
  bairro?: string | null;
  complemento?: string | null;
  cep?: string | null;
  telefone?: string | null;
  email?: string | null;
  codigoPais?: string | null;
  codigoPostalExterior?: string | null;
  cidadeExterior?: string | null;
  estadoExterior?: string | null;
}

export interface ServicoBase {
  descricao: string;
  valorUnitario: Prisma.Decimal | number;
  codigoTributacaoMunicipal: string;
  codigoTributacaoNacional: string;
  codigoNbs?: string | null;
  aliquotaIss?: Prisma.Decimal | number | null;
  pTotTribFed?: Prisma.Decimal | number | null;
  pTotTribEst?: Prisma.Decimal | number | null;
  pTotTribMun?: Prisma.Decimal | number | null;
  tipoServico?: "NORMAL" | "EXPORTACAO" | "CONSTRUCAO";
  exportacao?: {
    paisDestino?: string | null;
    justificativa?: string | null;
  } | null;
  construcao?: {
    codigoObra?: string | null;
    codigoArt?: string | null;
  } | null;
}

export interface ConfiguracaoBase {
  ambGer: number | null;
  tpAmb: number | null;
  verAplic: string;
  tpEmis: number;
  opSimpNac: number | null;
  regEspTrib: number | null;
  tribISSQN: number;
  tpImunidade: number | null;
  tpRetISSQN: number;
  xLocPrestacao: string;
  pTotTribFed: number | null;
  pTotTribEst: number | null;
  pTotTribMun: number | null;
}

export interface GenerateDpsXmlInput {
  identificador: string;
  numero: number;
  serie: number;
  competencia: Date;
  emissao: Date;
  prestador: PartyBase;
  tomador: TomadorBase;
  servico: ServicoBase;
  configuracao: ConfiguracaoBase;
  observacoes?: string | null;
}

export type TomadorTipo = "NACIONAL" | "ESTRANGEIRO" | "ANONIMO";
export type ServicoTipo = "NORMAL" | "EXPORTACAO" | "CONSTRUCAO";
export type TributacaoTipo = "NORMAL" | "SIMPLES" | "RETIDA" | "IMUNE";

export interface DpsContext {
  readonly input: GenerateDpsXmlInput;
  readonly tpAmb: string;
  readonly serieParaTag: string;
  readonly numeroParaTag: string;
  readonly infDpsId: string;
  readonly competenciaData: string;
  readonly dataEmissao: string;
  readonly prestadorCnpj: string;
  readonly inscricaoMunicipalPrestador: string | null;
  readonly telefonePrestador: string | null;
  readonly opSimpNac: string;
  readonly regEspTrib: string;
  readonly tomadorTipo: TomadorTipo;
  readonly tomadorDocumentoTag: "CPF" | "CNPJ" | "idEstrangeiro" | null;
  readonly tomadorDocumento: string | null;
  readonly tomadorTelefone: string | null;
  readonly tomadorCep: string | null;
  readonly tomadorCodigoMunicipio: string | null;
  readonly valorServico: string;
  readonly valorIssqn: string | null;
  readonly aliquotaIss: string | null;
  readonly shouldInformAliquota: boolean;
  readonly shouldInformImunidade: boolean;
  readonly tpImunidade: string | null;
  readonly tribIssqn: string;
  readonly tpRetIssqn: string;
  readonly serviceDescription: string;
  readonly informacoesComplementares: string | null;
  readonly codigoNbs: string;
  readonly codigoTributacaoNacional: string;
  readonly servicoTipo: ServicoTipo;
  readonly tributacaoTipo: TributacaoTipo;
  readonly codigoMunicipioEmissao: string;
  readonly codigoMunicipioPrestacao: string;
}
