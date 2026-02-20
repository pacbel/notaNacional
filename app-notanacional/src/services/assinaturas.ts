import { fetchWithAuth } from "@/lib/fetch-with-auth";
import type { AssinaturaCreateInput, AssinaturaUpdateInput } from "@/lib/validators/assinatura";

export type AssinaturaStatusFilter = "ativos" | "inativos" | "todos";

export interface AssinaturaDto {
  id: string;
  clienteId: string;
  prestadorId: string;
  servicoId: string;
  intervalo: "SEMANAL" | "QUINZENAL" | "MENSAL" | "BIMESTRAL" | "TRIMESTRAL" | "SEMESTRAL" | "ANUAL";
  descricao: string;
  valor: number;
  vencimentoInicial: string;
  dataFim: string | null;
  ativo: boolean;
  createdAt: string;
  updatedAt: string;
  cliente: {
    id: string;
    nomeRazaoSocial: string;
    documento: string | null;
  };
  servico: {
    id: string;
    descricao: string;
    valorUnitario: number;
    pTotTribFed: number | null;
    pTotTribEst: number | null;
    pTotTribMun: number | null;
  };
}

export interface AssinaturasListResponse {
  data: AssinaturaDto[];
  total: number;
  page: number;
  perPage: number;
}

interface ListAssinaturasParams {
  page?: number;
  perPage?: number;
  search?: string;
  status?: AssinaturaStatusFilter;
  clienteId?: string;
  dataInicio?: string;
  dataFim?: string;
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

export async function listAssinaturas({
  page = 1,
  perPage = 10,
  search = "",
  status = "ativos",
  clienteId,
  dataInicio,
  dataFim,
}: ListAssinaturasParams = {}): Promise<AssinaturasListResponse> {
  const params = new URLSearchParams();
  params.set("page", String(page));
  params.set("perPage", String(perPage));
  params.set("status", status);

  if (search) {
    params.set("search", search);
  }
  if (clienteId) {
    params.set("clienteId", clienteId);
  }
  if (dataInicio) {
    params.set("dataInicio", dataInicio);
  }
  if (dataFim) {
    params.set("dataFim", dataFim);
  }

  const response = await fetchWithAuth(`/api/assinaturas?${params.toString()}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
    cache: "no-store",
  });

  return handleResponse<AssinaturasListResponse>(response);
}

export async function createAssinatura(input: AssinaturaCreateInput): Promise<AssinaturaDto> {
  const response = await fetchWithAuth(`/api/assinaturas`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(input),
  });

  return handleResponse<AssinaturaDto>(response);
}

export async function updateAssinatura(id: string, input: AssinaturaUpdateInput): Promise<AssinaturaDto> {
  const response = await fetchWithAuth(`/api/assinaturas/${id}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(input),
  });

  return handleResponse<AssinaturaDto>(response);
}

export async function inactivateAssinatura(id: string): Promise<AssinaturaDto> {
  const response = await fetchWithAuth(`/api/assinaturas/${id}`, {
    method: "DELETE",
  });

  return handleResponse<AssinaturaDto>(response);
}

export async function reactivateAssinatura(id: string): Promise<AssinaturaDto> {
  const response = await fetchWithAuth(`/api/assinaturas/${id}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ ativo: true }),
  });

  return handleResponse<AssinaturaDto>(response);
}
