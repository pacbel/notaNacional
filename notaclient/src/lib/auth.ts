import "server-only";

import { cookies, headers } from "next/headers";

import { prisma } from "@/lib/prisma";
import { hashToken } from "@/lib/security";
import { SESSION_COOKIE_NAME, SESSION_TTL_HOURS } from "@/lib/constants";

const SESSION_MAX_AGE_SECONDS = SESSION_TTL_HOURS * 60 * 60;

export async function getCurrentUser() {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (!sessionToken) {
    return null;
  }

  const tokenHash = hashToken(sessionToken);
  const session = await prisma.sessao.findFirst({
    where: {
      tokenHash,
      ativo: true,
      expiresAt: {
        gt: new Date(),
      },
    },
    include: {
      usuario: true,
    },
  });

  if (!session || !session.usuario.ativo) {
    return null;
  }

  return {
    id: session.usuario.id,
    nome: session.usuario.nome,
    email: session.usuario.email,
  };
}

export async function invalidateSession(token: string) {
  const tokenHash = hashToken(token);

  await prisma.sessao.updateMany({
    where: { tokenHash },
    data: { ativo: false },
  });
}

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
