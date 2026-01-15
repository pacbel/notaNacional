import type { CancelamentoMotivoCodigo } from "@/lib/nfse/cancelamento-motivos";
import type { CancelarNfseResponse, EmitirNfseResponse } from "@/lib/nfse/types";

export type DpsStatus = "RASCUNHO" | "ASSINADO" | "ENVIADO" | "CANCELADO";
export type Ambiente = "PRODUCAO" | "HOMOLOGACAO";

export interface PaginationMeta {
  page: number;
  perPage: number;
  totalItems: number;
  totalPages: number;
}

export async function getNfseMetrics(): Promise<NfseMetrics> {
  const response = await fetch("/api/nfse/metrics", {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
    cache: "no-store",
  });

  return handleResponse<NfseMetrics>(response);
}
export interface ListNotasParams {
  statuses?: DpsStatus[];
  search?: string;
  prestadorIds?: string[];
  tomadorIds?: string[];
  ambiente?: Ambiente;
  startDate?: string;
  endDate?: string;
  minValue?: number;
  maxValue?: number;
  page?: number;
  perPage?: number;
}

export interface NfseMetrics {
  totalNotas: number;
  notasMes: number;
  dpsPendentes: number;
  valorTotalMes: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: PaginationMeta;
}

export interface DpsDto {
  id: string;
  identificador: string;
  numero: number;
  serie: number;
  versao: string;
  versaoAplicacao: string;
  tipoEmissao: number;
  codigoLocalEmissao: string;
  competencia: string;
  dataEmissao: string;
  ambiente: Ambiente;
  status: DpsStatus;
  createdAt: string;
  prestador: {
    id: string;
    nomeFantasia: string;
    cnpj: string;
  };
  tomador: {
    id: string;
    nomeRazaoSocial: string;
    documento: string;
  };
  servico: {
    id: string;
    descricao: string;
    valorUnitario: number;
  };
  certificadoId: string | null;
  protocolo: string | null;
  dataEnvio: string | null;
  dataRetorno: string | null;
  updatedAt: string;
}

export interface ListDpsParams {
  statuses?: DpsStatus[];
  search?: string;
  prestadorIds?: string[];
  tomadorIds?: string[];
  servicoIds?: string[];
  ambiente?: Ambiente;
  startDate?: string;
  endDate?: string;
  minValue?: number;
  maxValue?: number;
  page?: number;
  perPage?: number;
}

export interface CreateDpsPayload {
  prestadorId: string;
  tomadorId: string;
  servicoId: string;
  competencia: string;
  dataEmissao: string;
  tipoEmissao?: number;
  observacoes?: string | null;
}

export interface AssinarDpsPayload {
  dpsId: string;
  certificateId?: string;
  tag?: string;
}

export interface EmitirNfsePayload {
  dpsId: string;
  certificateId?: string;
  ambiente?: number;
}

export interface CancelarNfsePayload {
  chaveAcesso: string;
  motivoCodigo: CancelamentoMotivoCodigo;
  justificativa: string;
  ambiente?: number;
}

export interface NotaDto {
  id: string;
  chaveAcesso: string;
  numero: string;
  codigoVerificacao?: string;
  urlNfse?: string;
  ambiente: Ambiente;
  statusCode?: number;
  createdAt: string;
  updatedAt: string;
  certificateId?: string;
  prestador: {
    id: string;
    nomeFantasia: string;
    cnpj: string;
  };
  tomador: {
    id: string;
    nomeRazaoSocial: string;
    documento: string;
  };
  dps: {
    id: string;
    numero: number;
    serie: number;
    status: DpsStatus;
    certificadoId?: string;
    servico: {
      descricao: string;
      valorUnitario: number;
    };
  } | null;
}

interface ApiErrorResponse {
  message?: string;
  details?: unknown;
}

function tryParseJson(value: string): unknown | null {
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

function resolveSefinErrorFromRecord(record: Record<string, unknown>): string | null {
  const erros = record["erros"];

  if (Array.isArray(erros)) {
    for (const item of erros) {
      if (!item || typeof item !== "object") {
        continue;
      }

      const entry = item as Record<string, unknown>;
      const rawCodigo = entry["Codigo"] ?? entry["codigo"];
      const rawDescricao = entry["Descricao"] ?? entry["descricao"];

      const descricao = typeof rawDescricao === "string" && rawDescricao.trim().length > 0 ? rawDescricao.trim() : null;
      const codigo = rawCodigo !== undefined && rawCodigo !== null ? String(rawCodigo).trim() : null;

      if (descricao && codigo) {
        return `${codigo} - ${descricao}`;
      }

      if (descricao) {
        return descricao;
      }
    }
  }

  const descricaoDireta = record["Descricao"] ?? record["descricao"];

  if (typeof descricaoDireta === "string" && descricaoDireta.trim().length > 0) {
    return descricaoDireta.trim();
  }

  return null;
}

function resolveErrorMessageFromUnknown(value: unknown, depth = 0): string | null {
  if (depth > 5) {
    return null;
  }

  if (typeof value === "string") {
    const trimmed = value.trim();

    if (!trimmed) {
      return null;
    }

    if ((trimmed.startsWith("{") && trimmed.endsWith("}")) || (trimmed.startsWith("[") && trimmed.endsWith("]"))) {
      const parsed = tryParseJson(trimmed);

      if (parsed !== null) {
        const nested = resolveErrorMessageFromUnknown(parsed, depth + 1);

        if (nested) {
          return nested;
        }
      }
    }

    return trimmed;
  }

  if (Array.isArray(value)) {
    for (const item of value) {
      const nested = resolveErrorMessageFromUnknown(item, depth + 1);

      if (nested) {
        return nested;
      }
    }

    return null;
  }

  if (!value || typeof value !== "object") {
    return null;
  }

  const record = value as Record<string, unknown>;

  const sefinMessage = resolveSefinErrorFromRecord(record);

  if (sefinMessage) {
    return sefinMessage;
  }

  const messageKeys = ["message", "mensagem", "Mensagem", "Message"];

  for (const key of messageKeys) {
    if (key in record) {
      const nested = resolveErrorMessageFromUnknown(record[key], depth + 1);

      if (nested) {
        return nested;
      }
    }
  }

  const detailKeys = ["details", "detalhes", "rawResponseContent", "raw_response", "error", "erro"];

  for (const key of detailKeys) {
    if (key in record) {
      const nested = resolveErrorMessageFromUnknown(record[key], depth + 1);

      if (nested) {
        return nested;
      }
    }
  }

  if (depth === 0) {
    try {
      return JSON.stringify(record);
    } catch {
      return null;
    }
  }

  return null;
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    let errorMessage = "Erro inesperado";

    try {
      const bodyText = await response.text();
      const resolvedMessage = resolveErrorMessageFromUnknown(bodyText);

      if (resolvedMessage) {
        errorMessage = resolvedMessage;
      }
    } catch {
      // parse failure mantém mensagem padrão
    }

    throw new Error(errorMessage);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

function appendMultiple(searchParams: URLSearchParams, key: string, values?: string[]) {
  if (!values) {
    return;
  }

  values.forEach((value) => {
    if (value) {
      searchParams.append(key, value);
    }
  });
}

function appendNumber(searchParams: URLSearchParams, key: string, value?: number) {
  if (typeof value === "number" && Number.isFinite(value)) {
    searchParams.set(key, value.toString());
  }
}

function appendString(searchParams: URLSearchParams, key: string, value?: string) {
  if (value && value.trim().length > 0) {
    searchParams.set(key, value.trim());
  }
}

export async function listDps(params: ListDpsParams = {}): Promise<PaginatedResponse<DpsDto>> {
  const searchParams = new URLSearchParams();

  if (params.statuses && params.statuses.length > 0) {
    searchParams.set("status", params.statuses.join(","));
  }

  appendString(searchParams, "search", params.search);
  appendString(searchParams, "ambiente", params.ambiente);
  appendString(searchParams, "startDate", params.startDate);
  appendString(searchParams, "endDate", params.endDate);

  appendMultiple(searchParams, "prestadorId", params.prestadorIds);
  appendMultiple(searchParams, "tomadorId", params.tomadorIds);
  appendMultiple(searchParams, "servicoId", params.servicoIds);

  appendNumber(searchParams, "minValue", params.minValue);
  appendNumber(searchParams, "maxValue", params.maxValue);
  appendNumber(searchParams, "page", params.page);
  appendNumber(searchParams, "perPage", params.perPage);

  const query = searchParams.size > 0 ? `?${searchParams.toString()}` : "";

  const response = await fetch(`/api/nfse/dps${query}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
    cache: "no-store",
  });

  return handleResponse<PaginatedResponse<DpsDto>>(response);
}

export async function createDps(payload: CreateDpsPayload): Promise<DpsDto> {
  const response = await fetch("/api/nfse/dps", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  return handleResponse<DpsDto>(response);
}

export async function deleteDps(id: string): Promise<void> {
  const response = await fetch(`/api/nfse/dps/${id}`, {
    method: "DELETE",
  });

  await handleResponse<void>(response);
}

export async function listCertificados() {
  const response = await fetch("/api/nfse", {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
    cache: "no-store",
  });

  return handleResponse<
    {
      id: string;
      nome?: string;
      apelido?: string;
      cnpj?: string;
      validadeFim?: string;
    }[]
  >(response);
}

export async function assinarDps(payload: AssinarDpsPayload) {
  const response = await fetch("/api/nfse", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      ...payload,
      tag: payload.tag ?? "infDPS",
    }),
  });

  return handleResponse<{ xmlAssinado: string }>(response);
}

export async function emitirNfse(payload: EmitirNfsePayload) {
  const response = await fetch("/api/nfse", {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  return handleResponse<EmitirNfseResponse>(response);
}

export async function listNotas(params: ListNotasParams = {}): Promise<PaginatedResponse<NotaDto>> {
  const searchParams = new URLSearchParams();

  if (params.statuses && params.statuses.length > 0) {
    searchParams.set("status", params.statuses.join(","));
  }

  appendString(searchParams, "search", params.search);
  appendString(searchParams, "ambiente", params.ambiente);
  appendString(searchParams, "startDate", params.startDate);
  appendString(searchParams, "endDate", params.endDate);

  appendMultiple(searchParams, "prestadorId", params.prestadorIds);
  appendMultiple(searchParams, "tomadorId", params.tomadorIds);

  appendNumber(searchParams, "minValue", params.minValue);
  appendNumber(searchParams, "maxValue", params.maxValue);
  appendNumber(searchParams, "page", params.page);
  appendNumber(searchParams, "perPage", params.perPage);

  const query = searchParams.size > 0 ? `?${searchParams.toString()}` : "";

  const response = await fetch(`/api/nfse/notas${query}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
    cache: "no-store",
  });

  return handleResponse<PaginatedResponse<NotaDto>>(response);
}

export async function cancelarNfse(payload: CancelarNfsePayload) {
  const response = await fetch(`/api/nfse/notas/${encodeURIComponent(payload.chaveAcesso)}/cancelar`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  return handleResponse<CancelarNfseResponse>(response);
}

export async function downloadDanfse(chaveAcesso: string, params: { ambiente?: number; certificateId?: string } = {}) {
  const searchParams = new URLSearchParams();

  if (params.ambiente) {
    searchParams.set("ambiente", String(params.ambiente));
  }

  if (params.certificateId) {
    searchParams.set("certificateId", params.certificateId);
  }

  const url = `/api/nfse/notas/${encodeURIComponent(chaveAcesso)}/danfse${
    searchParams.size ? `?${searchParams.toString()}` : ""
  }`;

  const newWindow = window.open("", "_blank");

  if (newWindow) {
    newWindow.opener = null;
    newWindow.location.href = url;
    newWindow.focus?.();
    return;
  }

  window.location.href = url;
}
