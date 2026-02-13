import { appConfig, buildApiUrl } from "@/lib/config";

interface ApiFetchOptions extends RequestInit {
  parse?: "json" | "text" | "blob" | "raw";
  retryOnUnauthorized?: boolean;
  authorizationToken?: string | null;
  useSessionToken?: boolean;
}

interface AuthHandlers {
  getAccessToken: () => string | null;
  getRefreshToken: () => string | null;
  refreshTokens: () => Promise<boolean>;
  logout: () => void;
}

interface LoadingHandlers {
  onStart: () => void;
  onEnd: () => void;
}

let authHandlers: AuthHandlers | null = null;
let loadingHandlers: LoadingHandlers | null = null;

export function registerAuthHandlers(handlers: AuthHandlers) {
  authHandlers = handlers;
}

export function registerLoadingHandlers(handlers: LoadingHandlers | null) {
  loadingHandlers = handlers;
}

async function parseResponse(
  response: Response,
  mode: ApiFetchOptions["parse"]
) {
  if (mode === "raw") {
    return response;
  }

  if (mode === "blob") {
    return response.blob();
  }

  if (mode === "text") {
    return response.text();
  }

  const contentType = response.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) {
    return response.json();
  }

  return response.text();
}

export async function apiFetch<T = unknown>(
  path: string,
  options: ApiFetchOptions = {}
): Promise<T> {
  loadingHandlers?.onStart();

  const url = path.startsWith("http") ? path : buildApiUrl(path);
  const {
    parse = "json",
    retryOnUnauthorized = true,
    authorizationToken,
    useSessionToken = true,
    ...init
  } = options;
  const headers = new Headers(init.headers);

  if (!headers.has("Content-Type") && init.body && !(init.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }

  if (!headers.has("Accept")) {
    headers.set("Accept", "application/json");
  }

  if (authorizationToken) {
    headers.set("Authorization", `Bearer ${authorizationToken}`);
  }

  if (!headers.has("Authorization") && useSessionToken) {
    const token = authHandlers?.getAccessToken();
    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }
  }

  const logRequest = () => {
    const sanitizedHeaders: Record<string, string> = {};
    headers.forEach((value, key) => {
      if (key.toLowerCase() === "authorization") {
        sanitizedHeaders[key] = value ? "***" : "";
      } else {
        sanitizedHeaders[key] = value;
      }
    });

    console.info("[HTTP] Enviando requisição", {
      url,
      method: init.method ?? "GET",
      hasAuthorization: headers.has("Authorization"),
      headers: sanitizedHeaders,
    });
  };

  try {
    logRequest();
    const response = await fetch(url, {
      ...init,
      headers,
    });

    if (response.status === 401 && retryOnUnauthorized && authHandlers) {
      const refreshed = await authHandlers.refreshTokens();
      if (refreshed) {
        return await apiFetch(path, { ...options, retryOnUnauthorized: false });
      }

      authHandlers.logout();
    }

    if (!response.ok) {
      let errorPayload: unknown;
      try {
        errorPayload = await parseResponse(response, "json");
      } catch (error) {
        errorPayload = await response.text();
      }

      console.error("[HTTP] Resposta não OK", {
        url,
        status: response.status,
        statusText: response.statusText,
        payload: errorPayload,
      });

      throw new ApiError(response, errorPayload);
    }

    return (await parseResponse(response, parse)) as T;
  } catch (error) {
    const isNetworkError =
      error instanceof TypeError ||
      (error instanceof DOMException && error.name === "AbortError");

    if (isNetworkError) {
      const networkResponse = new Response(null, {
        status: 503,
        statusText: "Service Unavailable",
      });

      console.error("[HTTP] Falha de rede ao consultar API", {
        url,
        method: init.method ?? "GET",
        hasAuthorization: headers.has("Authorization"),
        motivo: error instanceof Error ? error.message : error,
      });

      throw new ApiError(networkResponse, {
        mensagem: "Não foi possível conectar ao servidor. Verifique sua conexão ou se a API está disponível.",
      });
    }

    console.error("[HTTP] Erro inesperado ao consultar API", {
      url,
      method: init.method ?? "GET",
      hasAuthorization: headers.has("Authorization"),
      erro: error,
    });

    throw error;
  } finally {
    loadingHandlers?.onEnd();
  }
}

export class ApiError<T = unknown> extends Error {
  public readonly status: number;
  public readonly payload: T;

  constructor(response: Response, payload: T) {
    const message =
      typeof payload === "string"
        ? payload
        : payload && typeof payload === "object" && "mensagem" in payload
          ? String((payload as { mensagem: unknown }).mensagem)
          : response.statusText || "Erro desconhecido";

    super(message);
    this.name = "ApiError";
    this.status = response.status;
    this.payload = payload;
  }
}

export function getApiBaseUrl() {
  return appConfig.apiBaseUrl;
}
