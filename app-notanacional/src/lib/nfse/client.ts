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

function logApiRequest(method: string, url: string, payload?: unknown, params?: unknown) {
  const context: Record<string, unknown> = { url };

  if (params && typeof params === "object") {
    const query = new URLSearchParams();

    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== null) {
        query.set(key, String(value));
      }
    }

    if (query.toString()) {
      context.queryString = query.toString();
    }
  }

  const baseUrl = notaApi.defaults.baseURL ?? "";

  if (baseUrl) {
    context.fullUrl = `${baseUrl}${url}`;
  }

  const authorizationHeader =
    (notaApi.defaults.headers.common?.Authorization ?? notaApi.defaults.headers.common?.authorization) as string | undefined;

  if (authorizationHeader) {
    context.authorizationHeader = authorizationHeader;
  }

  if (payload !== undefined) {
    context.payload = payload;
  }

  console.info(`[NFSe][API] ${method} ${url}`, context);
}

function logApiResponse(method: string, url: string, status: number, data?: unknown) {
  const context: Record<string, unknown> = { url, status };

  if (data !== undefined) {
    context.data = data;
  }

  console.info(`[NFSe][API] ${method} ${url} <- resposta`, context);
}

export async function emitirNfse(payload: EmitirNfseRequest): Promise<EmitirNfseResponse> {
  return withAuthorization(async () => {
    const url = `${NFSE_BASE_PATH}/emitir`;
    logApiRequest("POST", url, payload);

    const response = await notaApi.post<EmitirNfseResponse>(url, payload);

    logApiResponse("POST", url, response.status, response.data);

    return response.data;
  });
}

export async function cancelarNfse(payload: CancelarNfseRequest): Promise<CancelarNfseResponse> {
  return withAuthorization(async () => {
    const url = `${NFSE_BASE_PATH}/cancelar`;
    logApiRequest("POST", url, payload);

    const response = await notaApi.post<CancelarNfseResponse>(url, payload);

    logApiResponse("POST", url, response.status, response.data);

    return response.data;
  });
}

export async function gerarDanfse(
  chaveAcesso: string,
  params: { ambiente?: number; certificateId: string }
): Promise<Buffer> {
  return withAuthorization(async () => {
    const url = `${NFSE_BASE_PATH}/danfse/${encodeURIComponent(chaveAcesso)}`;
    logApiRequest("GET", url, undefined, params);

    const response = await notaApi.get<ArrayBuffer>(url, {
      params,
      responseType: "arraybuffer",
      headers: {
        Accept: "text/plain",
      },
    });

    logApiResponse("GET", url, response.status, {
      byteLength: response.data.byteLength,
    });

    return Buffer.from(response.data);
  });
}

export async function assinarXml(payload: AssinarXmlRequest): Promise<AssinarXmlResponse> {
  return withAuthorization(async () => {
    const url = `${NFSE_BASE_PATH}/assinatura`;
    logApiRequest("POST", url, payload);

    const response = await notaApi.post<AssinarXmlResponse>(url, payload);

    logApiResponse("POST", url, response.status, response.data);

    return response.data;
  });
}

export async function listarCertificados(): Promise<CertificadoDto[]> {
  return withAuthorization(async () => {
    const url = `${NFSE_BASE_PATH}/certificados`;
    logApiRequest("GET", url);

    const response = await notaApi.get<CertificadoDto[]>(url);

    logApiResponse("GET", url, response.status, response.data);

    return response.data;
  });
}
