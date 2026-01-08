import { apiFetch } from "@/services/http";
import {
  CertificateInfo,
  EnviarNfseEmailRequest,
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

export function enviarNfseEmail(payload: EnviarNfseEmailRequest, token?: string) {
  return apiFetch<void>("/api/nfse/emails", {
    method: "POST",
    body: JSON.stringify(payload),
    authorizationToken: token,
    useSessionToken: !token,
  });
}
