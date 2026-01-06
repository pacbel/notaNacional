import { apiFetch } from "@/services/http";
import {
  CancelarNfseRequestDto,
  CancelarNfseResponseDto,
  CertificateInfo,
  EmitirNfseRequestDto,
  EmitirNfseResponseDto,
  ListarNotasEmitidasRequest,
  ListarNotasEmitidasResponse,
} from "@/types/nfse";

export function listarCertificados() {
  return apiFetch<CertificateInfo[]>("/api/nfse/certificados");
}

export function listarNotasEmitidas(params: ListarNotasEmitidasRequest) {
  const searchParams = new URLSearchParams();
  if (params.prestadorId) {
    searchParams.set("prestadorId", params.prestadorId);
  }
  if (params.chaveAcesso) {
    searchParams.set("chaveAcesso", params.chaveAcesso);
  }
  if (params.numero) {
    searchParams.set("numero", params.numero);
  }
  searchParams.set("page", String(params.page));
  searchParams.set("pageSize", String(params.pageSize));

  return apiFetch<ListarNotasEmitidasResponse>(`/api/nfse/notas?${searchParams.toString()}`);
}

export function emitirNfse(payload: EmitirNfseRequestDto) {
  return apiFetch<EmitirNfseResponseDto>("/api/nfse/emitir", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function cancelarNfse(payload: CancelarNfseRequestDto) {
  return apiFetch<CancelarNfseResponseDto>("/api/nfse/cancelar", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}
