import type { CreateUsuarioDto, UpdateUsuarioDto, ChangePasswordDto, UsuarioDto } from "@/lib/validators/usuario";

interface ApiErrorResponse {
  message?: string;
  title?: string;
  detail?: string;
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    let errorMessage = "Erro inesperado";

    try {
      const data = (await response.json()) as ApiErrorResponse;
      errorMessage = data.detail || data.message || data.title || errorMessage;
    } catch {
      // ignora erro de parse
    }

    throw new Error(errorMessage);
  }

  if (response.status === 204) {
    return {} as T;
  }

  return (await response.json()) as T;
}

export async function listUsuarios(): Promise<UsuarioDto[]> {
  const response = await fetch("/api/usuarios", {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
    cache: "no-store",
  });

  return handleResponse<UsuarioDto[]>(response);
}

export async function getUsuario(id: string): Promise<UsuarioDto> {
  const response = await fetch(`/api/usuarios/${id}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
    cache: "no-store",
  });

  return handleResponse<UsuarioDto>(response);
}

export async function createUsuario(payload: CreateUsuarioDto): Promise<UsuarioDto> {
  const response = await fetch("/api/usuarios", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  return handleResponse<UsuarioDto>(response);
}

export async function updateUsuario(id: string, payload: UpdateUsuarioDto): Promise<UsuarioDto> {
  const response = await fetch(`/api/usuarios/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  return handleResponse<UsuarioDto>(response);
}

export async function deleteUsuario(id: string): Promise<void> {
  const response = await fetch(`/api/usuarios/${id}`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
    },
  });

  return handleResponse<void>(response);
}

export async function changePassword(id: string, payload: ChangePasswordDto): Promise<void> {
  const response = await fetch(`/api/usuarios/${id}/senha`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  return handleResponse<void>(response);
}
