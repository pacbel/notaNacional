import { Prisma, type TipoDocumento } from "@prisma/client";
import { XmlWriter } from "./xml-writer";
import type {
  PartyBase,
  TomadorBase,
  ServicoBase,
  ConfiguracaoBase,
  GenerateDpsXmlInput,
  DpsContext,
  TomadorTipo,
  ServicoTipo,
  TributacaoTipo,
} from "./types";
import {
  INF_DPS_ID_LENGTH,
  CNPJ_LENGTH,
  CPF_LENGTH,
  DEFAULT_NBS_CODE,
  resolveTpAmb,
  resolveCodigoMunicipio,
  resolveCnpj,
  resolveSerieParaId,
  resolveSerieParaTag,
  resolveNumero15DigitosParaId,
  resolveNumeroSemZeros,
  formatDate,
  formatDateTimeOffset,
  formatMoney,
  formatPercentage,
  sanitizeDescription,
  normalizeDigits,
  formatCodigoTributacaoNacional,
} from "./utils";
import {
  buildIdentificacao,
  buildPrestador,
  buildTomador,
  buildServico,
  buildTotais,
} from "./builders";

// Re-exportar tipos para manter compatibilidade
export type {
  PartyBase,
  TomadorBase,
  ServicoBase,
  ConfiguracaoBase,
  GenerateDpsXmlInput,
};

function resolveInfDpsId(input: GenerateDpsXmlInput, tpAmb: string, serie: string, numero: string): string {
  const cLocEmi = resolveCodigoMunicipio(input.prestador.codigoMunicipio);
  const cnpj = resolveCnpj(input.prestador.cnpj);
  return `DPS${cLocEmi}${tpAmb}${cnpj}${serie}${numero}`;
}
export function generateDpsXml(input: GenerateDpsXmlInput): string {
  const context = createDpsContext(input);
  const w = new XmlWriter();

  w.decl("1.0", "UTF-8");
  w.open("DPS", { versao: "1.01", xmlns: "http://www.sped.fazenda.gov.br/nfse" });
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
  const inscricaoMunicipalPrestador = input.prestador.inscricaoMunicipal?.trim() || null;
  const prestadorNome = sanitizeDescription(input.prestador.razaoSocial || input.prestador.nomeFantasia || "");
  const telefonePrestador = normalizeDigits(input.prestador.telefone ?? null);

  const tomadorDocumentoInfo = resolveTomadorDocumento(input.tomador);
  const tomadorTelefone = normalizeDigits(input.tomador.telefone ?? null);
  const tomadorCep = normalizeDigits(input.tomador.cep ?? null);
  const codigoMunicipioEmissao = resolveCodigoMunicipio(input.configuracao.xLocEmi ?? input.prestador.codigoMunicipio);
  const shouldInformIm = Boolean(inscricaoMunicipalPrestador !== "");
  const shouldInformPrestadorNome = String(input.configuracao.tpEmis ?? 1) !== "1";
  const tomadorCodigoMunicipio = input.tomador.codigoMunicipio ? resolveCodigoMunicipio(input.tomador.codigoMunicipio) : null;

  const valorServicoNumber = input.servico.valorUnitario instanceof Prisma.Decimal
    ? input.servico.valorUnitario.toNumber()
    : Number(input.servico.valorUnitario);
  const valorServico = formatMoney(valorServicoNumber);

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
    shouldInformIm,
    shouldInformPrestadorNome,
    prestadorNome: prestadorNome || null,
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
    codigoMunicipioEmissao,
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

