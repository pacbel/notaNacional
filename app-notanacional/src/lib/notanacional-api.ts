import { randomBytes } from "node:crypto";

import axios from "axios";

import { getEnv } from "@/lib/env";
import { prisma } from "@/lib/prisma";
import { decodeTokenPayload, getPrestadorIdFromToken } from "@/lib/token-utils";
import { getRobotContextPrestadorId } from "@/lib/robot-context";
import { TokenIntegracaoTipo } from "@prisma/client";

interface RobotTokenResponse {
  access_token?: string;
  accessToken?: string;
  token_type?: string;
  tokenType?: string;
  expires_in?: number;
  expiraEm?: string;
}

interface RobotClientDto {
  id: string;
  clientId: string;
  ativo: boolean;
}

interface RotateRobotClientSecretDto {
  novoSecret: string;
}

const env = getEnv();

export const notaApi = axios.create({
  baseURL: env.API_BASE_URL,
  timeout: 15000,
  headers: {
    "Content-Type": "application/json",
  },
});

const SAFETY_WINDOW_SECONDS = 60;
const ROBOT_SECRET_BYTES = 48;

interface RobotCredentialsCacheEntry {
  clientId: string;
  clientSecret: string;
  tokenCacheMinutes: number | null;
  updatedAt: number;
}

const credentialsCache = new Map<string, RobotCredentialsCacheEntry>();
const CREDENTIALS_TTL_MS = 5 * 60 * 1000; // 5 minutos

function buildTokenId(prestadorId: string) {
  // A coluna id (CHAR(36)) aceita diretamente o próprio prestadorId
  return prestadorId;
}

async function persistToken(prestadorId: string, token: string, expiresAt: Date) {
  const tokenId = buildTokenId(prestadorId);
  try {
    await prisma.tokenIntegracao.upsert({
      where: { id: tokenId },
      update: {
        token,
        expiresAt,
        ativo: true,
      },
      create: {
        id: tokenId,
        tipo: TokenIntegracaoTipo.ROBOT,
        token,
        expiresAt,
        ativo: true,
      },
    });
  } catch (error: unknown) {
    // Se falhar por constraint de PRIMARY (race condition), tenta apenas update
    if (error && typeof error === 'object' && 'code' in error && error.code === 'P2002') {
      await prisma.tokenIntegracao.update({
        where: { id: tokenId },
        data: {
          token,
          expiresAt,
          ativo: true,
        },
      });
    } else {
      throw error;
    }
  }
}

function generateRobotSecret(): string {
  return randomBytes(ROBOT_SECRET_BYTES).toString("base64url");
}

async function fetchRobotClients(
  prestadorId: string,
  sessionToken: string,
  includeInactive = false
): Promise<RobotClientDto[]> {
  const query = includeInactive ? "?incluirInativos=true" : "";
  const response = await fetch(
    `${env.API_BASE_URL}/api/prestadores/${prestadorId}/robot-clients${query}`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${sessionToken}`,
      },
      cache: "no-store",
    }
  );

  if (!response.ok) {
    const errorText = await response.text().catch(() => "");
    throw new Error(
      errorText.trim() || `Falha ao obter robot-clients (status ${response.status})`
    );
  }

  const data = await response.json().catch(() => []);

  if (Array.isArray(data)) {
    return data as RobotClientDto[];
  }

  return data ? [data as RobotClientDto] : [];
}

async function rotateRobotClientSecret(
  prestadorId: string,
  robotId: string,
  secret: string,
  sessionToken: string
): Promise<void> {
  const payload: RotateRobotClientSecretDto = {
    novoSecret: secret,
  };

  const response = await fetch(
    `${env.API_BASE_URL}/api/prestadores/${prestadorId}/robot-clients/${robotId}/rotate-secret`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${sessionToken}`,
      },
      body: JSON.stringify(payload),
      cache: "no-store",
    }
  );

  if (!response.ok) {
    const errorText = await response.text().catch(() => "");
    throw new Error(
      errorText.trim() || `Falha ao rotacionar secret do robot-client (status ${response.status})`
    );
  }
}

export async function ensureRobotCredentials(prestadorId: string): Promise<RobotCredentialsCacheEntry> {
  const configuracao = await prisma.configuracaoDps.findUnique({
    where: { prestadorId },
    select: {
      robotClientId: true,
      robotClientSecret: true,
      robotTokenCacheMinutos: true,
    },
  });

  if (configuracao?.robotClientId && configuracao.robotClientSecret) {
    const entry: RobotCredentialsCacheEntry = {
      clientId: configuracao.robotClientId,
      clientSecret: configuracao.robotClientSecret,
      tokenCacheMinutes: configuracao.robotTokenCacheMinutos ?? null,
      updatedAt: Date.now(),
    };
    credentialsCache.set(prestadorId, entry);
    return entry;
  }

  const { getSessionToken } = await import("@/lib/auth");
  const sessionToken = await getSessionToken();

  if (!sessionToken) {
    throw new Error("Sessão do usuário não encontrada para recuperar robot-clients.");
  }

  let clients = await fetchRobotClients(prestadorId, sessionToken, false);

  if (!clients.length) {
    clients = await fetchRobotClients(prestadorId, sessionToken, true);
  }

  const targetClient = clients.find((client) => client.ativo) ?? clients[0];

  if (!targetClient) {
    throw new Error("Nenhum robot-client disponível para o prestador informado.");
  }

  const novoSecret = generateRobotSecret();
  await rotateRobotClientSecret(prestadorId, targetClient.id, novoSecret, sessionToken);

  const updated = await prisma.configuracaoDps.update({
    where: { prestadorId },
    data: {
      robotClientId: targetClient.clientId,
      robotClientSecret: novoSecret,
    },
    select: {
      robotClientId: true,
      robotClientSecret: true,
      robotTokenCacheMinutos: true,
    },
  });

  const persistedClientId = (updated.robotClientId ?? targetClient.clientId) as string;
  const persistedSecret = (updated.robotClientSecret ?? novoSecret) as string;

  const entry: RobotCredentialsCacheEntry = {
    clientId: persistedClientId,
    clientSecret: persistedSecret,
    tokenCacheMinutes: updated.robotTokenCacheMinutos ?? null,
    updatedAt: Date.now(),
  };

  credentialsCache.set(prestadorId, entry);

  return entry;
}

async function fetchStoredToken(prestadorId: string): Promise<string | null> {
  const now = new Date();
  const stored = await prisma.tokenIntegracao.findFirst({
    where: {
      tipo: TokenIntegracaoTipo.ROBOT,
      ativo: true,
      id: buildTokenId(prestadorId),
      expiresAt: {
        gt: new Date(now.getTime() + SAFETY_WINDOW_SECONDS * 1000),
      },
    },
  });

  return stored?.token ?? null;
}

function decodeTokenExp(accessToken: string): number | null {
  if (!accessToken) {
    return null;
  }

  const [, payload] = accessToken.split(".");

  if (!payload) return null;

  try {
    const json = Buffer.from(payload, "base64").toString("utf-8");
    const data = JSON.parse(json) as { exp?: number };

    return data.exp ?? null;
  } catch {
    return null;
  }
}

function resolveExpiration(accessToken: string, expiresIn?: number, cacheMinutes?: number | null): Date {
  let candidateExpiration: Date;

  if (expiresIn && expiresIn > 0) {
    candidateExpiration = new Date(Date.now() + (expiresIn - SAFETY_WINDOW_SECONDS) * 1000);
  } else {
    const exp = decodeTokenExp(accessToken);
    candidateExpiration = exp ? new Date(exp * 1000) : new Date(Date.now() + 45 * 60 * 1000);
  }

  if (!cacheMinutes || cacheMinutes <= 0) {
    return candidateExpiration;
  }

  const cacheWindowSeconds = Math.max(cacheMinutes * 60 - SAFETY_WINDOW_SECONDS, SAFETY_WINDOW_SECONDS);
  const cacheExpiration = new Date(Date.now() + cacheWindowSeconds * 1000);

  return cacheExpiration < candidateExpiration ? cacheExpiration : candidateExpiration;
}

async function resolvePrestadorId(provided?: string): Promise<string> {
  if (provided) {
    return provided;
  }

  const contextPrestadorId = getRobotContextPrestadorId();

  if (contextPrestadorId) {
    return contextPrestadorId;
  }

  const { getCurrentUser } = await import("@/lib/auth");
  const currentUser = await getCurrentUser();

  if (currentUser?.prestadorId) {
    return currentUser.prestadorId;
  }

  throw new Error("Prestador não identificado para solicitar token do robô");
}

async function requestRobotToken(prestadorId?: string): Promise<string> {
  const resolvedPrestadorId = await resolvePrestadorId(prestadorId);

  const now = Date.now();
  let entry = credentialsCache.get(resolvedPrestadorId);

  if (!entry || now - entry.updatedAt >= CREDENTIALS_TTL_MS) {
    entry = await ensureRobotCredentials(resolvedPrestadorId);
  }

  return requestTokenWithCredentials(resolvedPrestadorId, entry);
}

export function clearRobotCredentialsCache(prestadorId: string) {
  credentialsCache.delete(prestadorId);
}

async function requestTokenWithCredentials(
  prestadorId: string,
  credentials: RobotCredentialsCacheEntry
): Promise<string> {
  const body = {
    clientId: credentials.clientId,
    clientSecret: credentials.clientSecret,
    scope: "nfse.cancelar nfse.certificados nfse.danfse nfse.emitir nfse.email",
  };

  const { data } = await notaApi.post<RobotTokenResponse>("/api/Auth/robot-token", body);

  const accessToken = data?.access_token ?? data?.accessToken;
  const expiresIn = data?.expires_in;

  if (!accessToken) {
    console.error("[NotaAPI] Resposta sem access_token", { data });
    throw new Error("Token de robô não retornado pela API Nota");
  }

  // Log do token client para debug
  console.log("[NotaAPI] Token client obtido:", accessToken);
  
  // Decodificar e logar o payload do token
  const payload = decodeTokenPayload(accessToken);
  console.log("[NotaAPI] Payload do token:", JSON.stringify(payload, null, 2));
  
  // Extrair e logar o prestadorId
  const tokenPrestadorId = getPrestadorIdFromToken(accessToken);
  console.log("[NotaAPI] PrestadorId extraído do token:", tokenPrestadorId);

  const expiresAt = resolveExpiration(accessToken, expiresIn, credentials.tokenCacheMinutes);
  await persistToken(prestadorId, accessToken, expiresAt);

  return accessToken;
}

export async function getRobotToken(prestadorId?: string): Promise<string> {
  const resolvedPrestadorId = await resolvePrestadorId(prestadorId);
  const cached = await fetchStoredToken(resolvedPrestadorId);

  if (cached) {
    return cached;
  }

  return requestRobotToken(resolvedPrestadorId);
}

export async function authorizeNotaApi(prestadorId?: string) {
  const token = await getRobotToken(prestadorId);

  notaApi.defaults.headers.common.Authorization = `Bearer ${token}`;
}
