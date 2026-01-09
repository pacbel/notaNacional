import type { Prestador } from "@prisma/client";

import type {
  PrestadorCreateInput,
  PrestadorUpdateInput,
} from "@/lib/validators/prestador";

export type PrestadorDto = Omit<Prestador, "createdAt" | "updatedAt"> & {
  createdAt: string;
  updatedAt: string;
};

export interface PrestadoresListResponse {
  data: PrestadorDto[];
  total: number;
  page: number;
  perPage: number;
}

export type PrestadorStatusFilter = "ativos" | "inativos" | "todos";

interface ListPrestadoresParams {
  page?: number;
  perPage?: number;
  search?: string;
  status?: PrestadorStatusFilter;
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const data = await response.json().catch(() => null);
    const message = data?.message ?? "Erro inesperado";
    throw new Error(message);
  }

  return (await response.json()) as T;
}

export async function listPrestadores({
  page = 1,
  perPage = 10,
  search = "",
  status = "ativos",
}: ListPrestadoresParams = {}): Promise<PrestadoresListResponse> {
  const params = new URLSearchParams();
  params.set("page", String(page));
  params.set("perPage", String(perPage));
  params.set("status", status);
  if (search) {
    params.set("q", search);
  }

  const response = await fetch(`/api/prestadores?${params.toString()}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
    cache: "no-store",
  });

  return handleResponse<PrestadoresListResponse>(response);
}

export async function createPrestador(input: PrestadorCreateInput): Promise<PrestadorDto> {
  const response = await fetch(`/api/prestadores`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(input),
  });

  return handleResponse<PrestadorDto>(response);
}

export async function updatePrestador(
  id: string,
  input: PrestadorUpdateInput
): Promise<PrestadorDto> {
  const response = await fetch(`/api/prestadores/${id}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(input),
  });

  return handleResponse<PrestadorDto>(response);
}

export async function inactivatePrestador(id: string): Promise<PrestadorDto> {
  const response = await fetch(`/api/prestadores/${id}`, {
    method: "DELETE",
  });

  return handleResponse<PrestadorDto>(response);
}

export async function reactivatePrestador(id: string): Promise<PrestadorDto> {
  const response = await fetch(`/api/prestadores/${id}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ ativo: true }),
  });

  return handleResponse<PrestadorDto>(response);
}
