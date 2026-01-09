import { NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcrypt";
import { v4 as uuid } from "uuid";

import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/email";
import { generateMfaCode, hashToken } from "@/lib/security";
import { getEnv } from "@/lib/env";
import { MFA_CODE_EXPIRATION_MINUTES } from "@/lib/constants";
import { MfaChallengeMotivo } from "@prisma/client";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);

  const parseResult = loginSchema.safeParse(body);

  if (!parseResult.success) {
    return NextResponse.json(
      { message: "Credenciais inválidas" },
      { status: 400 }
    );
  }

  const { email, password } = parseResult.data;

  const usuario = await prisma.usuario.findUnique({ where: { email } });

  if (!usuario || !usuario.ativo) {
    return NextResponse.json(
      { message: "Credenciais inválidas" },
      { status: 401 }
    );
  }

  const senhaValida = await bcrypt.compare(password, usuario.senhaHash);

  if (!senhaValida) {
    return NextResponse.json(
      { message: "Credenciais inválidas" },
      { status: 401 }
    );
  }

  const now = new Date();

  await prisma.mfaChallenge.updateMany({
    where: {
      usuarioId: usuario.id,
      ativo: true,
      resolvedAt: null,
    },
    data: {
      ativo: false,
    },
  });

  const code = generateMfaCode();
  const token = uuid();
  const expiresAt = new Date(now.getTime() + MFA_CODE_EXPIRATION_MINUTES * 60 * 1000);

  const challenge = await prisma.mfaChallenge.create({
    data: {
      usuarioId: usuario.id,
      token,
      codeHash: hashToken(code),
      motivo: MfaChallengeMotivo.LOGIN,
      expiresAt,
    },
  });

  const env = getEnv();

  await sendEmail({
    to: [usuario.email],
    subject: env.MFA_EMAIL_ASSUNTO,
    html: `
      <p>Olá, ${usuario.nome.split(" ")[0]}!</p>
      <p>Seu código de verificação é:</p>
      <p style="font-size: 24px; font-weight: bold; letter-spacing: 8px;">${code}</p>
      <p>O código expira em ${MFA_CODE_EXPIRATION_MINUTES} minutos.</p>
    `,
  });

  return NextResponse.json({ challengeToken: challenge.token });
}
