import { obterTokenRobo } from "@/services/auth";
import type { RobotAuthRequest } from "@/types/auth";

const rawRobotClientId = process.env.NEXT_PUBLIC_ONBOARDING_MFA_ROBOT_CLIENT_ID;
const rawRobotClientSecret = process.env.NEXT_PUBLIC_ONBOARDING_MFA_ROBOT_CLIENT_SECRET;
const rawRobotScope = process.env.NEXT_PUBLIC_ONBOARDING_MFA_ROBOT_SCOPE;

console.info("[Onboarding][Env] Variáveis do robô", {
  hasClientId: Boolean(rawRobotClientId),
  hasClientSecret: Boolean(rawRobotClientSecret),
  scope: rawRobotScope ?? "(padrão nfse.robot)",
});

function sanitizeEnv(value?: string | null) {
  return value?.trim().replace(/^['"]|['"]$/g, "") ?? undefined;
}

const robotClientId = sanitizeEnv(rawRobotClientId);
const robotClientSecret = sanitizeEnv(rawRobotClientSecret);
const robotScope = sanitizeEnv(rawRobotScope) ?? "nfse.robot";

interface CachedToken {
  value: string;
  expiresAt: number;
}

let cachedToken: CachedToken | null = null;

function ensureRobotCredentials() {
  if (!robotClientId || !robotClientSecret) {
    throw new Error(
      "Credenciais do robô de onboarding não configuradas. Defina NEXT_PUBLIC_ONBOARDING_ROBOT_CLIENT_ID e NEXT_PUBLIC_ONBOARDING_ROBOT_CLIENT_SECRET."
    );
  }

  return {
    clientId: robotClientId,
    clientSecret: robotClientSecret,
  };
}

export async function getOnboardingRobotToken(forceRefresh = false): Promise<string> {
  const credentials = ensureRobotCredentials();

  if (!forceRefresh && cachedToken && cachedToken.expiresAt > Date.now()) {
    return cachedToken.value;
  }

  const payload: RobotAuthRequest = {
    clientId: credentials.clientId,
    clientSecret: credentials.clientSecret,
    scope: robotScope,
  };

  const response = await obterTokenRobo(payload);
  const accessToken = response?.accessToken;

  if (!accessToken) {
    throw new Error("Resposta inválida ao solicitar token do robô de onboarding.");
  }

  const expiresInSeconds = Number(response.expiresIn ?? 0);
  const safetyWindowInSeconds = 60;
  const expiresAt = Date.now() + Math.max((expiresInSeconds - safetyWindowInSeconds) * 1000, 30_000);

  cachedToken = {
    value: accessToken,
    expiresAt,
  };

  return accessToken;
}
