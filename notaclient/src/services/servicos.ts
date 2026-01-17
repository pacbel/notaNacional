import type { ServicoCreateInput, ServicoUpdateInput } from "@/lib/validators/servico";

export type ServicoStatusFilter = "ativos" | "inativos" | "todos";

export interface ServicoDto {
  id: string;
  descricao: string;
  codigoTributacaoMunicipal: string;
  codigoTributacaoNacional: string;
  codigoNbs: string | null;
  valorUnitario: number;
  aliquotaIss: number | null;
  issRetido: boolean;
  ativo: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ServicosListResponse {
  data: ServicoDto[];
  total: number;
  page: number;
  perPage: number;
}

interface ListServicosParams {
  page?: number;
  perPage?: number;
  search?: string;
  status?: ServicoStatusFilter;
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
      // erro de parse ignorado
    }

    throw new Error(errorMessage);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

export async function listServicos({
  page = 1,
  perPage = 10,
  search = "",
  status = "ativos",
}: ListServicosParams = {}): Promise<ServicosListResponse> {
  const params = new URLSearchParams();
  params.set("page", String(page));
  params.set("perPage", String(perPage));
  params.set("status", status);

  if (search) {
    params.set("search", search);
  }

  const response = await fetch(`/api/servicos?${params.toString()}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
    cache: "no-store",
  });

  return handleResponse<ServicosListResponse>(response);
}

export async function createServico(input: ServicoCreateInput): Promise<ServicoDto> {
  const response = await fetch(`/api/servicos`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(input),
  });

  return handleResponse<ServicoDto>(response);
}

export async function updateServico(id: string, input: ServicoUpdateInput): Promise<ServicoDto> {
  const response = await fetch(`/api/servicos/${id}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(input),
  });

  return handleResponse<ServicoDto>(response);
}

export async function inactivateServico(id: string): Promise<ServicoDto> {
  const response = await fetch(`/api/servicos/${id}`, {
    method: "DELETE",
  });

  return handleResponse<ServicoDto>(response);
}

export async function reactivateServico(id: string): Promise<ServicoDto> {
  const response = await fetch(`/api/servicos/${id}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ ativo: true }),
  });

  return handleResponse<ServicoDto>(response);
}
