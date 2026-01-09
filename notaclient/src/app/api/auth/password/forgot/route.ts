import { NextResponse } from "next/server";
import { z } from "zod";
import { v4 as uuid } from "uuid";

import { prisma } from "@/lib/prisma";
import { getEnv } from "@/lib/env";
import { sendEmail } from "@/lib/email";
import { generateMfaCode, hashToken } from "@/lib/security";
import { MFA_CODE_EXPIRATION_MINUTES } from "@/lib/constants";
import { MfaChallengeMotivo } from "@prisma/client";

const forgotSchema = z.object({
  email: z.string().email(),
});

export async function POST(request: Request) {
  const payload = await request.json().catch(() => null);
  const parseResult = forgotSchema.safeParse(payload);

  if (!parseResult.success) {
    return NextResponse.json({ message: "Dados inválidos" }, { status: 400 });
  }

  const { email } = parseResult.data;

  const usuario = await prisma.usuario.findUnique({ where: { email } });

  if (!usuario || !usuario.ativo) {
    // Evitar enumerar usuários
    return NextResponse.json({ success: true });
  }

  await prisma.mfaChallenge.updateMany({
    where: {
      usuarioId: usuario.id,
      motivo: MfaChallengeMotivo.RECUPERACAO_SENHA,
      ativo: true,
      resolvedAt: null,
    },
    data: {
      ativo: false,
    },
  });

  const env = getEnv();
  const code = generateMfaCode();
  const token = uuid();
  const expiresAt = new Date(Date.now() + MFA_CODE_EXPIRATION_MINUTES * 60 * 1000);

  const challenge = await prisma.mfaChallenge.create({
    data: {
      usuarioId: usuario.id,
      token,
      codeHash: hashToken(code),
      motivo: MfaChallengeMotivo.RECUPERACAO_SENHA,
      expiresAt,
    },
  });

  const recoveryLink = `${env.APP_BASE_URL}/recuperar-senha?token=${challenge.token}`;

  await sendEmail({
    to: [usuario.email],
    subject: env.RECOVERY_EMAIL_ASSUNTO,
    html: `
      <p>Olá, ${usuario.nome.split(" ")[0]}!</p>
      <p>Recebemos uma solicitação para redefinir sua senha. Use o código abaixo ou acesse o link para continuar:</p>
      <p style="font-size: 24px; font-weight: bold; letter-spacing: 8px;">${code}</p>
      <p>Ou clique aqui: <a href="${recoveryLink}" target="_blank" rel="noopener noreferrer">Redefinir senha</a></p>
      <p>O código expira em ${MFA_CODE_EXPIRATION_MINUTES} minutos.</p>
      <p>Se você não solicitou, ignore este e-mail.</p>
    `,
  });

  return NextResponse.json({ success: true });
}
