import { authorizeNotaApi, notaApi } from "@/lib/notanacional-api";

import type {
  AssinarXmlRequest,
  AssinarXmlResponse,
  CancelarNfseRequest,
  CancelarNfseResponse,
  CertificadoDto,
  EmitirNfseRequest,
  EmitirNfseResponse,
} from "./types";

const NFSE_BASE_PATH = "/api/nfse";

async function withAuthorization<T>(callback: () => Promise<T>): Promise<T> {
  await authorizeNotaApi();
  return callback();
}

export async function emitirNfse(payload: EmitirNfseRequest): Promise<EmitirNfseResponse> {
  return withAuthorization(async () => {
    const { data } = await notaApi.post<EmitirNfseResponse>(`${NFSE_BASE_PATH}/emitir`, payload);

    return data;
  });
}

export async function cancelarNfse(payload: CancelarNfseRequest): Promise<CancelarNfseResponse> {
  return withAuthorization(async () => {
    const { data } = await notaApi.post<CancelarNfseResponse>(`${NFSE_BASE_PATH}/cancelar`, payload);

    return data;
  });
}

export async function gerarDanfse(
  chaveAcesso: string,
  params: { ambiente?: number; certificateId: string }
): Promise<Buffer> {
  return withAuthorization(async () => {
    const response = await notaApi.get<ArrayBuffer>(
      `${NFSE_BASE_PATH}/danfse/${encodeURIComponent(chaveAcesso)}`,
      {
        params,
        responseType: "arraybuffer",
      }
    );

    return Buffer.from(response.data);
  });
}

export async function assinarXml(payload: AssinarXmlRequest): Promise<AssinarXmlResponse> {
  return withAuthorization(async () => {
    const { data } = await notaApi.post<AssinarXmlResponse>(`${NFSE_BASE_PATH}/assinatura`, payload);

    return data;
  });
}

export async function listarCertificados(): Promise<CertificadoDto[]> {
  return withAuthorization(async () => {
    const { data } = await notaApi.get<CertificadoDto[]>(`${NFSE_BASE_PATH}/certificados`);

    return data;
  });
}
