import { apiFetch } from "@/services/http";
import {
  CreateRobotClientDto,
  RobotClientDto,
  RotateRobotClientSecretDto,
  UpdateRobotClientDto,
} from "@/types/robot-clients";

const buildBasePath = (prestadorId: string) => `/api/prestadores/${prestadorId}/robot-clients`;

export async function listarRobotClients(prestadorId: string, incluirInativos = false) {
  const query = incluirInativos ? "?incluirInativos=true" : "";
  return apiFetch<RobotClientDto[]>(`${buildBasePath(prestadorId)}${query}`);
}

export async function obterRobotClient(prestadorId: string, robotId: string) {
  return apiFetch<RobotClientDto>(`${buildBasePath(prestadorId)}/${robotId}`);
}

export async function criarRobotClient(prestadorId: string, payload: CreateRobotClientDto) {
  return apiFetch<RobotClientDto>(buildBasePath(prestadorId), {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function atualizarRobotClient(
  prestadorId: string,
  robotId: string,
  payload: UpdateRobotClientDto
) {
  return apiFetch<RobotClientDto>(`${buildBasePath(prestadorId)}/${robotId}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export async function inativarRobotClient(prestadorId: string, robotId: string) {
  await apiFetch<void>(`${buildBasePath(prestadorId)}/${robotId}`, {
    method: "DELETE",
  });
}

export async function reativarRobotClient(prestadorId: string, robotId: string) {
  await apiFetch<void>(`${buildBasePath(prestadorId)}/${robotId}/reativar`, {
    method: "POST",
  });
}

export async function rotacionarSecretRobotClient(
  prestadorId: string,
  robotId: string,
  payload: RotateRobotClientSecretDto
) {
  return apiFetch<RobotClientDto>(`${buildBasePath(prestadorId)}/${robotId}/rotate-secret`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}
