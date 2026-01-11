import type { CancelamentoMotivoCodigo } from "../cancelamento-motivos";

const XML_INVALID_CHARACTERS = /[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g;
const EVENT_CODE = "101101";
const EVENT_DESCRIPTION = "Cancelamento de NFS-e";
const CHAVE_LENGTH = 50;
const INF_PED_REG_ID_LENGTH = 59;

function normalizeDigits(value: string): string {
  return value.replace(/\D/g, "");
}

function escapeXml(value: string): string {
  const sanitized = value.replace(XML_INVALID_CHARACTERS, "");

  return sanitized
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function sanitizeText(value: string): string {
  const sanitized = value.replace(XML_INVALID_CHARACTERS, "");
  return sanitized.replace(/\s{2,}/g, " ").trim();
}

function formatDateTimeOffset(date: Date): string {
  const timezoneOffset = date.getTimezoneOffset();
  const sign = timezoneOffset > 0 ? "-" : "+";
  const absoluteOffset = Math.abs(timezoneOffset);
  const hours = String(Math.floor(absoluteOffset / 60)).padStart(2, "0");
  const minutes = String(absoluteOffset % 60).padStart(2, "0");
  const adjusted = new Date(date.getTime() - timezoneOffset * 60000);

  return `${adjusted.toISOString().slice(0, 19)}${sign}${hours}:${minutes}`;
}

function compactXml(xml: string): string {
  return xml.replace(/>\s+</g, "><").replace(/\r?\n/g, "");
}

function buildInfPedRegId(chaveAcesso: string): string {
  return `PRE${chaveAcesso}${EVENT_CODE}`;
}

export interface GenerateCancelamentoXmlInput {
  chaveAcesso: string;
  ambiente: number;
  verAplic: string;
  cnpjAutor: string;
  motivoCodigo: CancelamentoMotivoCodigo;
  motivoDescricao: string;
  justificativa: string;
  dataEvento?: Date;
}

export interface GenerateCancelamentoXmlOutput {
  xml: string;
  infPedRegId: string;
}

export function generateCancelamentoXml({
  chaveAcesso,
  ambiente,
  verAplic,
  cnpjAutor,
  motivoCodigo,
  motivoDescricao,
  justificativa,
  dataEvento,
}: GenerateCancelamentoXmlInput): GenerateCancelamentoXmlOutput {
  const normalizedChave = normalizeDigits(chaveAcesso);
  const normalizedCnpj = normalizeDigits(cnpjAutor);
  const sanitizedJustificativa = sanitizeText(justificativa).slice(0, 1024);
  const sanitizedDescricaoMotivo = sanitizeText(motivoDescricao);
  const eventDate = dataEvento ?? new Date();
  const dhEvento = formatDateTimeOffset(eventDate);
  if (normalizedChave.length !== CHAVE_LENGTH) {
    throw new Error(
      `Chave de acesso deve conter exatamente ${CHAVE_LENGTH} dígitos para o cancelamento. Recebido: ${normalizedChave.length}.`
    );
  }

  const infPedRegId = buildInfPedRegId(normalizedChave);

  if (infPedRegId.length !== INF_PED_REG_ID_LENGTH) {
    throw new Error(
      `Identificador do pedido de registro deve conter ${INF_PED_REG_ID_LENGTH} caracteres. Recebido: ${infPedRegId.length}.`
    );
  }

  const lines = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<pedRegEvento xmlns="http://www.sped.fazenda.gov.br/nfse" versao="1.00">',
    `  <infPedReg Id="${infPedRegId}">`,
    `    <tpAmb>${ambiente}</tpAmb>`,
    `    <verAplic>${escapeXml(verAplic)}</verAplic>`,
    `    <dhEvento>${dhEvento}</dhEvento>`,
    `    <CNPJAutor>${escapeXml(normalizedCnpj)}</CNPJAutor>`,
    `    <chNFSe>${escapeXml(normalizedChave)}</chNFSe>`,
    "    <e101101>",
    `      <xDesc>${EVENT_DESCRIPTION}</xDesc>`,
    `      <cMotivo>${motivoCodigo}</cMotivo>`,
    `      <xMotivo>${escapeXml(sanitizedJustificativa || sanitizedDescricaoMotivo)}</xMotivo>`,
    "    </e101101>",
    "  </infPedReg>",
    "</pedRegEvento>",
  ];

  return {
    xml: compactXml(
      lines
        .filter((line): line is string => Boolean(line))
        .map((line) => line.trim())
        .join(""),
    ),
    infPedRegId,
  };
}
