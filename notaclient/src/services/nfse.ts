import type { CancelamentoMotivoCodigo } from "@/lib/nfse/cancelamento-motivos";
import type { CancelarNfseResponse, EmitirNfseResponse } from "@/lib/nfse/types";

export type DpsStatus = "RASCUNHO" | "ASSINADO" | "ENVIADO" | "CANCELADO";
export type Ambiente = "PRODUCAO" | "HOMOLOGACAO";

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
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    let errorMessage = "Erro inesperado";

    try {
      const data = (await response.json()) as ApiErrorResponse;
      errorMessage = data.message ?? errorMessage;
    } catch {
      // ignore parse error
    }

    throw new Error(errorMessage);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

export async function listDps(params: { statuses?: DpsStatus[] } = {}): Promise<DpsDto[]> {
  const searchParams = new URLSearchParams();

  if (params.statuses && params.statuses.length > 0) {
    searchParams.set("status", params.statuses.join(","));
  }

  const query = searchParams.size > 0 ? `?${searchParams.toString()}` : "";

  const response = await fetch(`/api/nfse/dps${query}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
    cache: "no-store",
  });

  return handleResponse<DpsDto[]>(response);
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

export async function listNotas(limit = 50): Promise<NotaDto[]> {
  const params = new URLSearchParams();
  if (limit) {
    params.set("limit", String(limit));
  }

  const response = await fetch(`/api/nfse/notas?${params.toString()}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
    cache: "no-store",
  });

  return handleResponse<NotaDto[]>(response);
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
