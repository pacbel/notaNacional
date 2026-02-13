import type {
  TomadorCreateInput,
  TomadorUpdateInput,
} from "@/lib/validators/tomador";
import { fetchWithAuth } from "@/lib/fetch-with-auth";

export interface TomadorDto {
  id: string;
  tipoTomador: "NACIONAL" | "ESTRANGEIRO" | "ANONIMO";
  tipoDocumento: "CPF" | "CNPJ" | null;
  documento: string | null;
  nomeRazaoSocial: string;
  email: string;
  telefone: string | null;
  inscricaoMunicipal: string | null;
  codigoMunicipio: string | null;
  cidade: string | null;
  estado: string | null;
  cep: string | null;
  logradouro: string | null;
  numero: string | null;
  complemento: string | null;
  bairro: string | null;
  codigoPais: string | null;
  codigoPostalExterior: string | null;
  cidadeExterior: string | null;
  estadoExterior: string | null;
  ativo: boolean;
  prestadorId: string;
  createdAt: string;
  updatedAt: string;
}

export interface TomadoresListResponse {
  data: TomadorDto[];
  total: number;
  page: number;
  perPage: number;
}

export type TomadorStatusFilter = "ativos" | "inativos" | "todos";

interface ListTomadoresParams {
  page?: number;
  perPage?: number;
  search?: string;
  status?: TomadorStatusFilter;
  documento?: string;
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const data = await response.json().catch(() => null);
    const message = data?.message ?? "Erro inesperado";
    throw new Error(message);
  }

  return (await response.json()) as T;
}

export async function listTomadores({
  page = 1,
  perPage = 10,
  search = "",
  status = "ativos",
  documento = "",
}: ListTomadoresParams = {}): Promise<TomadoresListResponse> {
  const params = new URLSearchParams();
  params.set("page", String(page));
  params.set("perPage", String(perPage));
  params.set("status", status);
  if (search) {
    params.set("q", search);
  }
  if (documento) {
    params.set("documento", documento);
  }

  const response = await fetchWithAuth(`/api/tomadores?${params.toString()}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
    cache: "no-store",
  });

  return handleResponse<TomadoresListResponse>(response);
}

export async function createTomador(input: TomadorCreateInput): Promise<TomadorDto> {
  const response = await fetchWithAuth(`/api/tomadores`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(input),
  });

  return handleResponse<TomadorDto>(response);
}

export async function updateTomador(
  id: string,
  input: TomadorUpdateInput
): Promise<TomadorDto> {
  const response = await fetchWithAuth(`/api/tomadores/${id}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(input),
  });

  return handleResponse<TomadorDto>(response);
}

export async function inactivateTomador(id: string): Promise<TomadorDto> {
  const response = await fetchWithAuth(`/api/tomadores/${id}`, {
    method: "DELETE",
  });

  return handleResponse<TomadorDto>(response);
}

export async function reactivateTomador(id: string): Promise<TomadorDto> {
  const response = await fetchWithAuth(`/api/tomadores/${id}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ ativo: true }),
  });

  return handleResponse<TomadorDto>(response);
}
