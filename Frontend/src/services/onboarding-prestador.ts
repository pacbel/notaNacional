import { apiFetch } from "@/services/http";
import { getOnboardingRobotToken } from "@/services/onboarding-robot-auth";
import type { CreatePrestadorDto, PrestadorDto } from "@/types/prestadores";
import type { CreateRobotClientDto, RobotClientDto } from "@/types/robot-clients";

const PRESTADORES_BASE_PATH = "/api/prestadores";

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
