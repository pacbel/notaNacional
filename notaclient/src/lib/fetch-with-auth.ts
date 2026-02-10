/**
 * Utilitário para fazer requisições HTTP com renovação automática de token em caso de 401
 */

if (typeof window === "undefined" && process.env.ALLOW_INSECURE_SSL === "1") {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

  const originalEmitWarning = process.emitWarning.bind(process);

  process.emitWarning = ((warning: unknown, ...args: unknown[]) => {
    const message =
      typeof warning === "string"
        ? warning
        : warning instanceof Error
          ? warning.message
          : undefined;

    if (message && message.includes("NODE_TLS_REJECT_UNAUTHORIZED")) {
      return;
    }

    return originalEmitWarning(warning as any, ...(args as []));
  }) as typeof process.emitWarning;
}

interface FetchWithAuthOptions extends RequestInit {
  skipAuthRetry?: boolean;
}

let isRefreshing = false;
let refreshPromise: Promise<boolean> | null = null;

/**
 * Tenta renovar a sessão do usuário
 */
async function refreshSession(): Promise<boolean> {
  if (typeof window === "undefined") {
    return false;
  }

  if (isRefreshing && refreshPromise) {
    return refreshPromise;
  }

  isRefreshing = true;
  refreshPromise = (async () => {
    try {
      const response = await fetch("/api/auth/refresh", {
        method: "POST",
        credentials: "include",
      });

      if (response.ok) {
        return true;
      }

      window.location.href = "/";
      return false;
    } catch (error) {
      console.error("[fetchWithAuth] Erro ao renovar sessão:", error);
      window.location.href = "/";
      return false;
    } finally {
      isRefreshing = false;
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

/**
 * Faz uma requisição HTTP com retry automático em caso de 401
 */
export async function fetchWithAuth(
  url: string,
  options: FetchWithAuthOptions = {}
): Promise<Response> {
  const { skipAuthRetry, ...fetchOptions } = options;

  const requestInit: RequestInit = {
    ...fetchOptions,
  };

  if (typeof window !== "undefined") {
    requestInit.credentials = "include";
  }

  const response = await fetch(url, requestInit);

  if (response.status === 401 && !skipAuthRetry && typeof window !== "undefined") {
    console.warn("[fetchWithAuth] Recebeu 401, tentando renovar sessão...");

    const refreshed = await refreshSession();

    if (refreshed) {
      const retryResponse = await fetch(url, requestInit);
      return retryResponse;
    }
  }

  return response;
}
