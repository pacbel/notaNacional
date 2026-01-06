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

export interface EmitirNfseRequestDto {
  xmlAssinado: string;
  certificateId: string;
  ambiente: number;
}

export interface EmitirNfseResponseDto {
  nfseBase64Gzip?: string;
  xmlNfse?: string;
  chaveAcesso?: string;
  numero?: string;
  codigoVerificacao?: string;
  urlNfse?: string;
  statusCode: number;
  rawResponseContentType?: string;
  rawResponseContent?: string;
}

export interface CancelarNfseRequestDto {
  chaveAcesso?: string | null;
  eventoXmlGZipBase64?: string | null;
  certificateId: string;
  ambiente: number;
}

export interface CancelarNfseResponseDto {
  statusCode: number;
  contentType?: string | null;
  content?: string | null;
}
