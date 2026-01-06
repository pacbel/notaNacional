import { apiFetch } from "@/services/http";
import { CertificateInfo, ListarNotasEmitidasRequest, ListarNotasEmitidasResponse } from "@/types/nfse";

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
