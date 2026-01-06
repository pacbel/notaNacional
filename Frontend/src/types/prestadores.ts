export interface PrestadorDto {
  id: string;
  cnpj: string;
  razaoSocial: string;
  nomeFantasia: string;
  inscricaoMunicipal: string;
  inscricaoEstadual?: string | null;
  cnae?: string | null;
  tipoEmissao: number;
  codigoMunicipioIbge: string;
  optanteSimplesNacional: number;
  regimeEspecialTributario: number;
  telefone?: string | null;
  email?: string | null;
  website?: string | null;
  endereco: PrestadorEnderecoDto;
  dataCriacao: string;
  dataAtualizacao?: string | null;
  certificados?: PrestadorCertificadoDto[];
}

export interface CreatePrestadorDto {
  cnpj: string;
  razaoSocial: string;
  nomeFantasia: string;
  inscricaoMunicipal: string;
  inscricaoEstadual?: string | null;
  cnae?: string | null;
  tipoEmissao: number;
  codigoMunicipioIbge: string;
  optanteSimplesNacional: number;
  regimeEspecialTributario: number;
  telefone?: string | null;
  email?: string | null;
  website?: string | null;
  endereco: PrestadorEnderecoDto;
}

export interface PrestadorEnderecoDto {
  logradouro: string;
  numero: string;
  complemento?: string | null;
  bairro: string;
  cidade?: string | null;
  codigoMunicipioIbge: string;
  uf?: string | null;
  cep?: string | null;
}

export interface UpdatePrestadorDto extends CreatePrestadorDto {
  cnpj: string;
}

export interface PrestadorConfiguracaoDto {
  ambiente: number;
  versaoAplicacao: string;
  seriePadrao: string;
  numeroAtual: number;
  enviaEmailAutomatico: boolean;
  smtpHost?: string | null;
  smtpPort?: number | null;
  smtpSecure: boolean;
  smtpUser?: string | null;
  smtpFrom?: string | null;
  smtpFromName?: string | null;
  dataCriacao?: string | null;
  dataAtualizacao?: string | null;
}

export interface UpsertPrestadorConfiguracaoDto {
  ambiente: number;
  versaoAplicacao: string;
  seriePadrao: string;
  numeroAtual: number;
  enviaEmailAutomatico: boolean;
  smtpHost: string;
  smtpPort: number;
  smtpSecure: boolean;
  smtpUser: string;
  smtpPassword?: string;
  smtpFrom: string;
  smtpFromName: string;
}

export interface PrestadorCertificadoDto {
  id: string;
  alias?: string | null;
  cnpj: string;
  validadeInicio: string;
  validadeFim: string;
  criadoEm: string;
  atualizadoEm?: string | null;
  ativo: boolean;
  prestadorId?: string;
}

export interface PrestadorCertificadoUploadDto {
  alias?: string | null;
  conteudo: string;
  senha: string;
}

export interface PrestadorCertificadoUpdateDto {
  alias?: string | null;
}

export interface PrestadorCertificadoSenhaDto {
  senha: string;
}
