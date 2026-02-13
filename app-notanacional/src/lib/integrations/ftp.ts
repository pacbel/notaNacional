import { Client, type AccessOptions, type FTPError } from "basic-ftp";
import { Readable } from "node:stream";

import { prisma } from "@/lib/prisma";

export interface FtpAttachment {
  fileName: string;
  contentBase64: string;
}

interface UploadPrestadorFilesToFtpParams {
  prestadorId: string;
  attachments: FtpAttachment[];
}

function sanitizeFtpHost(rawHost: string): URL | null {
  const trimmed = rawHost.trim();

  if (!trimmed) {
    return null;
  }

  try {
    const normalized = trimmed.includes("://") ? trimmed : `ftp://${trimmed}`;
    return new URL(normalized);
  } catch (error) {
    console.error("[FTP] Host inválido", { rawHost, error });
    return null;
  }
}

export async function uploadPrestadorFilesToFtp({
  prestadorId,
  attachments,
}: UploadPrestadorFilesToFtpParams): Promise<void> {
  if (!prestadorId) {
    throw new Error("PrestadorId é obrigatório");
  }

  if (!attachments.length) {
    console.info("[FTP] Nenhum anexo informado, nada a enviar", { prestadorId });
    return;
  }

  const configuracao = await prisma.configuracaoDps.findUnique({
    where: { prestadorId },
    select: {
      ftpHost: true,
      ftpUsuario: true,
      ftpSenha: true,
    },
  });

  const ftpHost = configuracao?.ftpHost?.trim();
  const ftpUsuario = configuracao?.ftpUsuario?.trim();
  const ftpSenha = configuracao?.ftpSenha ?? undefined;

  if (!ftpHost || !ftpUsuario || !ftpSenha) {
    console.info("[FTP] Configuração incompleta, envio ignorado", {
      prestadorId,
      hasHost: Boolean(ftpHost),
      hasUsuario: Boolean(ftpUsuario),
      hasSenha: Boolean(ftpSenha),
    });
    return;
  }

  const ftpUrl = sanitizeFtpHost(ftpHost);

  if (!ftpUrl) {
    console.error("[FTP] Host não pôde ser interpretado", { prestadorId, ftpHost });
    return;
  }

  console.info("[FTP] Configuração resolvida", {
    prestadorId,
    host: ftpUrl.hostname,
    port: ftpUrl.port || "default",
    secure: ftpUrl.protocol,
    path: ftpUrl.pathname || "/",
    attachments: attachments.length,
  });

  const access: AccessOptions = {
    host: ftpUrl.hostname,
    port: ftpUrl.port ? Number(ftpUrl.port) : undefined,
    user: ftpUsuario,
    password: ftpSenha,
    secure: ftpUrl.protocol === "ftps:" || ftpUrl.protocol === "ftpes:",
  };

  const client = new Client();
  client.ftp.verbose = false;

  const workingDir = ftpUrl.pathname && ftpUrl.pathname !== "/" ? ftpUrl.pathname : null;

  try {
    console.info("[FTP] Conectando ao servidor", {
      prestadorId,
      host: access.host,
      port: access.port ?? 21,
      secure: access.secure,
      workingDir,
    });

    await client.access(access);

    console.info("[FTP] Autenticação concluída", {
      prestadorId,
      host: access.host,
    });

    if (workingDir) {
      await client.ensureDir(workingDir);
      await client.cd(workingDir);
      console.info("[FTP] Diretório preparado", { prestadorId, workingDir });
    }

    for (const attachment of attachments) {
      const fileName = attachment.fileName?.trim() || `${Date.now()}.dat`;
      const buffer = Buffer.from(attachment.contentBase64, "base64");
      const stream = Readable.from(buffer);

      console.info("[FTP] Enviando arquivo", { prestadorId, fileName, size: buffer.length });
      await client.uploadFrom(stream, fileName);
      console.info("[FTP] Arquivo enviado", { prestadorId, fileName });
    }

    console.info("[FTP] Upload concluído", { prestadorId, quantidade: attachments.length });
  } catch (error) {
    const normalizedError = error instanceof Error ? { message: error.message, name: error.name, stack: error.stack } : { error };
    const errorCode = (error as FTPError | undefined)?.code;

    console.error("[FTP] Falha ao enviar arquivos", {
      prestadorId,
      host: access.host,
      code: errorCode,
      ...normalizedError,
    });
    throw error;
  } finally {
    console.info("[FTP] Encerrando conexão", { prestadorId });
    client.close();
  }
}
