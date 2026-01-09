import { NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { buildSessionCookie, collectRequestMeta } from "@/lib/auth";
import { hashToken, generateSessionToken } from "@/lib/security";
import { SESSION_TTL_HOURS } from "@/lib/constants";

const verifySchema = z.object({
  challengeToken: z.string().uuid(),
  code: z.string().min(1),
});

export async function POST(request: Request) {
  const payload = await request.json().catch(() => null);

  const parseResult = verifySchema.safeParse(payload);

  if (!parseResult.success) {
    return NextResponse.json({ message: "Dados inválidos" }, { status: 400 });
  }

  const { challengeToken, code } = parseResult.data;

  const challenge = await prisma.mfaChallenge.findUnique({
    where: { token: challengeToken },
  });

  if (!challenge || !challenge.ativo || challenge.resolvedAt) {
    return NextResponse.json({ message: "Desafio MFA inválido" }, { status: 401 });
  }

  if (challenge.expiresAt < new Date()) {
    return NextResponse.json({ message: "Código expirado" }, { status: 401 });
  }

  const codeValid = challenge.codeHash === hashToken(code);

  if (!codeValid) {
    return NextResponse.json({ message: "Código inválido" }, { status: 401 });
  }

  const usuario = await prisma.usuario.findUnique({ where: { id: challenge.usuarioId } });

  if (!usuario || !usuario.ativo) {
    return NextResponse.json({ message: "Usuário inativo" }, { status: 403 });
  }

  const sessionToken = generateSessionToken();
  const tokenHash = hashToken(sessionToken);
  const expiresAt = new Date(Date.now() + SESSION_TTL_HOURS * 60 * 60 * 1000);
  const meta = await collectRequestMeta();

  await prisma.$transaction([
    prisma.mfaChallenge.update({
      where: { id: challenge.id },
      data: {
        resolvedAt: new Date(),
        ativo: false,
      },
    }),
    prisma.sessao.create({
      data: {
        usuarioId: usuario.id,
        tokenHash,
        expiresAt,
        userAgent: meta.userAgent,
        ip: meta.ip,
      },
    }),
  ]);

  const response = NextResponse.json({ success: true });
  response.cookies.set(buildSessionCookie(sessionToken));

  return response;
}
