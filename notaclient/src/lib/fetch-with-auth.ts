/**
 * Utilitário para fazer requisições HTTP com renovação automática de token em caso de 401
 */

interface FetchWithAuthOptions extends RequestInit {
  skipAuthRetry?: boolean;
}

let isRefreshing = false;
let refreshPromise: Promise<boolean> | null = null;

/**
 * Tenta renovar a sessão do usuário
 */
async function refreshSession(): Promise<boolean> {
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

      // Se falhar ao renovar, redireciona para login
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

  // Primeira tentativa
  let response = await fetch(url, {
    ...fetchOptions,
    credentials: "include",
  });

  // Se recebeu 401 e não deve pular o retry
  if (response.status === 401 && !skipAuthRetry) {
    console.log("[fetchWithAuth] Recebeu 401, tentando renovar sessão...");

    const refreshed = await refreshSession();

    if (refreshed) {
      console.log("[fetchWithAuth] Sessão renovada, repetindo requisição...");
      // Tenta novamente após renovar
      response = await fetch(url, {
        ...fetchOptions,
        credentials: "include",
      });
    }
  }

  return response;
}
