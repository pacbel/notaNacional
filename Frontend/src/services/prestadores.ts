import { apiFetch } from "@/services/http";
import {
  CreatePrestadorDto,
  PrestadorConfiguracaoDto,
  PrestadorDto,
  UpdatePrestadorDto,
  UpsertPrestadorConfiguracaoDto,
} from "@/types/prestadores";

const basePath = "/api/prestadores";

export async function listarPrestadores() {
  return apiFetch<PrestadorDto[]>(basePath);
}

export async function obterPrestador(id: string) {
  return apiFetch<PrestadorDto>(`${basePath}/${id}`);
}

export async function criarPrestador(payload: CreatePrestadorDto) {
  return apiFetch<PrestadorDto>(basePath, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function atualizarPrestador(id: string, payload: UpdatePrestadorDto) {
  return apiFetch<PrestadorDto>(`${basePath}/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export async function removerPrestador(id: string) {
  return apiFetch<void>(`${basePath}/${id}`, {
    method: "DELETE",
  });
}

export async function obterConfiguracaoPrestador(prestadorId: string) {
  return apiFetch<PrestadorConfiguracaoDto>(`${basePath}/${prestadorId}/configuracao`);
}

export async function definirConfiguracaoPrestador(
  prestadorId: string,
  payload: UpsertPrestadorConfiguracaoDto
) {
  return apiFetch<PrestadorConfiguracaoDto>(`${basePath}/${prestadorId}/configuracao`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}
