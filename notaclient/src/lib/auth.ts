import "server-only";

import { cookies, headers } from "next/headers";
import { SESSION_COOKIE_NAME, SESSION_TTL_HOURS } from "@/lib/constants";
import { decodeTokenPayload } from "@/lib/notanacional-api";

const SESSION_MAX_AGE_SECONDS = SESSION_TTL_HOURS * 60 * 60;

export async function getCurrentUser() {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (!sessionToken) {
    return null;
  }

  // Decodificar o token JWT da API externa
  const payload = decodeTokenPayload(sessionToken);

  if (!payload) {
    return null;
  }

  // Verificar se o token expirou
  const exp = payload.exp as number | undefined;
  if (exp && exp * 1000 < Date.now()) {
    return null;
  }

  // Extrair informações do usuário do token
  const userId = payload.sub || payload.userId || payload.id || payload.nameid;
  const userName = payload.name || payload.userName || payload.unique_name;
  const userEmail = payload.email;

  if (!userId) {
    return null;
  }

  return {
    id: String(userId),
    nome: String(userName || "Usuário"),
    email: String(userEmail || ""),
  };
}

// Função removida - sessões são gerenciadas pela API externa

export function buildSessionCookie(token: string) {
  return {
    name: SESSION_COOKIE_NAME,
    value: token,
    httpOnly: true,
    secure: process.env.NODE_ENV !== "development",
    sameSite: "lax" as const,
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  };
}

export async function collectRequestMeta() {
  const requestHeaders = await headers();
  const ip = requestHeaders.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null;
  const userAgent = requestHeaders.get("user-agent");

  return { ip, userAgent };
}
