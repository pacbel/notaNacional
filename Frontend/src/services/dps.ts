import { apiFetch } from "@/services/http";
import { CriarDpsRequestDto, DpsDto } from "@/types/dps";

const basePath = "/api/prestadores";

export async function listarDps(
  prestadorId: string,
  params: {
    status?: string;
    dataInicio?: string;
    dataFim?: string;
  } = {}
) {
  const query = new URLSearchParams();

  if (params.status) {
    query.set("status", params.status);
  }

  if (params.dataInicio) {
    query.set("dataInicio", params.dataInicio);
  }

  if (params.dataFim) {
    query.set("dataFim", params.dataFim);
  }

  const qs = query.toString();

  return apiFetch<DpsDto[]>(
    `${basePath}/${prestadorId}/dps${qs ? `?${qs}` : ""}`
  );
}

export async function obterDps(prestadorId: string, dpsId: string) {
  return apiFetch<DpsDto>(`${basePath}/${prestadorId}/dps/${dpsId}`);
}

export async function criarDps(
  prestadorId: string,
  payload: CriarDpsRequestDto
) {
  return apiFetch<DpsDto>(`${basePath}/${prestadorId}/dps`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}
