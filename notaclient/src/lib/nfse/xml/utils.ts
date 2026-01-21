import { Prisma } from "@prisma/client";

export const INF_DPS_ID_LENGTH = 45;
export const CODIGO_MUNICIPIO_LENGTH = 7;
export const CNPJ_LENGTH = 14;
export const CPF_LENGTH = 11;
export const SERIE_LENGTH = 5;
export const NDPS_LENGTH = 15;
export const XML_INVALID_CHARACTERS = /[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g;
export const DESCRIPTION_ALLOWED_CHARS = /[^0-9A-Za-zÀ-ÖØ-öø-ÿ .,;:!?'"()\-_\/]/g;
export const DEFAULT_NBS_CODE = "115090000";

export function resolveTpAmb(value: number | null | undefined): string {
  return String(value ?? 2);
}

export function resolveCodigoMunicipio(value: string): string {
  return (normalizeDigits(value) ?? "").padStart(7, "0");
}

export function resolveCnpj(value: string): string {
  return normalizeDigits(value) ?? "";
}

export function resolveSerieParaId(value: number): string {
  return String(Math.trunc(value)).padStart(SERIE_LENGTH, "0");
}

export function resolveSerieParaTag(value: number): string {
  return String(Math.trunc(value)).padStart(SERIE_LENGTH, "0");
}

export function resolveNumero15DigitosParaId(value: number): string {
  return String(Math.trunc(value)).padStart(NDPS_LENGTH, "0");
}

export function resolveNumeroSemZeros(value: number): string {
  return String(Math.trunc(value));
}

export function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function formatDateTimeOffset(date: Date): string {
  const offset = date.getTimezoneOffset();
  const sign = offset > 0 ? "-" : "+";
  const abs = Math.abs(offset);
  const hh = String(Math.floor(abs / 60)).padStart(2, "0");
  const mm = String(abs % 60).padStart(2, "0");
  const adjusted = new Date(date.getTime() - offset * 60000);
  return `${adjusted.toISOString().slice(0, 19)}${sign}${hh}:${mm}`;
}

export function formatMoney(value: Prisma.Decimal | number): string {
  return (value instanceof Prisma.Decimal ? value.toNumber() : value).toFixed(2);
}

export function formatPercentage(value: Prisma.Decimal | number | null | undefined): string {
  if (value === null || value === undefined) {
    return "0.00";
  }

  const num = value instanceof Prisma.Decimal ? value.toNumber() : value;
  return num.toFixed(2);
}

export function sanitizeDescription(value: string | null | undefined): string {
  if (!value) return "";
  return value.trim().replace(XML_INVALID_CHARACTERS, "").replace(DESCRIPTION_ALLOWED_CHARS, " ").replace(/\s{2,}/g, " ").trim();
}

export function normalizeDigits(value?: string | null): string | null {
  return value ? value.replace(/\D/g, "") || null : null;
}

export function formatCodigoTributacaoNacional(value: string): string {
  const digitsOnly = value.replace(/\D/g, "");

  if (digitsOnly.length > 0) {
    return digitsOnly;
  }

  return value.replace(/\D/g, "");
}
