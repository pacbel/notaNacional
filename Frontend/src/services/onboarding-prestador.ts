import { apiFetch, ApiError } from "@/services/http";
import { getOnboardingRobotToken } from "@/services/onboarding-robot-auth";
import { extractUserFromToken } from "@/utils/auth";
import type {
  CreatePrestadorDto,
  PrestadorConfiguracaoDto,
  PrestadorDto,
  UpsertPrestadorConfiguracaoDto,
} from "@/types/prestadores";
import type { CreateRobotClientDto, RobotClientDto } from "@/types/robot-clients";
import type { CreateUsuarioDto, UsuarioDto } from "@/types/usuarios";

const PRESTADORES_BASE_PATH = "/api/prestadores";
const USUARIOS_BASE_PATH = "/api/usuarios";

export async function criarPrestadorOnboarding(
  payload: CreatePrestadorDto,
  token?: string
): Promise<PrestadorDto> {
  const authorizationToken = token ?? (await getOnboardingRobotToken());
  const timestamp = new Date().toISOString();

  console.info("[Onboarding][Prestador] Iniciando criação", {
    timestamp,
    cnpj: payload.cnpj,
    razaoSocial: payload.razaoSocial,
  });

  try {
    const prestador = await apiFetch<PrestadorDto>(PRESTADORES_BASE_PATH, {
      method: "POST",
      body: JSON.stringify(payload),
      authorizationToken,
      useSessionToken: false,
    });

    console.info("[Onboarding][Prestador] Prestador criado com sucesso", {
      timestamp: new Date().toISOString(),
      prestadorId: prestador.id,
      cnpj: prestador.cnpj,
    });

    return prestador;
  } catch (error) {
    console.error("[Onboarding][Prestador] Falha ao criar prestador", {
      timestamp: new Date().toISOString(),
      cnpj: payload.cnpj,
      erro: error,
    });
    throw error;
  }
}

function sanitizeString(value?: string | null): string {
  return value?.trim() ?? "";
}

function sanitizeOptionalSecret(value?: string | null): string | undefined {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

function sanitizeSmtpPort(value?: number | null): number {
  if (typeof value === "number" && Number.isFinite(value) && value > 0) {
    return value;
  }
  return 587;
}

function resolveBilhetagemStatus(creditoMensalPadrao?: number | null, bilhetagemHabilitada?: boolean | null): boolean {
  if (typeof bilhetagemHabilitada === "boolean") {
    return bilhetagemHabilitada;
  }

  if (typeof creditoMensalPadrao === "number" && Number.isFinite(creditoMensalPadrao) && creditoMensalPadrao > 0) {
    return true;
  }

  return false;
}

export async function copiarConfiguracaoPadraoParaPrestador(
  prestadorId: string,
  token?: string
): Promise<PrestadorConfiguracaoDto> {
  const authorizationToken = token ?? (await getOnboardingRobotToken());
  const robotUser = extractUserFromToken(authorizationToken);
  const basePrestadorId = robotUser?.prestadorId ?? undefined;
  const timestamp = new Date().toISOString();

  if (!basePrestadorId) {
    throw new Error(
      "Token do robô de onboarding não possui prestadorId associado. Configure o prestador base antes de prosseguir."
    );
  }

  console.info("[Onboarding][Configuracao] Buscando configuração base", {
    timestamp,
    basePrestadorId,
    destinoPrestadorId: prestadorId,
  });

  const baseConfiguracao = await obterConfiguracaoPrestadorOnboarding(basePrestadorId, authorizationToken);

  const versaoAplicacao = sanitizeString(baseConfiguracao.versaoAplicacao);
  if (!versaoAplicacao) {
    throw new Error(
      "Configuração do prestador base não possui versaoAplicacao definida. Ajuste a configuração para continuar."
    );
  }

  const smtpHost = sanitizeString(baseConfiguracao.smtpHost);
  const smtpUser = sanitizeString(baseConfiguracao.smtpUser);
  const smtpFrom = sanitizeString(baseConfiguracao.smtpFrom);
  const smtpFromName = sanitizeString(baseConfiguracao.smtpFromName);
  const smtpPasswordEncrypted = sanitizeOptionalSecret(baseConfiguracao.smtpPasswordEncrypted);
  const smtpPasswordPlanoBase = sanitizeOptionalSecret(baseConfiguracao.smtpPassword);
  const envSmtpPassword = sanitizeOptionalSecret(process.env.NEXT_PUBLIC_SMTP_PASSWORD);
  const smtpPassword = envSmtpPassword ?? smtpPasswordPlanoBase;

  if (!smtpPasswordEncrypted && !smtpPassword) {
    throw new Error(
      "Configuração do prestador base não possui segredo SMTP válido. Ajuste a configuração para continuar."
    );
  }

  const payload: UpsertPrestadorConfiguracaoDto = {
    versaoAplicacao,
    enviaEmailAutomatico: baseConfiguracao.enviaEmailAutomatico ?? false,
    smtpHost,
    smtpPort: sanitizeSmtpPort(baseConfiguracao.smtpPort),
    smtpSecure: baseConfiguracao.smtpSecure ?? false,
    smtpUser,
    smtpPassword,
    smtpPasswordEncrypted,
    smtpFrom,
    smtpFromName,
    bilhetagemHabilitada: resolveBilhetagemStatus(
      baseConfiguracao.creditoMensalPadrao,
      baseConfiguracao.bilhetagemHabilitada
    ),
    creditoMensalPadrao: baseConfiguracao.creditoMensalPadrao ?? null,
    saldoNotasDisponiveis: 0,
    competenciaSaldo: null,
  };

  try {
    console.info("[Onboarding][Configuracao] Aplicando configuração padrão", {
      timestamp,
      prestadorId,
      basePrestadorId,
      versaoAplicacao,
      possuiSmtpPasswordEncrypted: Boolean(smtpPasswordEncrypted),
      possuiSmtpPasswordPlano: Boolean(smtpPasswordPlanoBase),
      possuiSmtpPasswordEnv: Boolean(envSmtpPassword),
    });

    const configuracao = await apiFetch<PrestadorConfiguracaoDto>(`${PRESTADORES_BASE_PATH}/${prestadorId}/configuracao`, {
      method: "PUT",
      body: JSON.stringify(payload),
      authorizationToken,
      useSessionToken: false,
    });

    console.info("[Onboarding][Configuracao] Configuração aplicada com sucesso", {
      timestamp: new Date().toISOString(),
      prestadorId,
    });

    return configuracao;
  } catch (error) {
    if (error instanceof ApiError) {
      if (error.status === 401) {
        throw new Error("Token do robô inválido ou expirado ao aplicar configuração inicial. Gere um novo token e tente novamente.");
      }

      if (error.status === 403) {
        throw new Error(
          "Token do robô sem permissão para aplicar a configuração inicial. Ajuste as permissões ou configure manualmente."
        );
      }
    }

    console.error("[Onboarding][Configuracao] Falha ao aplicar configuração", {
      timestamp: new Date().toISOString(),
      prestadorId,
      basePrestadorId,
      erro: error,
    });

    throw error;
  }
}

export async function obterConfiguracaoPrestadorOnboarding(
  prestadorId: string,
  token?: string
): Promise<PrestadorConfiguracaoDto> {
  const authorizationToken = token ?? (await getOnboardingRobotToken());
  const timestamp = new Date().toISOString();

  console.info("[Onboarding][Configuracao] Consultando configuração", {
    timestamp,
    prestadorId,
  });

  try {
    const configuracao = await apiFetch<PrestadorConfiguracaoDto>(`${PRESTADORES_BASE_PATH}/${prestadorId}/configuracao`, {
      method: "GET",
      authorizationToken,
      useSessionToken: false,
    });

    console.info("[Onboarding][Configuracao] Consulta realizada", {
      timestamp: new Date().toISOString(),
      prestadorId,
    });

    return configuracao;
  } catch (error) {
    console.error("[Onboarding][Configuracao] Falha na consulta", {
      timestamp: new Date().toISOString(),
      prestadorId,
      erro: error,
    });

    throw error;
  }
}

export async function definirConfiguracaoPrestadorOnboarding(
  prestadorId: string,
  payload: UpsertPrestadorConfiguracaoDto,
  token?: string
): Promise<PrestadorConfiguracaoDto> {
  const authorizationToken = token ?? (await getOnboardingRobotToken());
  const timestamp = new Date().toISOString();

  console.info("[Onboarding][Configuracao] Atualizando configuração manualmente", {
    timestamp,
    prestadorId,
  });

  try {
    const configuracao = await apiFetch<PrestadorConfiguracaoDto>(`${PRESTADORES_BASE_PATH}/${prestadorId}/configuracao`, {
      method: "PUT",
      body: JSON.stringify(payload),
      authorizationToken,
      useSessionToken: false,
    });

    console.info("[Onboarding][Configuracao] Configuração atualizada manualmente", {
      timestamp: new Date().toISOString(),
      prestadorId,
    });

    return configuracao;
  } catch (error) {
    console.error("[Onboarding][Configuracao] Falha ao atualizar configuração manual", {
      timestamp: new Date().toISOString(),
      prestadorId,
      erro: error,
    });

    throw error;
  }
}

export async function criarRobotClientOnboarding(
  prestadorId: string,
  payload: CreateRobotClientDto,
  token?: string
): Promise<RobotClientDto> {
  const authorizationToken = token ?? (await getOnboardingRobotToken());
  const timestamp = new Date().toISOString();

  console.info("[Onboarding][Robot] Iniciando criação de client", {
    timestamp,
    prestadorId,
    nome: payload.nome,
    scopes: "nfse.cancelar nfse.certificados nfse.danfse nfse.email nfse.emitir nfse.robot",
  });

  try {
    const robot = await apiFetch<RobotClientDto>(`${PRESTADORES_BASE_PATH}/${prestadorId}/robot-clients`, {
      method: "POST",
      body: JSON.stringify(payload),
      authorizationToken,
      useSessionToken: false,
    });

    console.info("[Onboarding][Robot] Robô criado", {
      timestamp: new Date().toISOString(),
      prestadorId,
      robotId: robot.id,
      clientId: robot.clientId,
    });

    return robot;
  } catch (error) {
    console.error("[Onboarding][Robot] Falha na criação do robô", {
      timestamp: new Date().toISOString(),
      prestadorId,
      erro: error,
    });

    throw error;
  }
}

export async function criarUsuarioGestorOnboarding(payload: CreateUsuarioDto, token?: string): Promise<UsuarioDto> {
  const authorizationToken = token ?? (await getOnboardingRobotToken());
  const timestamp = new Date().toISOString();

  console.info("[Onboarding][UsuarioGestor] Iniciando criação de usuário", {
    email: payload.email,
    prestadorId: payload.prestadorId,
    timestamp,
  });

  try {
    const usuario = await apiFetch<UsuarioDto>(USUARIOS_BASE_PATH, {
      method: "POST",
      body: JSON.stringify(payload),
      authorizationToken,
      useSessionToken: false,
    });

    console.info("[Onboarding][UsuarioGestor] Usuário criado com sucesso", {
      usuarioId: usuario.id,
      email: usuario.email,
      prestadorId: usuario.prestadorId,
      timestamp: new Date().toISOString(),
    });

    return usuario;
  } catch (error) {
    console.error("[Onboarding][UsuarioGestor] Falha ao criar usuário", {
      email: payload.email,
      prestadorId: payload.prestadorId,
      timestamp: new Date().toISOString(),
      erro: error,
    });

    throw error;
  }
}
