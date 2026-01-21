import { Prisma, type TipoDocumento } from "@prisma/client";

const INF_DPS_ID_LENGTH = 45;
const CODIGO_MUNICIPIO_LENGTH = 7;
const CNPJ_LENGTH = 14;
const CPF_LENGTH = 11;
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
  tipoTomador?: TomadorTipo;
  tipoDocumento?: TipoDocumento | "CPF" | "CNPJ" | null;
  documento?: string | null;
  nomeRazaoSocial: string;
  codigoMunicipio?: string | null;
  logradouro?: string | null;
  numero?: string | null;
  bairro?: string | null;
  complemento?: string | null;
  cep?: string | null;
  telefone?: string | null;
  email?: string | null;
  codigoPais?: string | null;
  codigoPostalExterior?: string | null;
  cidadeExterior?: string | null;
  estadoExterior?: string | null;
}

export interface ServicoBase {
  descricao: string;
  valorUnitario: Prisma.Decimal | number;
  codigoTributacaoMunicipal: string;
  codigoTributacaoNacional: string;
  codigoNbs?: string | null;
  aliquotaIss?: Prisma.Decimal | number | null;
  pTotTribFed?: Prisma.Decimal | number | null;
  pTotTribEst?: Prisma.Decimal | number | null;
  pTotTribMun?: Prisma.Decimal | number | null;
  tipoServico?: "NORMAL" | "EXPORTACAO" | "CONSTRUCAO";
  exportacao?: {
    paisDestino?: string | null;
    justificativa?: string | null;
  } | null;
  construcao?: {
    codigoObra?: string | null;
    codigoArt?: string | null;
  } | null;
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

type TomadorTipo = "NACIONAL" | "ESTRANGEIRO" | "ANONIMO";
type ServicoTipo = "NORMAL" | "EXPORTACAO" | "CONSTRUCAO";
type TributacaoTipo = "NORMAL" | "SIMPLES" | "RETIDA" | "IMUNE";

interface DpsContext {
  readonly input: GenerateDpsXmlInput;
  readonly tpAmb: string;
  readonly serieParaTag: string;
  readonly numeroParaTag: string;
  readonly infDpsId: string;
  readonly competenciaData: string;
  readonly dataEmissao: string;
  readonly prestadorCnpj: string;
  readonly inscricaoMunicipalPrestador: string | null;
  readonly telefonePrestador: string | null;
  readonly opSimpNac: string;
  readonly regEspTrib: string;
  readonly tomadorTipo: TomadorTipo;
  readonly tomadorDocumentoTag: "CPF" | "CNPJ" | "idEstrangeiro" | null;
  readonly tomadorDocumento: string | null;
  readonly tomadorTelefone: string | null;
  readonly tomadorCep: string | null;
  readonly tomadorCodigoMunicipio: string | null;
  readonly valorServico: string;
  readonly valorIssqn: string | null;
  readonly aliquotaIss: string | null;
  readonly shouldInformAliquota: boolean;
  readonly shouldInformImunidade: boolean;
  readonly tpImunidade: string | null;
  readonly tribIssqn: string;
  readonly tpRetIssqn: string;
  readonly serviceDescription: string;
  readonly informacoesComplementares: string | null;
  readonly codigoNbs: string;
  readonly codigoTributacaoNacional: string;
  readonly servicoTipo: ServicoTipo;
  readonly tributacaoTipo: TributacaoTipo;
  readonly codigoMunicipioEmissao: string;
  readonly codigoMunicipioPrestacao: string;
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
  const digitsOnly = value.replace(/\D/g, "");

  if (digitsOnly.length > 0) {
    return digitsOnly;
  }

  return value.replace(/\D/g, "");
}
export function generateDpsXml(input: GenerateDpsXmlInput): string {
  const context = createDpsContext(input);
  const w = new XmlWriter();

  w.decl("1.0", "UTF-8");
  w.open("DPS", { xmlns: "http://www.sped.fazenda.gov.br/nfse", versao: "1.01" });
  w.open("infDPS", { Id: context.infDpsId });

  buildIdentificacao(w, context);
  buildPrestador(w, context);
  buildTomador(w, context);
  buildServico(w, context);
  buildTotais(w, context);

  w.close("infDPS");
  w.close("DPS");

  return w.build();
}

function createDpsContext(input: GenerateDpsXmlInput): DpsContext {
  const tpAmbValue = input.configuracao.tpAmb ?? input.configuracao.ambGer;
  const tpAmb = resolveTpAmb(tpAmbValue);
  const serieParaId = resolveSerieParaId(input.serie);
  const numeroParaId = resolveNumero15DigitosParaId(input.numero);
  const serieParaTag = resolveSerieParaTag(input.serie);
  const numeroParaTag = resolveNumeroSemZeros(input.numero);
  const infDpsId = resolveInfDpsId(input, tpAmb, serieParaId, numeroParaId).slice(0, INF_DPS_ID_LENGTH);

  const competenciaData = formatDate(input.competencia);
  const dataEmissao = formatDateTimeOffset(input.emissao);

  const prestadorCnpj = resolveCnpj(input.prestador.cnpj);
  const inscricaoMunicipalPrestador = normalizeDigits(input.prestador.inscricaoMunicipal ?? null);
  const telefonePrestador = normalizeDigits(input.prestador.telefone ?? null);

  const tomadorDocumentoInfo = resolveTomadorDocumento(input.tomador);
  const tomadorTelefone = normalizeDigits(input.tomador.telefone ?? null);
  const tomadorCep = normalizeDigits(input.tomador.cep ?? null);
  const tomadorCodigoMunicipio = input.tomador.codigoMunicipio ? resolveCodigoMunicipio(input.tomador.codigoMunicipio) : null;

  const valorServicoNumber = input.servico.valorUnitario instanceof Prisma.Decimal
    ? input.servico.valorUnitario.toNumber()
    : Number(input.servico.valorUnitario);
  const valorServico = formatMoney(input.servico.valorUnitario);

  const aliquotaNumberRaw = input.servico.aliquotaIss instanceof Prisma.Decimal
    ? input.servico.aliquotaIss.toNumber()
    : input.servico.aliquotaIss ?? null;
  const hasAliquota = typeof aliquotaNumberRaw === "number";
  const aliquotaIss = hasAliquota ? formatPercentage(aliquotaNumberRaw) : null;
  const shouldInformAliquota = (input.configuracao.opSimpNac ?? 1) !== 1 && hasAliquota;
  const valorIssqn = shouldInformAliquota && hasAliquota
    ? formatMoney(valorServicoNumber * (aliquotaNumberRaw as number) / 100)
    : null;

  const shouldInformImunidade = input.configuracao.tribISSQN === 2;
  const tpImunidade = shouldInformImunidade && input.configuracao.tpImunidade !== null
    ? String(input.configuracao.tpImunidade)
    : null;

  const serviceDescription = sanitizeDescription(input.servico.descricao);
  const observacoesSanitized = sanitizeDescription(input.observacoes ?? "");
  const informacoesComplementares = observacoesSanitized ? observacoesSanitized : null;
  const codigoNbs = normalizeDigits(input.servico.codigoNbs) ?? DEFAULT_NBS_CODE;
  const codigoTributacaoNacional = formatCodigoTributacaoNacional(input.servico.codigoTributacaoNacional);

  const servicoTipo = resolveServicoTipo(input.servico);
  const tributacaoTipo = resolveTributacaoTipo(input);

  return {
    input,
    tpAmb,
    serieParaTag,
    numeroParaTag,
    infDpsId,
    competenciaData,
    dataEmissao,
    prestadorCnpj,
    inscricaoMunicipalPrestador,
    telefonePrestador,
    opSimpNac: String(input.configuracao.opSimpNac ?? 1),
    regEspTrib: String(input.configuracao.regEspTrib ?? 0),
    tomadorTipo: tomadorDocumentoInfo.tipo,
    tomadorDocumentoTag: tomadorDocumentoInfo.tag,
    tomadorDocumento: tomadorDocumentoInfo.valor,
    tomadorTelefone,
    tomadorCep,
    tomadorCodigoMunicipio,
    valorServico,
    valorIssqn,
    aliquotaIss,
    shouldInformAliquota,
    shouldInformImunidade,
    tpImunidade,
    tribIssqn: String(input.configuracao.tribISSQN),
    tpRetIssqn: String(input.configuracao.tpRetISSQN),
    serviceDescription,
    informacoesComplementares,
    codigoNbs,
    codigoTributacaoNacional,
    servicoTipo,
    tributacaoTipo,
    codigoMunicipioEmissao: input.prestador.codigoMunicipio,
    codigoMunicipioPrestacao: input.configuracao.xLocPrestacao,
  };
}

function resolveTomadorDocumento(tomador: TomadorBase): {
  tipo: TomadorTipo;
  tag: "CPF" | "CNPJ" | "idEstrangeiro" | null;
  valor: string | null;
} {
  const documento = tomador.documento?.trim();
  if (!documento) {
    return { tipo: "ANONIMO", tag: null, valor: null };
  }

  const normalized = normalizeDigits(documento);
  const tipoDocumento = typeof tomador.tipoDocumento === "string" ? tomador.tipoDocumento.toUpperCase() : "";

  if (tipoDocumento === "CNPJ" || normalized?.length === CNPJ_LENGTH) {
    return { tipo: "NACIONAL", tag: "CNPJ", valor: normalized ?? documento };
  }

  if (tipoDocumento === "CPF" || normalized?.length === CPF_LENGTH) {
    return { tipo: "NACIONAL", tag: "CPF", valor: normalized ?? documento };
  }

  return { tipo: "ESTRANGEIRO", tag: "idEstrangeiro", valor: documento };
}

function resolveServicoTipo(servico: ServicoBase): ServicoTipo {
  if (servico.tipoServico === "EXPORTACAO") {
    return "EXPORTACAO";
  }
  if (servico.tipoServico === "CONSTRUCAO") {
    return "CONSTRUCAO";
  }
  return "NORMAL";
}

function resolveTributacaoTipo(context: GenerateDpsXmlInput): TributacaoTipo {
  if (context.configuracao.tribISSQN === 2) {
    return "IMUNE";
  }
  if (context.configuracao.tpRetISSQN === 1) {
    return "RETIDA";
  }
  if ((context.configuracao.opSimpNac ?? 1) === 1) {
    return "SIMPLES";
  }
  return "NORMAL";
}

function buildIdentificacao(w: XmlWriter, context: DpsContext): void {
  w.leaf("tpAmb", context.tpAmb);
  w.leaf("dhEmi", context.dataEmissao);
  w.leaf("verAplic", context.input.configuracao.verAplic);
  w.leaf("serie", context.serieParaTag);
  w.leaf("nDPS", context.numeroParaTag);
  w.leaf("dCompet", context.competenciaData);
  w.leaf("tpEmit", String(context.input.configuracao.tpEmis));
  w.leaf("cLocEmi", context.codigoMunicipioEmissao);
}

function buildPrestador(w: XmlWriter, context: DpsContext): void {
  w.open("prest");
  w.leaf("CNPJ", context.prestadorCnpj);
  if (context.inscricaoMunicipalPrestador) {
    w.leaf("IM", context.inscricaoMunicipalPrestador);
  }
  if (context.telefonePrestador) {
    w.leaf("fone", context.telefonePrestador);
  }
  if (context.input.prestador.email) {
    w.leaf("email", context.input.prestador.email);
  }
  w.open("regTrib");
  w.leaf("opSimpNac", context.opSimpNac);
  w.leaf("regEspTrib", context.regEspTrib);
  w.close("regTrib");
  w.close("prest");
}

function buildTomador(w: XmlWriter, context: DpsContext): void {
  w.open("toma");
  switch (context.tomadorTipo) {
    case "ESTRANGEIRO":
      buildTomadorEstrangeiro(w, context);
      break;
    case "ANONIMO":
      buildTomadorAnonimo(w, context);
      break;
    default:
      buildTomadorNacional(w, context);
      break;
  }
  w.close("toma");
}

function buildTomadorNacional(w: XmlWriter, context: DpsContext): void {
  if (context.tomadorDocumentoTag && context.tomadorDocumento) {
    w.leaf(context.tomadorDocumentoTag, context.tomadorDocumento);
  }
  buildTomadorDadosComplementares(w, context);
}

function buildTomadorEstrangeiro(w: XmlWriter, context: DpsContext): void {
  const documento = context.tomadorDocumento ?? context.input.tomador.documento;
  if (documento) {
    w.leaf("idEstrangeiro", documento);
  }
  buildTomadorDadosComplementares(w, context);
}

function buildTomadorAnonimo(w: XmlWriter, context: DpsContext): void {
  buildTomadorDadosComplementares(w, context);
}

function buildTomadorDadosComplementares(w: XmlWriter, context: DpsContext): void {
  w.leaf("xNome", context.input.tomador.nomeRazaoSocial);
  buildTomadorEndereco(w, context);
  if (context.tomadorTelefone) {
    w.leaf("fone", context.tomadorTelefone);
  }
  if (context.input.tomador.email) {
    w.leaf("email", context.input.tomador.email);
  }
}

function buildTomadorEndereco(w: XmlWriter, context: DpsContext): void {
  const dados = context.input.tomador;

  const hasEnderecoNacional = Boolean(
    dados.logradouro ||
    dados.numero ||
    dados.complemento ||
    dados.bairro ||
    context.tomadorCodigoMunicipio ||
    context.tomadorCep
  );

  const hasEnderecoExterior = context.tomadorTipo === "ESTRANGEIRO" && Boolean(
    dados.codigoPais ||
    dados.codigoPostalExterior ||
    dados.cidadeExterior ||
    dados.estadoExterior ||
    dados.logradouro ||
    dados.numero ||
    dados.complemento ||
    dados.bairro
  );

  if (!hasEnderecoNacional && !hasEnderecoExterior) {
    return;
  }

  w.open("end");

  if (hasEnderecoNacional) {
    w.open("endNac");
    if (context.tomadorCodigoMunicipio) {
      w.leaf("cMun", context.tomadorCodigoMunicipio);
    }
    if (context.tomadorCep) {
      w.leaf("CEP", context.tomadorCep);
    }    
    w.close("endNac");
        
    if (dados.logradouro) {
      w.leaf("xLgr", dados.logradouro);
    }
    if (dados.numero) {
      w.leaf("nro", dados.numero);
    }
    if (dados.complemento) {
      w.leaf("xCpl", dados.complemento);
    }
    if (dados.bairro) {
      w.leaf("xBairro", dados.bairro);
    }
  }

  if (hasEnderecoExterior) {
    w.open("endExt");
    if (dados.codigoPais) {
      w.leaf("cPais", dados.codigoPais);
    }
    if (dados.codigoPostalExterior) {
      w.leaf("cEndPost", dados.codigoPostalExterior);
    }
    if (dados.cidadeExterior) {
      w.leaf("xCidade", dados.cidadeExterior);
    }
    if (dados.estadoExterior) {
      w.leaf("xEstProvReg", dados.estadoExterior);
    }
    if (dados.logradouro) {
      w.leaf("xLgr", dados.logradouro);
    }
    if (dados.numero) {
      w.leaf("nro", dados.numero);
    }
    if (dados.complemento) {
      w.leaf("xCpl", dados.complemento);
    }
    if (dados.bairro) {
      w.leaf("xBairro", dados.bairro);
    }
    w.close("endExt");
  }

  w.close("end");
}

function buildServico(w: XmlWriter, context: DpsContext): void {
  switch (context.servicoTipo) {
    case "EXPORTACAO":
      buildServicoExportacao(w, context);
      break;
    case "CONSTRUCAO":
      buildServicoConstrucao(w, context);
      break;
    default:
      buildServicoNormal(w, context);
      break;
  }
}

function buildServicoNormal(w: XmlWriter, context: DpsContext): void {
  buildServicoSkeleton(w, context, () => {
    // Serviço normal não adiciona grupos complementares
  });
}

function buildServicoExportacao(w: XmlWriter, context: DpsContext): void {
  buildServicoSkeleton(w, context, () => {
    const exportacao = context.input.servico.exportacao;
    if (!exportacao) {
      return;
    }

    w.open("exportacao");
    if (exportacao.paisDestino) {
      w.leaf("paisDest", exportacao.paisDestino);
    }
    if (exportacao.justificativa) {
      w.leaf("xJust", exportacao.justificativa);
    }
    w.close("exportacao");
  });
}

function buildServicoConstrucao(w: XmlWriter, context: DpsContext): void {
  buildServicoSkeleton(w, context, () => {
    const construcao = context.input.servico.construcao;
    if (!construcao) {
      return;
    }

    w.open("obra");
    if (construcao.codigoObra) {
      w.leaf("cObra", construcao.codigoObra);
    }
    if (construcao.codigoArt) {
      w.leaf("cArt", construcao.codigoArt);
    }
    w.close("obra");
  });
}

function buildServicoSkeleton(w: XmlWriter, context: DpsContext, extra: () => void): void {
  w.open("serv");
  buildServicoBase(w, context);
  extra();
  w.close("serv");
}

function buildServicoBase(w: XmlWriter, context: DpsContext): void {
  w.open("locPrest");
  w.leaf("cLocPrestacao", context.codigoMunicipioPrestacao);
  w.close("locPrest");

  w.open("cServ");
  w.leaf("cTribNac", context.codigoTributacaoNacional);
  w.leaf("cTribMun", context.input.servico.codigoTributacaoMunicipal);
  w.leaf("xDescServ", context.serviceDescription);
  w.leaf("cNBS", context.codigoNbs);
  w.close("cServ");

  if (context.informacoesComplementares) {
    w.open("infoCompl");
    w.leaf("xInfComp", context.informacoesComplementares);
    w.close("infoCompl");
  }
}

interface TributacaoMunicipalOptions {
  includeAliquota: boolean;
  includeImunidade: boolean;
}

function writeTributacaoMunicipal(w: XmlWriter, context: DpsContext, options: TributacaoMunicipalOptions): void {
  w.open("tribMun");
  w.leaf("tribISSQN", context.tribIssqn);
  if (options.includeImunidade && context.tpImunidade) {
    w.leaf("tpImunidade", context.tpImunidade);
  }
  w.leaf("tpRetISSQN", context.tpRetIssqn);
  if (options.includeAliquota && context.aliquotaIss) {
    w.leaf("pAliq", context.aliquotaIss);
    if (context.valorIssqn) {
      w.leaf("vISSQN", context.valorIssqn);
    }
  }
  w.close("tribMun");
}

function buildTotTrib(w: XmlWriter, context: DpsContext): void {
  w.open("totTrib");
  
  const valorServicoNumber = Number.parseFloat(context.valorServico);
  
  // Calcular tributos aproximados baseados no valor do serviço
  // Alíquotas aproximadas conforme Lei 12.741/2012
  
  // Tributos Federais (CBS/PIS/COFINS) - aproximadamente 3.5% do valor
  const vTotTribFed = valorServicoNumber * 0.035;
  
  // Tributos Estaduais - geralmente não se aplicam a serviços (0%)
  const vTotTribEst = 0;
  
  // Tributos Municipais (ISSQN) - usar alíquota do serviço se informada
  let vTotTribMun = 0;
  if (context.aliquotaIss) {
    const aliquotaNumber = Number.parseFloat(context.aliquotaIss);
    vTotTribMun = valorServicoNumber * (aliquotaNumber / 100);
  }
  
  // vTotTrib é um GRUPO COMPOSTO (CG) - obrigatório 1-1
  // Deve conter os 3 valores monetários obrigatórios
  w.open("vTotTrib");
  w.leaf("vTotTribFed", formatMoney(vTotTribFed));
  w.leaf("vTotTribEst", formatMoney(vTotTribEst));
  w.leaf("vTotTribMun", formatMoney(vTotTribMun));
  w.close("vTotTrib");
  
  w.close("totTrib");
}

function buildTotais(w: XmlWriter, context: DpsContext): void {
  w.open("valores");
  w.open("vServPrest");
  w.leaf("vServ", context.valorServico);
  w.close("vServPrest");
  w.open("trib");
  writeTributacaoMunicipal(w, context, {
    includeAliquota: context.shouldInformAliquota,
    includeImunidade: context.shouldInformImunidade && Boolean(context.tpImunidade),
  });
  buildTotTrib(w, context);
  w.close("trib");
  w.close("valores");
}
