export interface PrestadorDto {
  id: string;
  cnpj: string;
  razaoSocial: string;
  nomeFantasia: string;
  inscricaoMunicipal: string;
  inscricaoEstadual?: string | null;
  cnae?: string | null;
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
  versaoAplicacao: string;
  enviaEmailAutomatico: boolean;
  smtpHost?: string | null;
  smtpPort?: number | null;
  smtpSecure: boolean;
  smtpUser?: string | null;
  smtpPassword?: string | null;
  smtpPasswordEncrypted?: string | null;
  smtpFrom?: string | null;
  smtpFromName?: string | null;
  creditoMensalPadrao?: number | null;
  saldoNotasDisponiveis?: number | null;
  competenciaSaldo?: string | null;
  bilhetagemHabilitada?: boolean | null;
  dataCriacao?: string | null;
  dataAtualizacao?: string | null;
}

export interface UpsertPrestadorConfiguracaoDto {
  versaoAplicacao: string;
  enviaEmailAutomatico: boolean;
  smtpHost: string;
  smtpPort: number;
  smtpSecure: boolean;
  smtpUser: string;
  smtpPassword?: string;
  smtpPasswordEncrypted?: string | null;
  smtpFrom: string;
  smtpFromName: string;
  bilhetagemHabilitada: boolean;
  creditoMensalPadrao?: number | null;
  saldoNotasDisponiveis?: number | null;
  competenciaSaldo?: string | null;
}

export interface PrestadorCertificadoDto {
  id: string;
  alias?: string | null;
  cnpj: string;
  validadeInicio?: string | null;
  validadeFim?: string | null;
  notBefore?: string | null;
  notAfter?: string | null;
  dataEnvio?: string | null;
  thumbprint?: string | null;
  tamanhoBytes?: number | null;
  criadoEm?: string | null;
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

export interface BilhetagemSaldoDto {
  bilhetagemHabilitada: boolean;
  creditoMensalPadrao?: number | null;
  saldoNotasDisponiveis: number;
  competenciaSaldo?: string | null;
}

export interface BilhetagemLancamentoDto {
  id: string;
  dataCriacao: string;
  dataAtualizacao?: string | null;
  quantidade: number;
  saldoAnterior: number;
  saldoPosterior: number;
  observacao?: string | null;
  usuarioResponsavelId: string;
}

export interface AdicionarCreditoBilhetagemRequestDto {
  quantidade: number;
  observacao?: string | null;
}
