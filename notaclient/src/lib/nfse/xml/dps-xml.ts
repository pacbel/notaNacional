import { Prisma, type TipoDocumento } from "@prisma/client";

const INF_DPS_ID_LENGTH = 45;
const CODIGO_MUNICIPIO_LENGTH = 7;
const CNPJ_LENGTH = 14;
const SERIE_LENGTH = 5;
const NDPS_LENGTH = 15;
const XML_INVALID_CHARACTERS = /[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g;
const DESCRIPTION_ALLOWED_CHARS = /[^0-9A-Za-zÀ-ÖØ-öø-ÿ .,;:!?'"()\-_/]/g;

function compactXml(xml: string): string {
  return xml.replace(/>\s+</g, "><").replace(/\r?\n/g, "");
}

export interface PartyBase {
  cnpj: string;
  codigoMunicipio: string;
  inscricaoMunicipal?: string | null;
  telefone?: string | null;
  email?: string | null;
}

export interface TomadorBase {
  tipoDocumento: TipoDocumento | "CPF" | "CNPJ";
  documento: string;
  nomeRazaoSocial: string;
  codigoMunicipio: string;
  logradouro: string;
  numero: string;
  bairro: string;
  complemento?: string | null;
  cep?: string | null;
  telefone?: string | null;
  email?: string | null;
}

export interface ServicoBase {
  descricao: string;
  valorUnitario: Prisma.Decimal | number;
  codigoTributacaoMunicipal: string;
  codigoTributacaoNacional: string;
  codigoNbs?: string | null;
  aliquotaIss?: Prisma.Decimal | number | null;
}

export interface ConfiguracaoBase {
  ambGer: number | null;
  tpAmb: number | null;
  verAplic: string;
  tpEmis: number;
  opSimpNac: number | null;
  regEspTrib: number | null;
  tribISSQN: number;
  tpImunidade: number | null;
  tpRetISSQN: number;
  pTotTribFed: Prisma.Decimal | number;
  pTotTribEst: Prisma.Decimal | number;
  pTotTribMun: Prisma.Decimal | number;
  xLocPrestacao: string;
}

export interface GenerateDpsXmlInput {
  identificador: string;
  numero: number;
  serie: number;
  competencia: Date;
  emissao: Date;
  prestador: PartyBase;
  tomador: TomadorBase;
  servico: ServicoBase;
  configuracao: ConfiguracaoBase;
  observacoes?: string | null;
}

export function generateDpsXml(input: GenerateDpsXmlInput): string {
  const tpAmbValue = input.configuracao.tpAmb ?? input.configuracao.ambGer;
  const tpAmb = resolveTpAmb(tpAmbValue);
  const serieId = resolveSerie(input.serie);
  const numeroId = resolveNumero(input.numero);
  const infDpsId = resolveInfDpsId(input, tpAmb, serieId, numeroId);
  const serie = serieId;
  const numero = String(Math.trunc(input.numero));
  const competenciaData = formatDate(input.competencia);
  const dataEmissao = formatDateTimeOffset(input.emissao);
  const documentoTomadorTag = input.tomador.tipoDocumento === "CNPJ" ? "CNPJ" : "CPF";
  const telefoneTomador = normalizeDigits(input.tomador.telefone);
  const cepTomador = normalizeDigits(input.tomador.cep);
  
  const valorServico = formatMoney(input.servico.valorUnitario);
  const totalTribFederal = formatMoney(input.configuracao.pTotTribFed ?? 0);
  const totalTribEstadual = formatMoney(input.configuracao.pTotTribEst ?? 0);
  const totalTribMunicipal = formatMoney(input.configuracao.pTotTribMun ?? 0);
  const aliquotaIss = formatPercentage(input.servico.aliquotaIss);

  const shouldIncludeImunidade = input.configuracao.tribISSQN === 2;
  const tpImunidade = shouldIncludeImunidade ? input.configuracao.tpImunidade ?? 0 : null;
  const opSimpNac = String(input.configuracao.opSimpNac ?? 1);
  const regEspTrib = String(input.configuracao.regEspTrib ?? 0);
  const serviceDescription = sanitizeDescription(input.servico.descricao);
  const informacoesComplementares = sanitizeDescription(input.observacoes ?? "");

  const lines: (string | null)[] = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<DPS xmlns="http://www.sped.fazenda.gov.br/nfse" versao="1.01">',
    `  <infDPS Id="${escapeXml(infDpsId)}">`,
    `    <tpAmb>${tpAmb}</tpAmb>`,
    `    <dhEmi>${escapeXml(dataEmissao)}</dhEmi>`,
    `    <verAplic>${escapeXml(input.configuracao.verAplic)}</verAplic>`,
    `    <serie>${escapeXml(serie)}</serie>`,
    `    <nDPS>${escapeXml(numero)}</nDPS>`,
    `    <dCompet>${competenciaData}</dCompet>`,
    `    <tpEmit>${input.configuracao.tpEmis}</tpEmit>`,
    `    <cLocEmi>${escapeXml(input.prestador.codigoMunicipio)}</cLocEmi>`,
    "    <prest>",
    `      <CNPJ>${escapeXml(input.prestador.cnpj)}</CNPJ>`,
    input.prestador.telefone ? `      <fone>${escapeXml(input.prestador.telefone)}</fone>` : null,
    input.prestador.email ? `      <email>${escapeXml(input.prestador.email)}</email>` : null,
    "      <regTrib>",
    `        <opSimpNac>${escapeXml(opSimpNac)}</opSimpNac>`,
    `        <regEspTrib>${escapeXml(regEspTrib)}</regEspTrib>`,
    "      </regTrib>",
    "    </prest>",
    "    <toma>",
    `      <${documentoTomadorTag}>${escapeXml(input.tomador.documento)}</${documentoTomadorTag}>`,
    `      <xNome>${escapeXml(input.tomador.nomeRazaoSocial)}</xNome>`,
    "      <end>",
    "        <endNac>",
    `          <cMun>${escapeXml(input.tomador.codigoMunicipio)}</cMun>`,
    cepTomador ? `          <CEP>${cepTomador}</CEP>` : null,
    "        </endNac>",
    `        <xLgr>${escapeXml(input.tomador.logradouro)}</xLgr>`,
    `        <nro>${escapeXml(input.tomador.numero)}</nro>`,
    input.tomador.complemento ? `        <xCpl>${escapeXml(input.tomador.complemento)}</xCpl>` : null,
    `        <xBairro>${escapeXml(input.tomador.bairro)}</xBairro>`,
    "      </end>",
    telefoneTomador ? `      <fone>${telefoneTomador}</fone>` : null,
    input.tomador.email ? `      <email>${escapeXml(input.tomador.email)}</email>` : null,
    "    </toma>",
    "    <serv>",
    "      <locPrest>",
    `        <cLocPrestacao>${escapeXml(input.configuracao.xLocPrestacao)}</cLocPrestacao>`,
    "      </locPrest>",
    "      <cServ>",
    `        <cTribNac>${escapeXml(input.servico.codigoTributacaoNacional)}</cTribNac>`,
    `        <cTribMun>${escapeXml(input.servico.codigoTributacaoMunicipal)}</cTribMun>`,
    `        <xDescServ>${escapeXml(serviceDescription)}</xDescServ>`,
    "      </cServ>",
    informacoesComplementares ? "      <infoCompl>" : null,
    informacoesComplementares ? `        <xInfComp>${escapeXml(informacoesComplementares)}</xInfComp>` : null,
    informacoesComplementares ? "      </infoCompl>" : null,
    "    </serv>",
    "    <valores>",
    "      <vServPrest>",
    `        <vServ>${valorServico}</vServ>`,
    "      </vServPrest>",
    "      <trib>",
    "        <tribMun>",
    `          <tribISSQN>${input.configuracao.tribISSQN}</tribISSQN>`,
               tpImunidade !== null ? `          <tpImunidade>${tpImunidade}</tpImunidade>` : null,
    `          <tpRetISSQN>${input.configuracao.tpRetISSQN}</tpRetISSQN>`,
               // APENAS pAliq é permitido aqui. vISSQN e vBC causariam erro de Schema.
               aliquotaIss ? `          <pAliq>${aliquotaIss}</pAliq>` : null,
    "        </tribMun>",
    "        <totTrib>",
    "          <pTotTrib>",
    `            <pTotTribFed>${totalTribFederal}</pTotTribFed>`,
    `            <pTotTribEst>${totalTribEstadual}</pTotTribEst>`,
    `            <pTotTribMun>${totalTribMunicipal}</pTotTribMun>`,
    "          </pTotTrib>",
    "        </totTrib>",
    "      </trib>",
    "    </valores>",
    "  </infDPS>",
    "</DPS>",
  ];

  const rawXml = lines
    .filter((line): line is string => Boolean(line))
    .map((line) => line.trim())
    .join("");

  return compactXml(rawXml);
}

// --- Funções Auxiliares ---
function resolveInfDpsId(input: GenerateDpsXmlInput, tpAmb: string, serie: string, numero: string): string {
  const cLocEmi = resolveCodigoMunicipio(input.prestador.codigoMunicipio);
  const cnpj = resolveCnpj(input.prestador.cnpj);
  return `DPS${cLocEmi}${tpAmb}${cnpj}${serie}${numero}`;
}
function resolveTpAmb(value: number | null | undefined): string { return String(value ?? 2); }
function resolveCodigoMunicipio(value: string): string { return (normalizeDigits(value) ?? "").padStart(7, "0"); }
function resolveCnpj(value: string): string { return (normalizeDigits(value) ?? ""); }
function resolveSerie(value: number): string { return String(Math.trunc(value)).padStart(5, "0"); }
function resolveNumero(value: number): string { return String(Math.trunc(value)).padStart(15, "0"); }
function formatDate(date: Date): string { return date.toISOString().slice(0, 10); }
function formatDateTimeOffset(date: Date): string {
  const offset = date.getTimezoneOffset();
  const sign = offset > 0 ? "-" : "+";
  const abs = Math.abs(offset);
  const hh = String(Math.floor(abs / 60)).padStart(2, "0");
  const mm = String(abs % 60).padStart(2, "0");
  const adjusted = new Date(date.getTime() - offset * 60000);
  return `${adjusted.toISOString().slice(0, 19)}${sign}${hh}:${mm}`;
}
function formatMoney(value: Prisma.Decimal | number): string {
  return (value instanceof Prisma.Decimal ? value.toNumber() : value).toFixed(2);
}
function formatPercentage(value: Prisma.Decimal | number | null | undefined): string | null {
  if (value === null || value === undefined) return null;
  const num = value instanceof Prisma.Decimal ? value.toNumber() : value;
  return num === 0 ? null : num.toFixed(2);
}
function sanitizeDescription(value: string | null | undefined): string {
  if (!value) return "";
  return value.trim().replace(XML_INVALID_CHARACTERS, "").replace(DESCRIPTION_ALLOWED_CHARS, " ").replace(/\s{2,}/g, " ").trim();
}
function escapeXml(value: string | null | undefined): string {
  if (!value) return "";
  return value.replace(XML_INVALID_CHARACTERS, "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");
}
function normalizeDigits(value?: string | null): string | null {
  return value ? value.replace(/\D/g, "") || null : null;
}