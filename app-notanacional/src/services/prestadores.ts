import { getEnv } from "@/lib/env";
import { fetchWithAuth } from "@/lib/fetch-with-auth";
import type {
  PrestadorCreateInput,
  PrestadorUpdateInput,
} from "@/lib/validators/prestador";

export interface PrestadorDto {
  id: string;
  nomeFantasia?: string | null;
  razaoSocial?: string | null;
  cnpj?: string | null;
  inscricaoMunicipal?: string | null;
  email?: string | null;
  telefone?: string | null;
  site?: string | null;
  website?: string | null;
  url?: string | null;
  cnae?: string | null;
  tipoEmissao?: number | null;
  codigoMunicipio?: string | null;
  codigoMunicipioIbge?: string | null;
  optanteSimplesNacional?: number | null;
  regimeEspecialTributario?: number | null;
  cidade?: string | null;
  estado?: string | null;
  cep?: string | null;
  logradouro?: string | null;
  numero?: string | null;
  complemento?: string | null;
  bairro?: string | null;
  observacoes?: string | null;
  ativo?: boolean;
  createdAt?: string;
  updatedAt?: string;
  endereco?: {
    logradouro?: string | null;
    numero?: string | null;
    complemento?: string | null;
    bairro?: string | null;
    codigoMunicipioIbge?: string | null;
    uf?: string | null;
    cep?: string | null;
  } | null;
  configuracao?: unknown;
  criadoPorUsuarioId?: string | null;
  dataCriacao?: string | null;
  dataAtualizacao?: string | null;
  [key: string]: unknown;
}

export interface PrestadoresListResponse {
  data: PrestadorDto[];
  total: number;
  page: number;
  perPage: number;
}

export type PrestadorStatusFilter = "ativos" | "inativos" | "todos";

export class RobotCredentialsMissingClientError extends Error {
  public readonly redirectTo: string;
  public readonly status: number;

  constructor(message: string, redirectTo: string = "/configuracoes", status = 428) {
    super(message);
    this.name = "RobotCredentialsMissingClientError";
    this.redirectTo = redirectTo;
    this.status = status;
  }
}

interface ListPrestadoresParams {
  page?: number;
  perPage?: number;
  search?: string;
  status?: PrestadorStatusFilter;
}

const API_BASE_PATH = "/api/prestadores" as const;

function buildUrl(path: string) {
  if (typeof window !== "undefined") {
    return path;
  }

  const { API_BASE_URL } = getEnv();
  return `${API_BASE_URL}${path}`;
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const data = await response.json().catch(() => null);
    const message = data?.message ?? "Erro inesperado";

    if (response.status === 428) {
      const redirectTo = typeof data?.redirectTo === "string" ? data.redirectTo : "/configuracoes";
      throw new RobotCredentialsMissingClientError(message, redirectTo, response.status);
    }

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

  const response = await fetchWithAuth(buildUrl(`${API_BASE_PATH}?${params.toString()}`), {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
    cache: "no-store",
  });

  return handleResponse<PrestadoresListResponse>(response);
}

export async function createPrestador(input: PrestadorCreateInput): Promise<PrestadorDto> {
  const response = await fetchWithAuth(buildUrl(API_BASE_PATH), {
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
  const response = await fetchWithAuth(buildUrl(`${API_BASE_PATH}/${id}`), {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(input),
  });

  return handleResponse<PrestadorDto>(response);
}

export async function inactivatePrestador(id: string): Promise<PrestadorDto> {
  const response = await fetchWithAuth(buildUrl(`${API_BASE_PATH}/${id}`), {
    method: "DELETE",
  });

  return handleResponse<PrestadorDto>(response);
}

export async function reactivatePrestador(id: string): Promise<PrestadorDto> {
  const response = await fetchWithAuth(buildUrl(`${API_BASE_PATH}/${id}`), {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ ativo: true }),
  });

  return handleResponse<PrestadorDto>(response);
}

export async function getPrestador(id: string): Promise<PrestadorDto> {
  if (typeof window === "undefined") {
    const { getRobotToken } = await import("@/lib/notanacional-api");

    const { API_BASE_URL } = getEnv();
    const token = await getRobotToken(id);

    const response = await fetchWithAuth(`${API_BASE_URL}/api/Prestadores`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      cache: "no-store",
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`Erro ao buscar prestador: ${response.status} - ${errorBody}`);
    }

    const data = await response.json();
    const prestadores = Array.isArray(data) ? data : [data];
    const prestador = prestadores.find((item: PrestadorDto) => item.id === id);

    if (!prestador) {
      console.error("[PrestadoresService] Prestador não encontrado na lista retornada", {
        id,
        quantidadeRetornada: prestadores.length,
      });
      throw new Error("Prestador não encontrado");
    }

    // Algumas respostas trazem o código do município dentro de endereco.codigoMunicipioIbge
    if (!prestador.codigoMunicipio && prestador.endereco?.codigoMunicipioIbge) {
      prestador.codigoMunicipio = prestador.endereco.codigoMunicipioIbge;
    }

    console.log("[PrestadoresService] Prestador obtido com sucesso", {
      id,
      status: response.status,
      possuiConfiguracao: Boolean((prestador as any)?.configuracao),
    });

    return prestador;
  }

  const response = await fetchWithAuth(buildUrl(`${API_BASE_PATH}/${id}`), {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
    cache: "no-store",
  });

  return handleResponse<PrestadorDto>(response);
}
