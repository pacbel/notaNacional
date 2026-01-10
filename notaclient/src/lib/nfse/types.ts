export interface EmitirNfseRequest {
  xmlAssinado: string;
  ambiente: number;
  certificateId: string;
}

export interface EmitirNfseResponse {
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

export interface CancelarNfseRequest {
  chaveAcesso: string;
  eventoXmlGZipBase64: string;
  ambiente: number;
  certificateId: string;
}

export interface CancelarNfseResponse {
  statusCode: number;
  contentType?: string;
  content?: string;
}

export interface AssinarXmlRequest {
  prestadorId: string;
  xml: string;
  tag: string;
  certificateId: string;
}

export type AssinarXmlResponse = string;

export interface CertificadoDto {
  id: string;
  nome?: string;
  apelido?: string;
  cnpj?: string;
  numeroSerie?: string;
  tipo?: string;
  validadeInicio?: string;
  validadeFim?: string;
}
