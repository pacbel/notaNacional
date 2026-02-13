export interface CertificateInfo {
  id: string;
  commonName: string;
  cnpj: string;
  subject: string;
  issuer: string;
  notBefore: string;
  notAfter: string;
  hasPrivateKey: boolean;
  storeLocation: string;
}

export interface NotaEmitidaDto {
  prestadorId: string;
  prestadorNome: string;
  chaveAcesso: string;
  numero?: string;
  situacao: string;
  emitidaEm?: string;
}

export interface ListarNotasEmitidasRequest {
  prestadorId?: string;
  chaveAcesso?: string;
  numero?: string;
  page: number;
  pageSize: number;
}

export interface ListarNotasEmitidasResponse {
  items: NotaEmitidaDto[];
  total: number;
}

export interface NfseEmailAttachment {
  fileName: string;
  contentBase64: string;
  contentType: string;
}

export interface EnviarNfseEmailRequest {
  destinatarios: string[];
  assunto: string;
  corpoHtml: string;
  anexos?: NfseEmailAttachment[];
}
