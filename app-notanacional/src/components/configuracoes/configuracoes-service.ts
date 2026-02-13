import type { ConfiguracaoDto, ConfiguracaoFormValues } from "@/lib/validators/configuracao";
import { fetchWithAuth } from "@/lib/fetch-with-auth";

const CONFIG_LOG_PREFIX = "[ConfiguracoesService]";

function logRequest(method: string, url: string, extra?: Record<string, unknown>) {
  const timestamp = new Date().toISOString();
  if (extra) {
    console.info(`${CONFIG_LOG_PREFIX} ${method} ${url} - ${timestamp}`, extra);
    return;
  }

  console.info(`${CONFIG_LOG_PREFIX} ${method} ${url} - ${timestamp}`);
}

function logResponse(method: string, url: string, response: Response) {
  const timestamp = new Date().toISOString();
  const message = `${CONFIG_LOG_PREFIX} ${method} ${url} <- status ${response.status} - ${timestamp}`;

  if (response.ok) {
    console.info(message);
    return;
  }

  console.warn(`${message} (erro)`);
}

function sanitizeRobotPayload(payload: ConfiguracaoFormValues) {
  return {
    hasRobotClientId: Boolean(payload.robotClientId),
    hasRobotClientSecret: Boolean(payload.robotClientSecret),
    robotTokenCacheMinutos: payload.robotTokenCacheMinutos,
  } satisfies Record<string, unknown>;
}

interface ApiErrorResponse {
  message?: string;
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    let errorMessage = "Erro inesperado";

    try {
      const data = (await response.json()) as ApiErrorResponse;
      errorMessage = data.message ?? errorMessage;
    } catch {
      // ignora erro de parse
    }

    throw new Error(errorMessage);
  }

  return (await response.json()) as T;
}

export async function getConfiguracao(): Promise<ConfiguracaoDto> {
  const endpoint = "/api/configuracoes";
  logRequest("GET", endpoint);

  const response = await fetchWithAuth(endpoint, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
    cache: "no-store",
  });

  logResponse("GET", endpoint, response);

  try {
    const data = await handleResponse<ConfiguracaoDto>(response);
    console.info(`${CONFIG_LOG_PREFIX} GET ${endpoint} -> payload recebido`, {
      possuiRobotClientId: Boolean(data.robotClientId),
      possuiRobotClientSecret: Boolean(data.robotClientSecret),
      robotTokenCacheMinutos: data.robotTokenCacheMinutos,
    });
    return data;
  } catch (error) {
    console.error(`${CONFIG_LOG_PREFIX} Falha ao processar resposta GET ${endpoint}`, error);
    throw error;
  }
}

export async function updateConfiguracao(payload: ConfiguracaoFormValues): Promise<ConfiguracaoDto> {
  const endpoint = "/api/configuracoes";
  logRequest("PUT", endpoint, {
    robot: sanitizeRobotPayload(payload),
    camposEnviados: Object.keys(payload),
  });

  const response = await fetchWithAuth(endpoint, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  logResponse("PUT", endpoint, response);

  try {
    const data = await handleResponse<ConfiguracaoDto>(response);
    console.info(`${CONFIG_LOG_PREFIX} PUT ${endpoint} -> atualização concluída`, {
      possuiRobotClientId: Boolean(data.robotClientId),
      possuiRobotClientSecret: Boolean(data.robotClientSecret),
      robotTokenCacheMinutos: data.robotTokenCacheMinutos,
    });
    return data;
  } catch (error) {
    console.error(`${CONFIG_LOG_PREFIX} Falha ao processar resposta PUT ${endpoint}`, error);
    throw error;
  }
}
