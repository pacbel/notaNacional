import type { ConfiguracaoDto } from "@/lib/validators/configuracao";

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
  const response = await fetch("/api/configuracoes", {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
    cache: "no-store",
  });

  return handleResponse<ConfiguracaoDto>(response);
}

export async function updateConfiguracao(payload: ConfiguracaoDto): Promise<ConfiguracaoDto> {
  const response = await fetch("/api/configuracoes", {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  return handleResponse<ConfiguracaoDto>(response);
}
