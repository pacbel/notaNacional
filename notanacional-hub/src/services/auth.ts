import { apiFetch } from "@/services/http";
import { RobotAuthRequest, RobotAuthResponse } from "@/types/auth";

export function obterTokenRobo(payload: RobotAuthRequest) {
  return apiFetch<RobotAuthResponse>("/api/Auth/robot-token", {
    method: "POST",
    body: JSON.stringify(payload),
    retryOnUnauthorized: false,
  });
}
