import { apiFetch } from "@/services/http";
import { getOnboardingRobotToken } from "@/services/onboarding-robot-auth";
import type { CreatePrestadorDto, PrestadorDto } from "@/types/prestadores";
import type { CreateRobotClientDto, RobotClientDto } from "@/types/robot-clients";
import type { CreateUsuarioDto, UsuarioDto } from "@/types/usuarios";

const PRESTADORES_BASE_PATH = "/api/prestadores";
const USUARIOS_BASE_PATH = "/api/usuarios";

export async function criarPrestadorOnboarding(
  payload: CreatePrestadorDto,
  token?: string
): Promise<PrestadorDto> {
  const authorizationToken = token ?? (await getOnboardingRobotToken());

  return apiFetch<PrestadorDto>(PRESTADORES_BASE_PATH, {
    method: "POST",
    body: JSON.stringify(payload),
    authorizationToken,
    useSessionToken: false,
  });
}

export async function criarRobotClientOnboarding(
  prestadorId: string,
  payload: CreateRobotClientDto,
  token?: string
): Promise<RobotClientDto> {
  const authorizationToken = token ?? (await getOnboardingRobotToken());

  return apiFetch<RobotClientDto>(`${PRESTADORES_BASE_PATH}/${prestadorId}/robot-clients`, {
    method: "POST",
    body: JSON.stringify(payload),
    authorizationToken,
    useSessionToken: false,
  });
}

export async function criarUsuarioGestorOnboarding(payload: CreateUsuarioDto, token?: string): Promise<UsuarioDto> {
  const authorizationToken = token ?? (await getOnboardingRobotToken());
  const timestamp = new Date().toISOString();

  console.info("[Onboarding][UsuarioGestor] Iniciando criação de usuário", {
    email: payload.email,
    prestadorId: payload.prestadorId,
    timestamp,
  });

  try {
    const usuario = await apiFetch<UsuarioDto>(USUARIOS_BASE_PATH, {
      method: "POST",
      body: JSON.stringify(payload),
      authorizationToken,
      useSessionToken: false,
    });

    console.info("[Onboarding][UsuarioGestor] Usuário criado com sucesso", {
      usuarioId: usuario.id,
      email: usuario.email,
      prestadorId: usuario.prestadorId,
      timestamp: new Date().toISOString(),
    });

    return usuario;
  } catch (error) {
    console.error("[Onboarding][UsuarioGestor] Falha ao criar usuário", {
      email: payload.email,
      prestadorId: payload.prestadorId,
      timestamp: new Date().toISOString(),
      erro: error,
    });

    throw error;
  }
}
