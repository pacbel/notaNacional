import { AppError } from "@/lib/errors";

import { listarCertificados } from "./client";

type Nullable<T> = T | null | undefined;

interface ResolveCertificateIdInput {
  prestadorCnpj: string;
  provided?: Nullable<string>;
  dpsCertificado?: Nullable<string>;
  notaCertificado?: Nullable<string>;
  prestadorCertificado?: Nullable<string>;
}

export async function resolveCertificateId({
  prestadorCnpj,
  provided,
  dpsCertificado,
  notaCertificado,
  prestadorCertificado,
}: ResolveCertificateIdInput): Promise<string> {
  const fallbackId =
    provided?.trim() ||
    dpsCertificado?.trim() ||
    notaCertificado?.trim() ||
    prestadorCertificado?.trim();

  if (fallbackId) {
    return fallbackId;
  }

  const normalizedPrestadorCnpj = onlyDigits(prestadorCnpj);

  if (!normalizedPrestadorCnpj) {
    throw new AppError("Prestador sem CNPJ para resolução de certificado", 400);
  }

  const certificados = await listarCertificados();

  const candidatos = certificados.filter((certificado) => {
    const certificadoCnpj = onlyDigits(certificado.cnpj ?? "");

    if (!certificadoCnpj) {
      return false;
    }

    return certificadoCnpj === normalizedPrestadorCnpj;
  });

  if (candidatos.length === 0) {
    throw new AppError("Certificado não encontrado para o prestador", 404);
  }

  const [melhorCertificado] = candidatos.sort((a, b) => {
    const validadeA = parseDate(b.validadeFim) ?? new Date(0);
    const validadeB = parseDate(a.validadeFim) ?? new Date(0);

    return validadeA.getTime() - validadeB.getTime();
  });

  if (!melhorCertificado?.id) {
    throw new AppError("Resposta da API não retornou identificador de certificado", 502);
  }

  return melhorCertificado.id;
}

function onlyDigits(value: string): string {
  return value.replace(/\D/g, "");
}

function parseDate(value: string | undefined): Date | null {
  if (!value) {
    return null;
  }

  const parsed = new Date(value);

  return Number.isNaN(parsed.getTime()) ? null : parsed;
}
