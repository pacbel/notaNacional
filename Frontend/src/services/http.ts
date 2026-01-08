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

  try {
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

      throw new ApiError(response, errorPayload);
    }

    return (await parseResponse(response, parse)) as T;
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
