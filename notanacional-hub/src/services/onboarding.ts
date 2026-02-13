import { enviarNfseEmail } from "@/services/nfse";
import type { EnviarNfseEmailRequest } from "@/types/nfse";
import { obterTokenRobo } from "@/services/auth";
import type { RobotAuthRequest } from "@/types/auth";

export interface SendGestorMfaPayload {
  nome: string;
  email: string;
  senha: string;
}

export interface SendGestorMfaResponse {
  email: string;
  codigoEnviado: boolean;
  expiraEm: string;
  mensagem?: string;
  token: string;
}

export interface ConfirmGestorMfaPayload {
  email: string;
  codigo: string;
  token?: string | null;
}

export interface ConfirmGestorMfaResponse {
  sucesso: boolean;
  mensagem?: string;
  token?: string;
}

const MFA_TOKEN_DURATION_MINUTES = 10;
const MFA_CODE_LENGTH = 6;

interface MfaTokenPayload {
  codigo: string;
  expiraEm: string;
}

function generateNumericCode(length = MFA_CODE_LENGTH) {
  const max = 10 ** length;
  const random = Math.floor(Math.random() * max);
  return random.toString().padStart(length, "0");
}

function sanitizeHtml(value: string) {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

interface ServiceRobotCredentials {
  clientId: string;
  clientSecret: string;
  scope: string;
}

function buildMfaEmailPayload({
  nome,
  email,
  codigo,
  senha,
}: SendGestorMfaPayload & { codigo: string }): EnviarNfseEmailRequest {
  const safeNome = sanitizeHtml(nome.trim().length > 0 ? nome : "Usuário");
  const safeSenha = sanitizeHtml(senha);

  const corpoHtml = `<!DOCTYPE html>
<html lang="pt-BR">
  <head>
    <meta charSet="utf-8" />
    <title>Código de verificação</title>
    <style>
      body { font-family: Arial, Helvetica, sans-serif; color: #1f2937; }
      .code { font-size: 24px; letter-spacing: 8px; font-weight: bold; color: #1d4ed8; }
      .container { max-width: 520px; margin: 0 auto; padding: 16px; background: #f8fafc; border-radius: 12px; border: 1px solid #e2e8f0; }
    </style>
  </head>
  <body>
    <div class="container">
      <p>Olá, <strong>${safeNome}</strong>!</p>
      <p>Recebemos um pedido para criar o usuário gestor no NFSe Hub. Utilize o código abaixo para validar o cadastro:</p>
      <p class="code">${codigo}</p>
      <p>O código expira em ${MFA_TOKEN_DURATION_MINUTES} minutos. Caso não tenha solicitado, ignore este e-mail.</p>
      <p style="margin-top:32px;">Atenciosamente,<br /><strong>Equipe Pacbel Sistemas</strong></p>
    </div>
  </body>
</html>`;

  return {
    destinatarios: [email],
    assunto: "Código de verificação - Usuário gestor",
    corpoHtml,
  };
}

function encodeToken(payload: MfaTokenPayload) {
  return JSON.stringify(payload);
}

function decodeToken(token: string): MfaTokenPayload | null {
  try {
    const parsed = JSON.parse(token) as MfaTokenPayload;
    if (!parsed?.codigo || !parsed?.expiraEm) {
      return null;
    }
    return parsed;
  } catch (error) {
    console.error("[Onboarding][MFA] Token inválido", { token, error });
    return null;
  }
}

function getServiceRobotCredentials(): ServiceRobotCredentials {
  const clientId = process.env.NEXT_PUBLIC_ONBOARDING_MFA_ROBOT_CLIENT_ID;
  const clientSecret = process.env.NEXT_PUBLIC_ONBOARDING_MFA_ROBOT_CLIENT_SECRET;
  const scope = process.env.NEXT_PUBLIC_ONBOARDING_MFA_ROBOT_SCOPE ?? "nfse.email";

  if (!clientId || !clientSecret) {
    throw new Error(
      "Credenciais do robô para envio do e-mail MFA não configuradas. Defina NEXT_PUBLIC_ONBOARDING_MFA_ROBOT_CLIENT_ID e NEXT_PUBLIC_ONBOARDING_MFA_ROBOT_CLIENT_SECRET."
    );
  }

  return { clientId, clientSecret, scope };
}

async function obterTokenDeServico() {
  const { clientId, clientSecret, scope } = getServiceRobotCredentials();
  const payload: RobotAuthRequest = {
    clientId,
    clientSecret,
    scope,
  };

  console.info("[Onboarding][MFA] Autenticando robô para envio de e-mail", {
    clientId,
    scope,
    timestamp: new Date().toISOString(),
  });

  const response = await obterTokenRobo(payload);
  const token = response?.accessToken;

  if (!token) {
    throw new Error("Não foi possível obter token do robô para envio de e-mail.");
  }

  return token;
}

export async function sendGestorMfa(payload: SendGestorMfaPayload) {
  console.info("[Onboarding][MFA] Preparando envio de código", {
    email: payload.email,
    nome: payload.nome,
    timestamp: new Date().toISOString(),
  });

  const codigo = generateNumericCode();
  const expiraEm = new Date(Date.now() + MFA_TOKEN_DURATION_MINUTES * 60 * 1000).toISOString();
  const emailPayload = buildMfaEmailPayload({ ...payload, codigo });

  try {
    const tokenDeServico = await obterTokenDeServico();
    await enviarNfseEmail(emailPayload, tokenDeServico);

    const token = encodeToken({ codigo, expiraEm });

    console.info("[Onboarding][MFA] Código enviado com sucesso", {
      email: payload.email,
      expiraEm,
    });

    return {
      email: payload.email,
      codigoEnviado: true,
      expiraEm,
      mensagem: "Código enviado para o e-mail informado.",
      token,
    } satisfies SendGestorMfaResponse;
  } catch (error) {
    console.error("[Onboarding][MFA] Falha ao enviar código", {
      email: payload.email,
      nome: payload.nome,
      timestamp: new Date().toISOString(),
      erro: error,
    });
    throw error;
  }
}

export async function confirmGestorMfa(payload: ConfirmGestorMfaPayload) {
  console.info("[Onboarding][MFA] Validando código informado", {
    email: payload.email,
    possuiToken: Boolean(payload.token),
    codigoLength: payload.codigo.length,
    timestamp: new Date().toISOString(),
  });

  if (!payload.token) {
    return {
      sucesso: false,
      mensagem: "Código expirado. Solicite um novo código.",
    } satisfies ConfirmGestorMfaResponse;
  }

  const tokenPayload = decodeToken(payload.token);
  if (!tokenPayload) {
    return {
      sucesso: false,
      mensagem: "Token inválido. Reenvie o código.",
    } satisfies ConfirmGestorMfaResponse;
  }

  const expiresAt = new Date(tokenPayload.expiraEm).getTime();
  if (Number.isNaN(expiresAt) || expiresAt < Date.now()) {
    return {
      sucesso: false,
      mensagem: "Código expirado. Solicite um novo código.",
    } satisfies ConfirmGestorMfaResponse;
  }

  const sucesso = payload.codigo.trim() === tokenPayload.codigo;

  if (!sucesso) {
    return {
      sucesso: false,
      mensagem: "Código inválido. Verifique os dígitos e tente novamente.",
      token: payload.token,
    } satisfies ConfirmGestorMfaResponse;
  }

  console.info("[Onboarding][MFA] Código validado com sucesso", {
    email: payload.email,
  });

  return {
    sucesso: true,
    token: payload.token,
  } satisfies ConfirmGestorMfaResponse;
}
