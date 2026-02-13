export interface DpsDto {
  id: string;
  prestadorId: string;
  usuarioId: string;
  versao: string;
  identificador: string;
  ambiente: number;
  dataHoraEmissao: string;
  versaoAplicacao: string;
  serie: string;
  numeroDps: string;
  dataCompetencia: string;
  tipoEmissao: number;
  codigoLocalEmissao: string;
  regimeTributario: DpsRegimeTributarioDto;
  tomador: DpsTomadorDto;
  servico: DpsServicoDto;
  valores: DpsValoresDto;
  xmlAssinado: string;
  jsonEntrada: string;
  digestValue?: string | null;
  status: string;
  protocolo?: string | null;
  mensagemErro?: string | null;
  dataEnvio?: string | null;
  dataRetorno?: string | null;
  dataCriacao: string;
  dataAtualizacao?: string | null;
}

export interface DpsRegimeTributarioDto {
  optanteSimplesNacional: number;
  regimeEspecial: number;
}

export interface DpsTomadorDto {
  tipoDocumento: string;
  documento: string;
  nome: string;
  email?: string | null;
  telefone?: string | null;
  endereco: DpsEnderecoDto;
}

export interface DpsEnderecoDto {
  logradouro: string;
  numero: string;
  complemento?: string | null;
  bairro: string;
  codigoMunicipioIbge: string;
  uf?: string | null;
  cep?: string | null;
}

export interface DpsServicoDto {
  codigoLocalPrestacao: string;
  codigoTributacaoNacional: string;
  codigoTributacaoMunicipal: string;
  descricaoServico: string;
  informacoesComplementares?: string | null;
}

export interface DpsValoresDto {
  valorServico: number;
  tributos: DpsTributosDto;
}

export interface DpsTributosDto {
  issRetido: number;
  tipoRetencaoIss: number;
  totais: DpsTributosTotaisDto;
}

export interface DpsTributosTotaisDto {
  federal: number;
  estadual: number;
  municipal: number;
}

export interface CriarDpsRequestDto {
  competencia: string;
  tipoRps: string;
  numeroRps: string;
  prestadorId: string;
  tomadorDocumento: string;
  tomadorNome: string;
  valorServicos: number;
  descricaoServicos: string;
}
