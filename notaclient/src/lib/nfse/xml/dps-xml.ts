import { Prisma, type TipoDocumento } from "@prisma/client";

const INF_DPS_ID_LENGTH = 45;
const CODIGO_MUNICIPIO_LENGTH = 7;
const CNPJ_LENGTH = 14;
const SERIE_LENGTH = 5;
const NDPS_LENGTH = 15;
const XML_INVALID_CHARACTERS = /[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g;
const DESCRIPTION_ALLOWED_CHARS = /[^0-9A-Za-zÀ-ÖØ-öø-ÿ .,;:!?'"()\-_\/]/g;
const DEFAULT_NBS_CODE = "115090000";

/**
 * Classe para construção de XML de forma estruturada
 */
class XmlWriter {
  private parts: string[] = [];

  private escAttr(v: string): string {
    return this.sanitizeText(v).replace(/"/g, "&quot;");
  }

  private sanitizeText(input: string): string {
    if (!input) return "";
    // Remove acentos e normaliza para ASCII básico
    const noDiacritics = input.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    // Normaliza espaços: converte NBSP, colapsa espaços/tabs e aplica trim
    const normalizedSpaces = noDiacritics
      .replace(/\u00A0/g, " ")
      .replace(/[\t ]+/g, " ")
      .trim();
    // Substitui & < > por entidades
    const xmlSafe = normalizedSpaces
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
    // Remove caracteres de controle exceto \n \r \t
    return xmlSafe.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "");
  }

  decl(version = "1.0", encoding = "UTF-8"): void {
    this.parts.push(`<?xml version="${version}" encoding="${encoding}"?>`);
  }

  open(name: string, attrs?: Record<string, string>): void {
    if (attrs && Object.keys(attrs).length) {
      const a = Object.entries(attrs)
        .map(([k, v]) => `${k}="${this.escAttr(v)}"`)
        .join(" ");
      this.parts.push(`<${name} ${a}>`);
    } else {
      this.parts.push(`<${name}>`);
    }
  }

  close(name: string): void {
    this.parts.push(`</${name}>`);
  }

  text(txt: string): void {
    this.parts.push(this.sanitizeText(txt));
  }

  leaf(name: string, txt: string): void {
    this.open(name);
    this.text(txt);
    this.close(name);
  }

  build(): string {
    return this.parts.join("");
  }
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

// --- Funções Auxiliares ---
function resolveInfDpsId(input: GenerateDpsXmlInput, tpAmb: string, serie: string, numero: string): string {
  const cLocEmi = resolveCodigoMunicipio(input.prestador.codigoMunicipio);
  const cnpj = resolveCnpj(input.prestador.cnpj);
  return `DPS${cLocEmi}${tpAmb}${cnpj}${serie}${numero}`;
}
function resolveTpAmb(value: number | null | undefined): string { return String(value ?? 2); }
function resolveCodigoMunicipio(value: string): string { return (normalizeDigits(value) ?? "").padStart(7, "0"); }
function resolveCnpj(value: string): string { return (normalizeDigits(value) ?? ""); }
function resolveSerieParaId(value: number): string {
  return String(Math.trunc(value)).padStart(SERIE_LENGTH, "0");
}

function resolveSerieParaTag(value: number): string {
  return String(Math.trunc(value));
}

// Retorna número com 15 dígitos com zeros à esquerda (usado APENAS no ID)
function resolveNumero15DigitosParaId(value: number): string {
  return String(Math.trunc(value)).padStart(NDPS_LENGTH, "0");
}

// Retorna número SEM zeros à esquerda (usado na tag nDPS)
function resolveNumeroSemZeros(value: number): string {
  return String(Math.trunc(value));
}

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
function formatPercentage(value: Prisma.Decimal | number | null | undefined): string {
  if (value === null || value === undefined) {
    return "0.00";
  }

  const num = value instanceof Prisma.Decimal ? value.toNumber() : value;
  return num.toFixed(2);
}
function sanitizeDescription(value: string | null | undefined): string {
  if (!value) return "";
  return value.trim().replace(XML_INVALID_CHARACTERS, "").replace(DESCRIPTION_ALLOWED_CHARS, " ").replace(/\s{2,}/g, " ").trim();
}
function normalizeDigits(value?: string | null): string | null {
  return value ? value.replace(/\D/g, "") || null : null;
}
/**
 * Formata código de tributação nacional para o padrão XX.XX
 * Entrada: "010301" ou "01.03.01" → Saída: "01.03.01"
 */
function formatCodigoTributacaoNacional(value: string): string {
  // Remove pontos existentes
  const digitsOnly = value.replace(/\D/g, "");
  
  // Se tiver 6 dígitos, formata como XX.XX.XX
  if (digitsOnly.length === 6) {
    return `${digitsOnly.substring(0, 2)}.${digitsOnly.substring(2, 4)}.${digitsOnly.substring(4, 6)}`;
  }
  
  // Se tiver 4 dígitos, formata como XX.XX
  if (digitsOnly.length === 4) {
    return `${digitsOnly.substring(0, 2)}.${digitsOnly.substring(2, 4)}`;
  }
  
  // Retorna como está se não corresponder aos padrões
  return value;
}
export function generateDpsXml(input: GenerateDpsXmlInput): string {
  const tpAmbValue = input.configuracao.tpAmb ?? input.configuracao.ambGer;
  const tpAmb = resolveTpAmb(tpAmbValue);
  const serieParaId = resolveSerieParaId(input.serie);
  const serieParaTag = resolveSerieParaTag(input.serie);
  const numeroParaId = resolveNumero15DigitosParaId(input.numero); // 15 dígitos para ID
  const numeroParaTag = resolveNumeroSemZeros(input.numero); // Sem zeros para tag
  const infDpsId = resolveInfDpsId(input, tpAmb, serieParaId, numeroParaId);
  const competenciaData = formatDate(input.competencia);
  const dataEmissao = formatDateTimeOffset(input.emissao);
  const documentoTomadorTag = input.tomador.tipoDocumento === "CNPJ" ? "CNPJ" : "CPF";
  const telefoneTomador = normalizeDigits(input.tomador.telefone);
  const cepTomador = normalizeDigits(input.tomador.cep);

  const valorServico = formatMoney(input.servico.valorUnitario);
  const totalTribFederalBase = input.configuracao.pTotTribFed ?? 0;
  const totalTribEstadualBase = input.configuracao.pTotTribEst ?? 0;
  const totalTribMunicipalBase = input.configuracao.pTotTribMun ?? 0;
  const totalTribFederal = formatPercentage(totalTribFederalBase);
  const totalTribEstadual = formatPercentage(totalTribEstadualBase);
  const totalTribMunicipal = formatPercentage(totalTribMunicipalBase);
  const aliquotaIss = formatPercentage(input.servico.aliquotaIss);

  const shouldIncludeImunidade = input.configuracao.tribISSQN === 2;
  const tpImunidade = shouldIncludeImunidade ? input.configuracao.tpImunidade ?? 0 : null;
  const opSimpNac = String(input.configuracao.opSimpNac ?? 1);
  const regEspTrib = String(input.configuracao.regEspTrib ?? 0);
  const serviceDescription = sanitizeDescription(input.servico.descricao);
  const informacoesComplementares = sanitizeDescription(input.observacoes ?? "");
  const codigoNbs = normalizeDigits(input.servico.codigoNbs) ?? DEFAULT_NBS_CODE;

  const w = new XmlWriter();

  // Declaração XML
  w.decl("1.0", "UTF-8");

  // DPS versão 1.01 com xmlns
  w.open("DPS", { xmlns: "http://www.sped.fazenda.gov.br/nfse", versao: "1.01" });
  w.open("infDPS", { Id: infDpsId });

  // Informações básicas
  w.leaf("tpAmb", tpAmb);
  w.leaf("dhEmi", dataEmissao);
  w.leaf("verAplic", input.configuracao.verAplic);
  w.leaf("serie", serieParaTag);
  w.leaf("nDPS", numeroParaTag); // ✅ CORRIGIDO: Número SEM zeros à esquerda
  w.leaf("dCompet", competenciaData);
  w.leaf("tpEmit", String(input.configuracao.tpEmis));
  w.leaf("cLocEmi", input.prestador.codigoMunicipio);

  // ✅ CORREÇÃO: Prestador sem fone/email e com regTrib logo após CNPJ
  w.open("prest");
  w.leaf("CNPJ", input.prestador.cnpj);
  const telefonePrestador = normalizeDigits(input.prestador.telefone ?? null);
  if (telefonePrestador) {
    w.leaf("fone", telefonePrestador);
  }
  if (input.prestador.email) {
    w.leaf("email", input.prestador.email);
  }
  w.open("regTrib");
  w.leaf("opSimpNac", opSimpNac);
  w.leaf("regEspTrib", regEspTrib);
  w.close("regTrib");
  w.close("prest");

  // Tomador
  w.open("toma");
  w.leaf(documentoTomadorTag, input.tomador.documento);
  w.leaf("xNome", input.tomador.nomeRazaoSocial);
  w.open("end");
  w.open("endNac");
  w.leaf("cMun", input.tomador.codigoMunicipio);
  if (cepTomador) {
    w.leaf("CEP", cepTomador);
  }
  w.close("endNac");
  w.leaf("xLgr", input.tomador.logradouro);
  w.leaf("nro", input.tomador.numero);
  if (input.tomador.complemento) {
    w.leaf("xCpl", input.tomador.complemento);
  }
  w.leaf("xBairro", input.tomador.bairro);
  w.close("end");
  if (telefoneTomador) {
    w.leaf("fone", telefoneTomador);
  }
  if (input.tomador.email) {
    w.leaf("email", input.tomador.email);
  }
  w.close("toma");

  // Serviço
  w.open("serv");
  w.open("locPrest");
  w.leaf("cLocPrestacao", input.configuracao.xLocPrestacao);
  w.close("locPrest");
  w.open("cServ");
  w.leaf("cTribNac", normalizeDigits(input.servico.codigoTributacaoNacional) ?? "");
  w.leaf("cTribMun", input.servico.codigoTributacaoMunicipal);
  w.leaf("xDescServ", serviceDescription);
  w.leaf("cNBS", codigoNbs);
  w.close("cServ");
  if (informacoesComplementares) {
    w.open("infoCompl");
    w.leaf("xInfComp", informacoesComplementares);
    w.close("infoCompl");
  }
  w.close("serv");

  // Valores
  w.open("valores");
  w.open("vServPrest");
  w.leaf("vServ", valorServico);
  w.close("vServPrest");

  // Tributação
  w.open("trib");
  w.open("tribMun");
  w.leaf("tribISSQN", String(input.configuracao.tribISSQN));
  if (tpImunidade !== null) {
    w.leaf("tpImunidade", String(tpImunidade));
  }
  w.leaf("tpRetISSQN", String(input.configuracao.tpRetISSQN));
  // ✅ CORRIGIDO: Apenas enviar pAliq se NÃO for Simples Nacional (opSimpNac != 1)
  // Para Simples Nacional, a SEFIN calcula automaticamente
  if (input.configuracao.opSimpNac !== 1 && aliquotaIss) {
    w.leaf("pAliq", aliquotaIss);
  }
  w.close("tribMun");

  w.open("totTrib");
  w.open("pTotTrib");
  w.leaf("pTotTribFed", totalTribFederal);
  w.leaf("pTotTribEst", totalTribEstadual);
  w.leaf("pTotTribMun", totalTribMunicipal);
  w.close("pTotTrib");
  w.close("totTrib");
  w.close("trib");

  w.close("valores");
  w.close("infDPS");
  w.close("DPS");

  return w.build();
}
