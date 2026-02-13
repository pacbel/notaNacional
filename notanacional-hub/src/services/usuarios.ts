import { apiFetch } from "@/services/http";
import {
  ChangePasswordDto,
  CreateUsuarioDto,
  UpdateUsuarioDto,
  UsuarioDto,
} from "@/types/usuarios";

const basePath = "/api/usuarios";

export async function listarUsuarios() {
  return apiFetch<UsuarioDto[]>(basePath, {
    method: "GET",
  });
}

export async function obterUsuario(id: string) {
  return apiFetch<UsuarioDto>(`${basePath}/${id}`, {
    method: "GET",
  });
}

export async function criarUsuario(payload: CreateUsuarioDto) {
  return apiFetch<UsuarioDto>(basePath, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function criarUsuarioComToken(payload: CreateUsuarioDto, authorizationToken: string) {
  return apiFetch<UsuarioDto>(basePath, {
    method: "POST",
    body: JSON.stringify(payload),
    authorizationToken,
    useSessionToken: false,
  });
}

export async function atualizarUsuario(id: string, payload: UpdateUsuarioDto) {
  return apiFetch<UsuarioDto>(`${basePath}/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export async function alterarSenha(id: string, payload: ChangePasswordDto) {
  await apiFetch<void>(`${basePath}/${id}/senha`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export async function removerUsuario(id: string) {
  await apiFetch<void>(`${basePath}/${id}`, {
    method: "DELETE",
  });
}
