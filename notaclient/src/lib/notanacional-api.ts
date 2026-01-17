import axios from "axios";

import { getEnv } from "@/lib/env";
import { prisma } from "@/lib/prisma";
import { TokenIntegracaoTipo } from "@prisma/client";

interface RobotTokenResponse {
  access_token?: string;
  accessToken?: string;
  token_type?: string;
  tokenType?: string;
  expires_in?: number;
  expiraEm?: string;
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

async function persistToken(token: string, expiresAt: Date) {
  try {
    await prisma.tokenIntegracao.upsert({
      where: { id: "robot-token" },
      update: {
        token,
        expiresAt,
        ativo: true,
      },
      create: {
        id: "robot-token",
        tipo: TokenIntegracaoTipo.ROBOT,
        token,
        expiresAt,
      },
    });
  } catch (error: unknown) {
    // Se falhar por constraint de PRIMARY (race condition), tenta apenas update
    if (error && typeof error === 'object' && 'code' in error && error.code === 'P2002') {
      await prisma.tokenIntegracao.update({
        where: { id: "robot-token" },
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

async function fetchStoredToken(): Promise<string | null> {
  const now = new Date();
  const stored = await prisma.tokenIntegracao.findFirst({
    where: {
      tipo: TokenIntegracaoTipo.ROBOT,
      ativo: true,
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

export function decodeTokenPayload(accessToken: string): Record<string, unknown> | null {
  if (!accessToken) {
    return null;
  }

  const [, payload] = accessToken.split(".");

  if (!payload) return null;

  try {
    const json = Buffer.from(payload, "base64").toString("utf-8");
    const data = JSON.parse(json) as Record<string, unknown>;

    return data;
  } catch (error) {
    console.error("[NotaAPI] Erro ao decodificar token", error);
    return null;
  }
}

export function getPrestadorIdFromToken(accessToken: string): string | null {
  const payload = decodeTokenPayload(accessToken);
  
  if (!payload) {
    return null;
  }

  // Possíveis nomes de campos para o prestadorId no token
  const prestadorId = payload.prestadorId || payload.PrestadorId || payload.prestador_id || payload.idPrestador || payload.IdPrestador;
  
  return prestadorId ? String(prestadorId) : null;
}

function resolveExpiration(accessToken: string, expiresIn?: number): Date {
  if (expiresIn && expiresIn > 0) {
    return new Date(Date.now() + (expiresIn - SAFETY_WINDOW_SECONDS) * 1000);
  }

  const exp = decodeTokenExp(accessToken);

  if (exp) {
    return new Date(exp * 1000);
  }

  return new Date(Date.now() + 45 * 60 * 1000);
}

async function requestRobotToken(): Promise<string> {
  const body = {
    clientId: env.ROBOT_CLIENT_ID,
    clientSecret: env.ROBOT_CLIENT_SECRET,
    scope: env.ROBOT_SCOPE,
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
  const prestadorId = getPrestadorIdFromToken(accessToken);
  console.log("[NotaAPI] PrestadorId extraído do token:", prestadorId);

  const expiresAt = resolveExpiration(accessToken, expiresIn);
  await persistToken(accessToken, expiresAt);

  return accessToken;
}

export async function getRobotToken(): Promise<string> {
  const cached = await fetchStoredToken();

  if (cached) {
    return cached;
  }

  return requestRobotToken();
}

export async function authorizeNotaApi() {
  const token = await getRobotToken();

  notaApi.defaults.headers.common.Authorization = `Bearer ${token}`;
}
