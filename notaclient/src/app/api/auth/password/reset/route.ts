import { NextResponse } from "next/server";
import { z } from "zod";
import { hash } from "bcrypt";

import { prisma } from "@/lib/prisma";
import { hashToken } from "@/lib/security";
import { MfaChallengeMotivo } from "@prisma/client";

const resetSchema = z
  .object({
    token: z.string().uuid(),
    code: z.string().min(1),
    newPassword: z.string().min(8, "A nova senha precisa ter pelo menos 8 caracteres"),
    confirmPassword: z.string().min(8),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    path: ["confirmPassword"],
    message: "As senhas não conferem",
  });

export async function POST(request: Request) {
  const payload = await request.json().catch(() => null);
  const parseResult = resetSchema.safeParse(payload);

  if (!parseResult.success) {
    return NextResponse.json({ message: "Dados inválidos" }, { status: 400 });
  }

  const { token, code, newPassword } = parseResult.data;

  const challenge = await prisma.mfaChallenge.findUnique({
    where: { token },
    include: {
      usuario: true,
    },
  });

  if (!challenge || !challenge.ativo || challenge.motivo !== MfaChallengeMotivo.RECUPERACAO_SENHA) {
    return NextResponse.json({ message: "Solicitação inválida" }, { status: 400 });
  }

  if (!challenge.usuario || !challenge.usuario.ativo) {
    return NextResponse.json({ message: "Usuário inativo" }, { status: 403 });
  }

  if (challenge.expiresAt < new Date()) {
    return NextResponse.json({ message: "Código expirado" }, { status: 410 });
  }

  const codeHash = hashToken(code);

  if (codeHash !== challenge.codeHash) {
    return NextResponse.json({ message: "Código inválido" }, { status: 401 });
  }

  const newPasswordHash = await hash(newPassword, 10);

  await prisma.$transaction([
    prisma.usuario.update({
      where: { id: challenge.usuarioId },
      data: {
        senhaHash: newPasswordHash,
        updatedAt: new Date(),
      },
    }),
    prisma.sessao.updateMany({
      where: {
        usuarioId: challenge.usuarioId,
        ativo: true,
      },
      data: {
        ativo: false,
      },
    }),
    prisma.mfaChallenge.update({
      where: { id: challenge.id },
      data: {
        ativo: false,
        resolvedAt: new Date(),
      },
    }),
  ]);

  return NextResponse.json({ success: true });
}
