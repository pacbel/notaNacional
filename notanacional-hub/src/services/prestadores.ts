import { apiFetch } from "@/services/http";
import {
  CreatePrestadorDto,
  PrestadorConfiguracaoDto,
  PrestadorDto,
  UpdatePrestadorDto,
  UpsertPrestadorConfiguracaoDto,
  PrestadorCertificadoDto,
  PrestadorCertificadoUploadDto,
  PrestadorCertificadoUpdateDto,
  PrestadorCertificadoSenhaDto,
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

export async function listarCertificadosPrestador(prestadorId: string) {
  return apiFetch<PrestadorCertificadoDto[]>(`${basePath}/${prestadorId}/certificados`);
}

export async function uploadCertificadoPrestador(
  prestadorId: string,
  payload: PrestadorCertificadoUploadDto
) {
  return apiFetch<PrestadorCertificadoDto>(`${basePath}/${prestadorId}/certificados`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function atualizarCertificadoPrestador(
  prestadorId: string,
  certificadoId: string,
  payload: PrestadorCertificadoUpdateDto
) {
  return apiFetch<PrestadorCertificadoDto>(`${basePath}/${prestadorId}/certificados/${certificadoId}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export async function atualizarSenhaCertificadoPrestador(
  prestadorId: string,
  certificadoId: string,
  payload: PrestadorCertificadoSenhaDto
) {
  return apiFetch<void>(`${basePath}/${prestadorId}/certificados/${certificadoId}/senha`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export async function removerCertificadoPrestador(prestadorId: string, certificadoId: string) {
  return apiFetch<void>(`${basePath}/${prestadorId}/certificados/${certificadoId}`, {
    method: "DELETE",
  });
}
