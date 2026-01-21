import {
  Ambiente as AmbienteEnum,
  DpsStatus,
  NotaDocumentoTipo,
  Prisma,
  type Ambiente,
  type ConfiguracaoDps,
} from "@prisma/client";
import type { AxiosError } from "axios";
import { z } from "zod";

import { AppError } from "@/lib/errors";
import { prisma } from "@/lib/prisma";
import { sendEmail, type EmailAttachment } from "@/lib/email";
import { dpsCreateSchema } from "@/lib/validators/dps";

import {
  assinarXml,
  cancelarNfse,
  emitirNfse,
  gerarDanfse as gerarDanfseApi,
  listarCertificados,
} from "./client";
import { CANCELAMENTO_MOTIVO_CODES, findCancelamentoMotivo } from "./cancelamento-motivos";
import type {
  AssinarXmlResponse,
  CancelarNfseResponse,
  CertificadoDto,
  EmitirNfseResponse,
} from "./types";
import {
  generateDpsXml,
  type ConfiguracaoBase,
  type PartyBase,
  type TomadorBase,
  type ServicoBase,
} from "./xml/dps-xml";
import { resolveCertificateId } from "./certificado-service";
import { generateCancelamentoXml } from "./xml/cancelamento-xml";
import { saveXmlToFile, analyzeXml } from "./xml/xml-validator";
import { gzipSync } from "zlib";
import { getPrestador, type PrestadorDto } from "@/services/prestadores";

type Nullable<T> = T | null | undefined;

// Tipos para dados vindos da API externa
interface PrestadorApi {
  id: string;
  cnpj: string;
  nomeFantasia: string;
  razaoSocial: string;
  codigoMunicipio: string;
  cidade: string;
  estado: string;
  inscricaoMunicipal?: string;
  telefone?: string;
  email?: string;
}

interface TomadorApi {
  id: string;
  tipoTomador: "NACIONAL" | "ESTRANGEIRO" | "ANONIMO";
  tipoDocumento: "CPF" | "CNPJ" | null;
  documento: string | null;
  nomeRazaoSocial: string;
  codigoMunicipio: string | null;
  logradouro: string | null;
  numero: string | null;
  bairro: string | null;
  complemento?: string | null;
  cep?: string | null;
  telefone?: string | null;
  email?: string | null;
  codigoPais?: string | null;
  codigoPostalExterior?: string | null;
  cidadeExterior?: string | null;
  estadoExterior?: string | null;
}

interface ServicoApi {
  id: string;
  descricao: string;
  valorUnitario: number;
  codigoTributacaoMunicipal: string;
  codigoTributacaoNacional: string;
  codigoNbs?: string | null;
  aliquotaIss?: number | null;
}

type NotaEmitidaPersisted = {
  id: string;
  numero: string | null;
  chaveAcesso: string;
  prestadorId: string;
  tomadorId: string;
};

type DpsWithRelations = Prisma.DpsGetPayload<{
  include: {
    tomador: true;
    servico: true;
  };
}>;

function logWithLevel(level: "info" | "debug" | "error", message: string, context?: Record<string, unknown>) {
  const logger = level === "debug" ? console.debug : level === "error" ? console.error : console.info;

  if (context) {
    logger(`[NFSe] ${message}`, context);
    return;
  }

  logger(`[NFSe] ${message}`);
}

function logInfo(message: string, context?: Record<string, unknown>) {
  logWithLevel("info", message, context);
}

function logDebug(message: string, context?: Record<string, unknown>) {
  logWithLevel("debug", message, context);
}

function logError(message: string, context?: Record<string, unknown>) {
  logWithLevel("error", message, context);
}

function normalizeSignedXml(xml: string, elementTag: string, rootTag: string): string {
  const elementId = extractElementId(xml, elementTag);

  if (!elementId) {
    return xml;
  }

  return repositionSignatureNode(xml, elementTag, rootTag, elementId);
}

function normalizeSignedDpsXml(xml: string): string {
  return normalizeSignedXml(xml, "infDPS", "DPS");
}

function normalizeSignedPedRegXml(xml: string): string {
  return normalizeSignedXml(xml, "infPedReg", "pedRegEvento");
}

function extractElementId(xml: string, tagName: string): string | null {
  const regex = new RegExp(`<${tagName}\\b[^>]*\\bId="([^"]+)"`);
  const match = regex.exec(xml);
  return match ? match[1] : null;
}

function repositionSignatureNode(xml: string, elementTag: string, rootTag: string, elementId: string): string {
  // Busca pela tag Signature com ou sem namespace (Signature ou ds:Signature)
  const signaturePattern = /<(?:\w+:)?Signature[^>]*>[\s\S]*?<\/(?:\w+:)?Signature>/;
  const match = signaturePattern.exec(xml);

  if (!match) {
    logInfo("Nenhuma tag Signature encontrada no XML");
    return xml;
  }

  // Log da posição original da assinatura
  const beforeSignature = xml.slice(Math.max(0, match.index - 50), match.index);
  const afterSignature = xml.slice(match.index + match[0].length, Math.min(xml.length, match.index + match[0].length + 50));
  
  logInfo("Assinatura encontrada", {
    posicaoOriginal: match.index,
    contextoAntes: beforeSignature.slice(-30),
    contextoDepois: afterSignature.slice(0, 30),
  });

  const signatureBlock = ensureSignatureReference(match[0], elementId);
  const normalizedSignature = signatureBlock.trim();
  
  // Remove a assinatura do XML original
  const withoutSignature = xml.slice(0, match.index) + xml.slice(match.index + match[0].length);

  // Tenta inserir após o fechamento do elemento (infDPS)
  const closingElementTag = `</${elementTag}>`;
  const closingElementIndex = withoutSignature.lastIndexOf(closingElementTag);

  if (closingElementIndex !== -1) {
    const insertPosition = closingElementIndex + closingElementTag.length;
    
    logInfo("Reposicionando assinatura", {
      tagElemento: elementTag,
      posicaoFechamento: closingElementIndex,
      posicaoInsercao: insertPosition,
      contextoInsercao: withoutSignature.slice(Math.max(0, insertPosition - 30), Math.min(withoutSignature.length, insertPosition + 30)),
    });
    
    const before = withoutSignature.slice(0, insertPosition);
    const after = withoutSignature.slice(insertPosition);

    const result = minifyXml(`${before}${normalizedSignature}${after}`);
    
    // Validação: verifica se o resultado está bem formado
    const allOpenTags = (result.match(/<[^/!?][^>]*>/g) || []);
    const selfClosingTags = (result.match(/<[^/!?][^>]*\/>/g) || []);
    const openTags = allOpenTags.filter(tag => !tag.endsWith('/>')).length;
    const closeTags = (result.match(/<\/[^>]+>/g) || []).length;
    
    if (openTags !== closeTags) {
      logError("Reposicionamento de assinatura gerou XML malformado", {
        openTags,
        closeTags,
        selfClosingTags: selfClosingTags.length,
      });
      // Retorna XML original sem reposicionar
      return xml;
    }
    
    // Log da estrutura final
    const signaturePos = result.indexOf('<Signature');
    const infDpsClosePos = result.lastIndexOf('</infDPS>');
    const dpsClosePos = result.lastIndexOf('</DPS>');
    
    logInfo("Estrutura final do XML", {
      assinaturaAposInfDPS: signaturePos > infDpsClosePos,
      assinaturaAntesDPS: signaturePos < dpsClosePos,
      estruturaCorreta: signaturePos > infDpsClosePos && signaturePos < dpsClosePos,
      preview: result.slice(Math.max(0, infDpsClosePos - 20), Math.min(result.length, signaturePos + 50)),
    });
    
    return result;
  }

  // Fallback: insere antes do fechamento da tag raiz (DPS)
  const closingRootTag = `</${rootTag}>`;
  const closingRootIndex = withoutSignature.lastIndexOf(closingRootTag);

  if (closingRootIndex !== -1) {
    const before = withoutSignature.slice(0, closingRootIndex);
    const after = withoutSignature.slice(closingRootIndex);

    return minifyXml(`${before}${normalizedSignature}${after}`);
  }

  // Se não conseguiu reposicionar, retorna o XML original
  return ensureSignatureReference(xml, elementId);
}

function ensureSignatureReference(signature: string, infDpsId: string): string {
  const referencePattern = /(<Reference\b[^>]*\bURI="#)([^"]*)(")/;

  if (referencePattern.test(signature)) {
    return signature.replace(referencePattern, `$1${infDpsId}$3`);
  }

  return signature;
}

function minifyXml(value: string): string {
  return value.replace(/>\s+</g, "><").replace(/\r?\n/g, "");
}

function resolveSefinErrorFromRecord(record: Record<string, unknown>): string | null {
  const erros = record.erros;

  if (Array.isArray(erros)) {
    for (const item of erros) {
      if (!item || typeof item !== "object") {
        continue;
      }

      const entry = item as Record<string, unknown>;
      const rawDescricao = entry.Descricao ?? entry.descricao;

      if (typeof rawDescricao === "string" && rawDescricao.trim()) {
        return rawDescricao.trim();
      }
    }
  }

  const descricaoDireta = record.Descricao ?? record.descricao;

  if (typeof descricaoDireta === "string" && descricaoDireta.trim()) {
    return descricaoDireta.trim();
  }

  return null;
}

function resolveErrorMessageFromUnknown(value: unknown, depth = 0): string | null {
  if (depth > 5) {
    return null;
  }

  if (typeof value === "string") {
    const trimmed = value.trim();

    if (!trimmed) {
      return null;
    }

    if ((trimmed.startsWith("{") && trimmed.endsWith("}")) || (trimmed.startsWith("[") && trimmed.endsWith("]"))) {
      try {
        const parsed = JSON.parse(trimmed);
        const nested = resolveErrorMessageFromUnknown(parsed, depth + 1);

        if (nested) {
          return nested;
        }
      } catch {
        // ignore parse error and use trimmed string
      }
    }

    return trimmed;
  }

  if (Array.isArray(value)) {
    for (const item of value) {
      const nested = resolveErrorMessageFromUnknown(item, depth + 1);

      if (nested) {
        return nested;
      }
    }

    return null;
  }

  if (!value || typeof value !== "object") {
    return null;
  }

  const record = value as Record<string, unknown>;

  const sefinMessage = resolveSefinErrorFromRecord(record);

  if (sefinMessage) {
    return sefinMessage;
  }

  const direct = resolveErrorMessageFromUnknown(record.message, depth + 1)
    ?? resolveErrorMessageFromUnknown((record as { mensagem?: unknown }).mensagem, depth + 1)
    ?? resolveErrorMessageFromUnknown((record as { Message?: unknown }).Message, depth + 1);

  if (direct) {
    return direct;
  }

  const detailKeys = ["details", "detalhes", "rawResponseContent", "raw_response", "error", "erro"];

  for (const key of detailKeys) {
    if (key in record) {
      const nested = resolveErrorMessageFromUnknown(record[key], depth + 1);

      if (nested) {
        return nested;
      }
    }
  }

  if (depth === 0) {
    try {
      return JSON.stringify(record);
    } catch {
      return null;
    }
  }

  return null;
}

function parseNotaApiError(error: unknown): { message: string; statusCode?: number; details?: unknown } {
  if (typeof error === "object" && error !== null && "isAxiosError" in error) {
    const axiosError = error as AxiosError;
    const statusCode = axiosError.response?.status;
    const data = axiosError.response?.data;
    let message = axiosError.message;

    if (data !== undefined) {
      const resolved = resolveErrorMessageFromUnknown(data);

      if (resolved) {
        message = resolved;
      }
    }

    return {
      message,
      statusCode,
      details: {
        statusCode,
        data,
      },
    };
  }

  if (error instanceof Error) {
    return { message: error.message };
  }

  return { message: String(error) };
}

function resolveSefinErrorMessage(content?: unknown, fallbackStatus?: number): string {
  if (typeof content === "string" && content.trim()) {
    return content;
  }

  if (content && typeof content === "object") {
    try {
      return JSON.stringify(content);
    } catch {
      // ignore json stringify issues
    }
  }

  if (fallbackStatus) {
    return `SEFIN retornou status ${fallbackStatus}`;
  }

  return "SEFIN retornou resposta sem detalhes.";
}

function mapAmbienteToApi(ambiente: Ambiente | null | undefined, override?: Nullable<number>): number {
  if (override === 1 || override === 2) {
    return override;
  }

  return ambiente === AmbienteEnum.PRODUCAO ? 1 : 2;
}

function sanitizeCodigoMunicipio(value?: string | null): string {
  if (!value) {
    return "";
  }

  const digits = value.replace(/\D/g, "");

  if (!digits) {
    return "";
  }

  return digits.padStart(7, "0");
}

function sanitizeOptionalString(value?: string | null): string | null {
  if (!value) {
    return null;
  }

  const trimmed = value.trim();

  return trimmed.length > 0 ? trimmed : null;
}

function sanitizeTelefone(value?: string | null): string | null {
  if (!value) {
    return null;
  }

  const digits = value.replace(/\D/g, "");

  return digits.length > 0 ? digits : null;
}


export const createDpsSchema = dpsCreateSchema;

export type CreateDpsInput = z.infer<typeof createDpsSchema>;

export async function createDps(payload: CreateDpsInput) {
  const data = createDpsSchema.parse(payload);

  const [prestadorDto, tomador, servico, configuracao] = await Promise.all([
    getPrestador(data.prestadorId),
    prisma.tomador.findFirst({ 
      where: { 
        id: data.tomadorId, 
        prestadorId: data.prestadorId,
        ativo: true 
      } 
    }),
    prisma.servico.findFirst({ 
      where: { 
        id: data.servicoId,
        prestadorId: data.prestadorId, 
        ativo: true 
      } 
    }),
    resolveConfiguracaoDps(data.prestadorId),
  ]);

  if (!prestadorDto || prestadorDto.ativo === false) {
    throw new AppError("Prestador não encontrado ou inativo", 404);
  }

  const codigoMunicipioPrestador = sanitizeCodigoMunicipio(prestadorDto.codigoMunicipio ?? prestadorDto.codigoMunicipioIbge ?? "");

  const prestador: PrestadorApi = {
    id: prestadorDto.id,
    cnpj: prestadorDto.cnpj ?? "",
    nomeFantasia: prestadorDto.nomeFantasia ?? "",
    razaoSocial: prestadorDto.razaoSocial ?? "",
    codigoMunicipio: codigoMunicipioPrestador,
    cidade: prestadorDto.cidade ?? "",
    estado: prestadorDto.estado ?? "",
    inscricaoMunicipal: sanitizeOptionalString(prestadorDto.inscricaoMunicipal ?? null) ?? undefined,
    telefone: sanitizeTelefone(prestadorDto.telefone ?? null) ?? undefined,
    email: sanitizeOptionalString(prestadorDto.email ?? null) ?? undefined,
  };

  if (!tomador) {
    throw new AppError("Tomador não encontrado, inativo ou não pertence ao prestador", 404);
  }

  if (!servico) {
    throw new AppError("Serviço não encontrado, inativo ou não pertence ao prestador", 404);
  }

  const competencia = new Date(data.competencia);
  const emissao = new Date(data.dataEmissao);

  const identificador = buildIdentificador(prestador.id);
  const serie = configuracao.seriePadrao ?? 1;

  const jsonEntrada = {
    prestador: {
      id: prestador.id,
      nomeFantasia: prestador.nomeFantasia,
      cnpj: prestador.cnpj,
      codigoMunicipio: prestador.codigoMunicipio,
      cidade: prestador.cidade,
      estado: prestador.estado,
    },
    tomador: {
      id: tomador.id,
      nome: tomador.nomeRazaoSocial,
      documento: tomador.documento,
      cidade: tomador.cidade,
      estado: tomador.estado,
    },
    servico: {
      id: servico.id,
      descricao: servico.descricao,
      valorUnitario: servico.valorUnitario.toNumber(),
      codigoTributacaoMunicipal: servico.codigoTributacaoMunicipal,
      codigoTributacaoNacional: servico.codigoTributacaoNacional,
      codigoNbs: servico.codigoNbs,
    },
    competencia: competencia.toISOString(),
    dataEmissao: emissao.toISOString(),
    configuracao: {
      xLocEmi: prestador.codigoMunicipio,
      xLocPrestacao: prestador.codigoMunicipio,
      verAplic: configuracao.versaoAplicacao,
      tpAmb: configuracao.tpAmb,
      ambGer: configuracao.ambGer,
      tpEmis: configuracao.tpEmis,
      procEmi: configuracao.procEmi,
      cStat: configuracao.cStat,
      opSimpNac: configuracao.opSimpNac,
      regEspTrib: configuracao.regEspTrib,
      tribISSQN: configuracao.tribISSQN,
      tpImunidade: configuracao.tpImunidade,
      tpRetISSQN: configuracao.tpRetISSQN,
    },
    observacoes: data.observacoes ?? undefined,
  };

  const jsonEntradaString = JSON.stringify(jsonEntrada);

  const numeroInicialDps = (configuracao as ConfiguracaoDps & { numeroInicialDps?: number }).numeroInicialDps ?? 1;

  const { record, xmlGerado } = await prisma.$transaction(async (tx) => {
    // Usar o numeroInicialDps das configurações como próximo número
    const numero = numeroInicialDps;

    const created = await tx.dps.create({
      data: {
        identificador,
        numero,
        serie,
        prestadorId: prestador.id,
        tomadorId: tomador.id,
        servicoId: servico.id,
        competencia,
        dataEmissao: emissao,
        tipoEmissao: data.tipoEmissao ?? 1,
        codigoLocalEmissao: prestador.codigoMunicipio,
        versao: "1.00",
        versaoAplicacao: configuracao.versaoAplicacao,
        ambiente: configuracao.ambientePadrao,
        jsonEntrada: jsonEntradaString,
        observacoes: data.observacoes ?? null,
      },
      include: {
        tomador: true,
        servico: true,
      },
    });

    const xml = generateDpsXml({
      identificador: created.identificador,
      numero: created.numero,
      serie: created.serie,
      competencia,
      emissao,
      prestador: mapPrestadorToXmlInput(prestador),
      tomador: mapTomadorToXmlInput({
        id: created.tomador.id,
        tipoTomador: created.tomador.tipoTomador,
        tipoDocumento: created.tomador.tipoDocumento ?? null,
        documento: created.tomador.documento ?? null,
        nomeRazaoSocial: created.tomador.nomeRazaoSocial,
        codigoMunicipio: created.tomador.codigoMunicipio ?? null,
        logradouro: created.tomador.logradouro ?? null,
        numero: created.tomador.numero ?? null,
        bairro: created.tomador.bairro ?? null,
        complemento: created.tomador.complemento ?? null,
        cep: created.tomador.cep ?? null,
        telefone: created.tomador.telefone ?? null,
        email: created.tomador.email,
        codigoPais: created.tomador.codigoPais ?? null,
        codigoPostalExterior: created.tomador.codigoPostalExterior ?? null,
        cidadeExterior: created.tomador.cidadeExterior ?? null,
        estadoExterior: created.tomador.estadoExterior ?? null,
      }),
      servico: mapServicoToXmlInput({
        id: created.servico.id,
        descricao: created.servico.descricao,
        valorUnitario: created.servico.valorUnitario.toNumber(),
        codigoTributacaoMunicipal: created.servico.codigoTributacaoMunicipal,
        codigoTributacaoNacional: created.servico.codigoTributacaoNacional,
        codigoNbs: created.servico.codigoNbs,
        aliquotaIss: created.servico.aliquotaIss?.toNumber() ?? null,
      }),
      configuracao: mapConfiguracaoToXmlInput({
        ...configuracao,
        xLocPrestacao: prestador.codigoMunicipio,
        xLocEmi: prestador.codigoMunicipio,
      }),
      observacoes: data.observacoes,
    });

    // Análise e salvamento do XML para debug
    try {
      analyzeXml(xml, `DPS_${created.identificador}`);
      await saveXmlToFile(xml, `dps_${created.identificador}`, "gerado");
    } catch (error) {
      logError("Erro ao analisar/salvar XML", { error });
    }

    await tx.dps.update({
      where: { id: created.id },
      data: {
        xmlGerado: xml,
        mensagemErro: null,
      },
    });

    // Incrementar o numeroInicialDps nas configurações do prestador
    await tx.configuracaoDps.update({
      where: { prestadorId: prestador.id },
      data: {
        numeroInicialDps: numeroInicialDps + 1,
      },
    });

    return { record: created, xmlGerado: xml };
  });

  return {
    ...record,
    jsonEntrada: jsonEntradaString,
    xmlGerado,
  };
}

async function resolveDps(dpsId: string) {
  const dps = await prisma.dps.findUnique({
    where: { id: dpsId },
  });

  if (!dps) {
    throw new AppError("DPS não encontrada", 404);
  }

  return dps;
}

export async function obterCertificados(): Promise<CertificadoDto[]> {
  return listarCertificados();
}

async function resolveConfiguracaoDps(prestadorId: string) {
  let config = await prisma.configuracaoDps.findUnique({ where: { prestadorId } });

  // Se não existir, criar configuração padrão para o prestador
  if (!config) {
    config = await prisma.configuracaoDps.create({
      data: {
        prestadorId,
        nomeSistema: "NotaClient",
        versaoAplicacao: "1.0.0",
        xLocEmi: "1",
        xLocPrestacao: "1",
        tpAmb: 2,
        opSimpNac: 1,
        regEspTrib: 0,
        tribISSQN: 1,
        tpImunidade: 0,
        tpRetISSQN: 1,
      },
    });
  }

  return config;
}

function buildIdentificador(prestadorId: string): string {
  const serial = Math.floor(Math.random() * 1_000_000)
    .toString()
    .padStart(6, "0");

  return `${prestadorId.slice(0, 8)}-${serial}`;
}

function mapPrestadorToXmlInput(prestador: PrestadorApi): PartyBase {
  return {
    cnpj: prestador.cnpj,
    codigoMunicipio: prestador.codigoMunicipio,
    inscricaoMunicipal: prestador.inscricaoMunicipal ?? null,
    telefone: prestador.telefone ?? null,
    email: prestador.email ?? null,
  };
}

function mapTomadorToXmlInput(tomador: TomadorApi): TomadorBase {
  return {
    tipoDocumento: tomador.tipoDocumento,
    documento: tomador.documento,
    nomeRazaoSocial: tomador.nomeRazaoSocial,
    codigoMunicipio: tomador.codigoMunicipio,
    logradouro: tomador.logradouro,
    numero: tomador.numero,
    bairro: tomador.bairro,
    complemento: tomador.complemento,
    cep: tomador.cep,
    telefone: tomador.telefone,
    email: tomador.email,
    codigoPais: (tomador as any).codigoPais ?? null,
    codigoPostalExterior: (tomador as any).codigoPostalExterior ?? null,
    cidadeExterior: (tomador as any).cidadeExterior ?? null,
    estadoExterior: (tomador as any).estadoExterior ?? null,
  };
}

function mapServicoToXmlInput(servico: ServicoApi): ServicoBase {
  return {
    descricao: servico.descricao,
    valorUnitario: servico.valorUnitario,
    codigoTributacaoMunicipal: servico.codigoTributacaoMunicipal,
    codigoTributacaoNacional: servico.codigoTributacaoNacional,
    codigoNbs: servico.codigoNbs,
    aliquotaIss: servico.aliquotaIss,
  };
}

function mapConfiguracaoToXmlInput(config: ConfiguracaoDps): ConfiguracaoBase {
  return {
    ambGer: config.ambGer,
    tpAmb: config.tpAmb,
    verAplic: config.versaoAplicacao,
    tpEmis: config.tpEmis,
    opSimpNac: config.opSimpNac,
    regEspTrib: config.regEspTrib,
    tribISSQN: config.tribISSQN,
    tpImunidade: config.tpImunidade,
    tpRetISSQN: config.tpRetISSQN,
    xLocPrestacao: config.xLocPrestacao,
    pTotTribFed: config.pTotTribFed.toNumber(),
    pTotTribEst: config.pTotTribEst.toNumber(),
    pTotTribMun: config.pTotTribMun.toNumber(),
  };
}

export const assinarDpsSchema = z.object({
  dpsId: z.string().uuid(),
  tag: z.string().min(1),
  certificateId: z.string().optional(),
});

export type AssinarDpsInput = z.infer<typeof assinarDpsSchema>;

export async function assinarDps({ dpsId, tag, certificateId }: AssinarDpsInput): Promise<AssinarXmlResponse> {
  const dps = await resolveDps(dpsId);

  const xmlGerado = dps.xmlGerado;

  if (!xmlGerado) {
    throw new AppError("XML da DPS não foi gerado", 400);
  }

  const prestadorDto = await getPrestador(dps.prestadorId);

  logInfo("Resolvendo certificado para assinatura", { dpsId, prestadorId: dps.prestadorId });

  const resolvedCertificate = await resolveCertificateId({
    prestadorCnpj: prestadorDto.cnpj ?? "",
    provided: certificateId,
    dpsCertificado: null,
    prestadorCertificado: null,
  });

  logInfo("Certificado resolvido para assinatura", { dpsId, certificateId: resolvedCertificate });

  let xmlAssinado: string;

  try {
    xmlAssinado = await assinarXml({
      prestadorId: dps.prestadorId,
      xml: xmlGerado,
      tag,
      certificateId: resolvedCertificate,
    });

    xmlAssinado = normalizeSignedDpsXml(xmlAssinado);
    
    // Validar estrutura do XML após normalização
    const { validateXmlWellFormed } = await import("./xml/xml-validator");
    const validationResult = validateXmlWellFormed(xmlAssinado);
    
    if (!validationResult.valid) {
      logError("XML malformado após normalização da assinatura", {
        dpsId,
        error: validationResult.error,
      });
      
      // Salvar XML problemático para análise
      try {
        await saveXmlToFile(xmlAssinado, `dps_malformed_${dps.identificador}`, "erros");
      } catch (saveError) {
        logError("Erro ao salvar XML malformado", { saveError });
      }
      
      throw new AppError(
        `XML malformado após assinatura: ${validationResult.error}`,
        500,
        { validationError: validationResult.error }
      );
    }
  } catch (error) {
    const notaError = parseNotaApiError(error);
    logError("Falha ao assinar DPS", {
      dpsId,
      prestadorId: dps.prestadorId,
      certificateId: resolvedCertificate,
      statusCode: notaError.statusCode,
      detalhes: notaError.details,
    });

    throw new AppError(notaError.message, notaError.statusCode ?? 502, notaError.details);
  }

  logInfo("DPS assinada com sucesso", { dpsId, prestadorId: dps.prestadorId });

  // Análise e salvamento do XML assinado para debug
  try {
    analyzeXml(xmlAssinado, `DPS_ASSINADO_${dps.identificador}`);
    await saveXmlToFile(xmlAssinado, `dps_assinado_${dps.identificador}`, "assinado");
  } catch (error) {
    logError("Erro ao analisar/salvar XML assinado", { error });
  }

  await prisma.dps.update({
    where: { id: dpsId },
    data: {
      xmlAssinado,
      status: DpsStatus.ASSINADO,
      mensagemErro: null,
      digestValue: null,
    },
  });

  return xmlAssinado;
}

export const emitirNfseSchema = z.object({
  dpsId: z.string().uuid(),
  certificateId: z.string().optional(),
  ambiente: z.number().int().min(1).max(2).optional(),
});

export type EmitirNfseInput = z.infer<typeof emitirNfseSchema>;

export async function emitirNotaFiscal({ dpsId, certificateId, ambiente }: EmitirNfseInput): Promise<EmitirNfseResponse> {
  const dps = await resolveDps(dpsId);

  const xmlAssinado = dps.xmlAssinado;

  if (!xmlAssinado) {
    throw new AppError("DPS precisa estar assinada antes da emissão", 400);
  }

  const prestadorDto = await getPrestador(dps.prestadorId);

  const resolvedCertificate = await resolveCertificateId({
    prestadorCnpj: prestadorDto.cnpj ?? "",
    provided: certificateId,
    dpsCertificado: null,
    prestadorCertificado: null,
  });

  const ambienteApi = mapAmbienteToApi(dps.ambiente, ambiente);

  logInfo("Solicitando emissão da NFSe", {
    dpsId,
    prestadorId: dps.prestadorId,
    ambiente: ambienteApi,
    certificateId: resolvedCertificate,
  });

  // Salvar XML que será enviado para análise
  try {
    await saveXmlToFile(xmlAssinado, `dps_enviado_${dps.identificador}`, "enviado");
    console.log(`[NFSe Debug] XML a ser enviado (primeiros 500 chars):\n${xmlAssinado.substring(0, 500)}...`);
  } catch (error) {
    logError("Erro ao salvar XML antes do envio", { error });
  }

  let response: EmitirNfseResponse;

  try {
    response = await emitirNfse({
      xmlAssinado,
      ambiente: ambienteApi,
      certificateId: resolvedCertificate,
    });
  } catch (error) {
    const notaError = parseNotaApiError(error);
    logError("Falha ao enviar solicitação de emissão para SEFIN", {
      dpsId,
      prestadorId: dps.prestadorId,
      ambiente: ambienteApi,
      statusCode: notaError.statusCode,
      detalhes: notaError.details,
    });

    throw new AppError(notaError.message, notaError.statusCode ?? 502, notaError.details);
  }

  logInfo("Resposta da SEFIN recebida", {
    dpsId,
    prestadorId: dps.prestadorId,
    statusCode: response.statusCode,
    rawResponseContentType: response.rawResponseContentType,
  });

  // Log detalhado da resposta para análise
  console.log(`\n========== Resposta SEFIN - DPS ${dps.identificador} ==========`);
  console.log(`Status Code: ${response.statusCode}`);
  console.log(`Content Type: ${response.rawResponseContentType}`);
  console.log(`Chave Acesso: ${response.chaveAcesso || "N/A"}`);
  console.log(`Raw Response Content:\n${response.rawResponseContent}`);
  console.log("=".repeat(60) + "\n");

  // Salvar resposta da SEFIN
  try {
    await saveXmlToFile(
      response.rawResponseContent || "Sem conteúdo",
      `sefin_response_${dps.identificador}`,
      "respostas"
    );
  } catch (error) {
    logError("Erro ao salvar resposta da SEFIN", { error });
  }

  const chaveAcesso = response.chaveAcesso;

  if (!chaveAcesso || (response.statusCode && response.statusCode >= 400)) {
    const message = resolveSefinErrorMessage(response.rawResponseContent, response.statusCode);

    logError("SEFIN retornou erro ao emitir NFSe", {
      dpsId,
      prestadorId: dps.prestadorId,
      statusCode: response.statusCode,
      rawResponseContent: response.rawResponseContent,
    });

    throw new AppError(message, 502, {
      statusCode: response.statusCode,
      rawResponseContentType: response.rawResponseContentType,
      rawResponseContent: response.rawResponseContent,
    });
  }

  logInfo("NFSe emitida com sucesso", {
    dpsId,
    prestadorId: dps.prestadorId,
    chaveAcesso,
  });

  const now = new Date();
  let notaPersisted: NotaEmitidaPersisted | null = null;

  await prisma.$transaction(async (tx) => {
    await tx.dps.update({
      where: { id: dpsId },
      data: {
        status: DpsStatus.ENVIADO,
        dataEnvio: now,
        dataRetorno: now,
        protocolo: chaveAcesso,
        mensagemErro: null,
      },
    });

    const nota = await tx.notaFiscal.upsert({
      where: { dpsId },
      create: {
        dpsId,
        prestadorId: dps.prestadorId,
        tomadorId: dps.tomadorId,
        ambiente: dps.ambiente,
        chaveAcesso,
        numero: response.numero ?? "",
        codigoVerificacao: response.codigoVerificacao,
        urlNfse: response.urlNfse,
        statusCode: response.statusCode,
        rawResponseContentType: response.rawResponseContentType,
        rawResponseContent: response.rawResponseContent,
      },
      update: {
        ambiente: dps.ambiente,
        chaveAcesso,
        numero: response.numero ?? "",
        codigoVerificacao: response.codigoVerificacao,
        urlNfse: response.urlNfse,
        statusCode: response.statusCode,
        rawResponseContentType: response.rawResponseContentType,
        rawResponseContent: response.rawResponseContent,
        ativo: true,
      },
    });

    notaPersisted = {
      id: nota.id,
      numero: nota.numero ?? null,
      chaveAcesso,
      prestadorId: nota.prestadorId,
      tomadorId: nota.tomadorId,
    };

    if (response.xmlNfse) {
      await tx.notaDocumento.deleteMany({
        where: {
          notaFiscalId: nota.id,
          tipo: NotaDocumentoTipo.XML_NFSE,
        },
      });

      await tx.notaDocumento.create({
        data: {
          notaFiscalId: nota.id,
          tipo: NotaDocumentoTipo.XML_NFSE,
          conteudo: response.xmlNfse,
          contentType: "application/xml",
          nomeArquivo: `NFSe-${response.numero ?? nota.numero}.xml`,
        },
      });
    }

    if (response.nfseBase64Gzip) {
      await tx.notaDocumento.deleteMany({
        where: {
          notaFiscalId: nota.id,
          tipo: NotaDocumentoTipo.NFSE_GZIP,
        },
      });

      await tx.notaDocumento.create({
        data: {
          notaFiscalId: nota.id,
          tipo: NotaDocumentoTipo.NFSE_GZIP,
          conteudo: response.nfseBase64Gzip,
          contentType: "application/gzip",
          nomeArquivo: `NFSe-${response.numero ?? nota.numero}.gz`,
        },
      });
    }
  });

  if (!notaPersisted) {
    logError("NFSe emissão concluída, mas nota não foi persistida", {
      dpsId,
      chaveAcesso,
    });

    return response;
  }

  const notaInfo = notaPersisted as NotaEmitidaPersisted;

  const numeroNota = notaInfo.numero && notaInfo.numero.trim().length > 0
    ? notaInfo.numero.trim()
    : chaveAcesso;
  const logContextBase = {
    dpsId,
    notaId: notaInfo.id,
    chaveAcesso: notaInfo.chaveAcesso,
    numeroNota,
  };

  try {
    logInfo("NFSe iniciando preparo de e-mail", {
      ...logContextBase,
      prestadorId: notaInfo.prestadorId,
      tomadorId: notaInfo.tomadorId,
    });

    const tomador = await prisma.tomador.findUnique({
      where: { id: notaInfo.tomadorId },
      select: {
        email: true,
        nomeRazaoSocial: true,
      },
    });

    const tomadorEmail = tomador?.email?.trim();
    const prestadorEmail = prestadorDto.email?.trim();
    const destinatarioFixo = "carlos.pacheco@pacbel.com.br";

    if (!tomadorEmail) {
      logInfo("NFSe e-mail não enviado: tomador sem e-mail", {
        ...logContextBase,
        prestadorEmail,
      });
      return response;
    }

    const destinatarios = Array.from(
      new Set([
        tomadorEmail,
        prestadorEmail,
        destinatarioFixo,
      ].filter((value): value is string => Boolean(value)))
    );

    logInfo("NFSe preparando anexos para e-mail", {
      ...logContextBase,
      destinatarios,
    });

    let xmlConteudo = response.xmlNfse?.trim() ?? null;
    let xmlNomeArquivo = `NFSe-${numeroNota}.xml`;
    let xmlContentType = "application/xml";

    if (!xmlConteudo) {
      const documentoXml = await prisma.notaDocumento.findFirst({
        where: {
          notaFiscalId: notaInfo.id,
          tipo: NotaDocumentoTipo.XML_NFSE,
        },
        orderBy: { createdAt: "desc" },
        select: {
          conteudo: true,
          nomeArquivo: true,
          contentType: true,
        },
      });

      if (documentoXml?.conteudo) {
        xmlConteudo = documentoXml.conteudo;
        xmlNomeArquivo = documentoXml.nomeArquivo ?? xmlNomeArquivo;
        xmlContentType = documentoXml.contentType ?? xmlContentType;
      }
    }

    if (!xmlConteudo) {
      logError("NFSe e-mail abortado: XML da nota não encontrado", logContextBase);
      return response;
    }

    let danfseAttachment: EmailAttachment | null = null;

    try {
      const { buffer, filename, contentType } = await gerarDanfse(notaInfo.chaveAcesso, {
        ambiente: ambienteApi,
        certificateId: resolvedCertificate,
      });

      danfseAttachment = {
        fileName: filename,
        contentBase64: buffer.toString("base64"),
        contentType,
      };
    } catch (error) {
      logError("NFSe e-mail: falha ao gerar DANFSe", {
        ...logContextBase,
        erro: error instanceof Error ? error.message : String(error),
      });
    }

    if (!danfseAttachment) {
      logError("NFSe e-mail abortado: DANFSe não gerada", logContextBase);
      return response;
    }

    const attachments: EmailAttachment[] = [
      {
        fileName: xmlNomeArquivo,
        contentBase64: Buffer.from(xmlConteudo, "utf-8").toString("base64"),
        contentType: xmlContentType,
      },
      danfseAttachment,
    ];

    const assunto = `NFSe ${numeroNota} emitida`;
    const nomePrestador = prestadorDto.nomeFantasia
      ?? prestadorDto.razaoSocial
      ?? prestadorDto.cnpj
      ?? prestadorDto.id;

    const html = [
      `<p>Olá,</p>`,
      `<p>A NFS-e número <strong>${numeroNota}</strong> foi emitida com sucesso.</p>`,
      `<p>Prestador: ${nomePrestador}</p>`,
      `<p>Chave de acesso: ${notaInfo.chaveAcesso}</p>`,
      `<p>Em anexo seguem o XML e o DANFSe correspondentes.</p>`,
      `<p>Atenciosamente,<br/>Equipe Nota Nacional</p>`,
    ].join("");

    logInfo("NFSe enviando e-mail", {
      ...logContextBase,
      destinatarios,
      quantidadeAnexos: attachments.length,
    });

    await sendEmail({
      to: destinatarios,
      subject: assunto,
      html,
      attachments,
    });

    logInfo("NFSe e-mail enviado com sucesso", {
      ...logContextBase,
      destinatarios,
    });
  } catch (error) {
    logError("NFSe falha inesperada ao enviar e-mail", {
      ...logContextBase,
      erro: error instanceof Error ? error.message : String(error),
    });
  }

  return response;
}
export const cancelarNfseSchema = z.object({
  chaveAcesso: z.string().min(1),
  motivoCodigo: z.enum(CANCELAMENTO_MOTIVO_CODES),
  justificativa: z.string().min(5),
  ambiente: z.number().int().min(1).max(2).optional(),
});

export type CancelarNfseInput = z.infer<typeof cancelarNfseSchema>;

export async function cancelarNota({
  chaveAcesso,
  motivoCodigo,
  justificativa,
  ambiente,
}: CancelarNfseInput): Promise<CancelarNfseResponse> {
  const [nota, dps] = await Promise.all([
    prisma.notaFiscal.findFirst({
      where: { chaveAcesso },
    }),
    prisma.dps.findFirst({
      where: { notaFiscal: { chaveAcesso } },
    }),
  ]);

  if (!nota) {
    throw new AppError("NFSe não encontrada", 404);
  }

  const prestadorDto = await getPrestador(nota.prestadorId);
  const motivo = findCancelamentoMotivo(motivoCodigo);

  const resolvedCertificate = await resolveCertificateId({
    prestadorCnpj: prestadorDto.cnpj ?? "",
    provided: undefined,
    notaCertificado: null,
    dpsCertificado: null,
    prestadorCertificado: null,
  });

  const ambienteApi = mapAmbienteToApi(nota.ambiente, ambiente);

  const verAplic = dps?.versaoAplicacao ?? dps?.versao ?? "NFSE_NACIONAL_1.00";

  const { xml: cancelamentoXml, infPedRegId } = generateCancelamentoXml({
    chaveAcesso: nota.chaveAcesso,
    ambiente: ambienteApi,
    verAplic,
    cnpjAutor: prestadorDto.cnpj ?? "",
    motivoCodigo,
    motivoDescricao: motivo?.descricao ?? "Cancelamento de NFS-e",
    justificativa,
  });

  logInfo("XML de cancelamento gerado", {
    chaveAcesso,
    infPedRegId,
    xml: cancelamentoXml,
  });

  let xmlAssinado: string;

  try {
    xmlAssinado = await assinarXml({
      prestadorId: nota.prestadorId,
      xml: cancelamentoXml,
      tag: "infPedReg",
      certificateId: resolvedCertificate,
    });

    xmlAssinado = normalizeSignedPedRegXml(xmlAssinado);
  } catch (error) {
    const notaError = parseNotaApiError(error);
    logError("Falha ao assinar pedido de cancelamento", {
      chaveAcesso,
      prestadorId: nota.prestadorId,
      certificateId: resolvedCertificate,
      statusCode: notaError.statusCode,
      detalhes: notaError.details,
    });

    throw new AppError(notaError.message, notaError.statusCode ?? 502, notaError.details);
  }

  const eventoXmlGZipBase64 = compressToGzipBase64(xmlAssinado);

  const notaApiPayload = {
    chaveAcesso,
    eventoXmlGZipBase64,
    ambiente: ambienteApi,
    certificateId: resolvedCertificate,
  };

  logInfo("Solicitando cancelamento de NFSe", {
    chaveAcesso,
    prestadorId: nota.prestadorId,
    ambiente: ambienteApi,
    certificateId: resolvedCertificate,
    motivoCodigo,
    infPedRegId,
    notaApiUrl: "/api/nfse/cancelar",
    notaApiPayload,
  });

  logDebug("Payload completo enviado para Nota API (cancelamento)", {
    url: "/api/nfse/cancelar",
    chaveAcesso,
    ambiente: ambienteApi,
    certificateId: resolvedCertificate,
    motivoCodigo,
    eventoXmlGZipBase64Length: eventoXmlGZipBase64.length,
    payload: notaApiPayload,
  });

  let response: CancelarNfseResponse;

  try {
    response = await cancelarNfse(notaApiPayload);
  } catch (error) {
    const notaError = parseNotaApiError(error);
    logError("Falha ao solicitar cancelamento à SEFIN", {
      chaveAcesso,
      prestadorId: nota.prestadorId,
      statusCode: notaError.statusCode,
      detalhes: notaError.details,
    });

    throw new AppError(notaError.message, notaError.statusCode ?? 502, notaError.details);
  }

  logInfo("Resposta de cancelamento recebida", {
    chaveAcesso,
    prestadorId: nota.prestadorId,
    statusCode: response.statusCode,
    infPedRegId,
    notaApiUrl: "/api/nfse/cancelar",
    notaApiPayload,
  });

  const isSefinError = response.statusCode >= 400;

  if (isSefinError) {
    logError("SEFIN rejeitou cancelamento", {
      chaveAcesso,
      prestadorId: nota.prestadorId,
      statusCode: response.statusCode,
      rawResponseContentType: response.contentType,
      rawResponseContent: response.content,
    });

    await prisma.notaFiscal.update({
      where: { id: nota.id },
      data: {
        statusCode: response.statusCode,
        rawResponseContentType: response.contentType,
        rawResponseContent: response.content,
        ativo: true,
      },
    });

    if (nota.dpsId) {
      await prisma.dps.update({
        where: { id: nota.dpsId },
        data: {
          status: DpsStatus.ENVIADO,
          mensagemErro: resolveSefinErrorMessage(response.content, response.statusCode),
          dataRetorno: new Date(),
        },
      });
    }

    throw new AppError(resolveSefinErrorMessage(response.content, response.statusCode), 502, {
      statusCode: response.statusCode,
      rawResponseContentType: response.contentType,
      rawResponseContent: response.content,
    });
  }

  await prisma.$transaction(async (tx) => {
    await tx.notaFiscal.update({
      where: { id: nota.id },
      data: {
        statusCode: response.statusCode,
        rawResponseContentType: response.contentType,
        rawResponseContent: response.content,
        ativo: false,
      },
    });

    if (nota.dpsId) {
      await tx.dps.update({
        where: { id: nota.dpsId },
        data: {
          status: DpsStatus.CANCELADO,
          mensagemErro: null,
          dataRetorno: new Date(),
        },
      });
    }

    await tx.notaDocumento.create({
      data: {
        notaFiscalId: nota.id,
        tipo: NotaDocumentoTipo.OUTRO,
        conteudo: eventoXmlGZipBase64,
        contentType: "application/gzip",
        nomeArquivo: `Cancelamento-${chaveAcesso}.gz`,
      },
    });
  });

  return response;
}

function compressToGzipBase64(value: string): string {
  const normalized = value.trim();
  const buffer = Buffer.from(normalized, "utf-8");
  const compressed = gzipSync(buffer);
  return compressed.toString("base64");
}

interface GerarDanfseOptions {
  certificateId?: string;
  ambiente?: number;
}

interface GerarDanfseResponse {
  buffer: Buffer;
  filename: string;
  contentType: string;
}

export async function gerarDanfse(
  chaveAcesso: string,
  options: GerarDanfseOptions = {}
): Promise<GerarDanfseResponse> {
  const nota = await prisma.notaFiscal.findFirst({
    where: { chaveAcesso },
  });

  if (!nota) {
    throw new AppError("NFSe não encontrada", 404);
  }

  const prestadorDto = await getPrestador(nota.prestadorId);

  const resolvedCertificate = await resolveCertificateId({
    prestadorCnpj: prestadorDto.cnpj ?? "",
    provided: options.certificateId,
    notaCertificado: null,
    dpsCertificado: null,
    prestadorCertificado: null,
  });

  const ambienteApi = mapAmbienteToApi(nota.ambiente, options.ambiente);

  logInfo("Solicitando DANFSE", {
    chaveAcesso,
    prestadorId: nota.prestadorId,
    ambiente: ambienteApi,
    certificateId: resolvedCertificate,
  });

  let buffer: Buffer;

  try {
    buffer = await gerarDanfseApi(chaveAcesso, {
      ambiente: ambienteApi,
      certificateId: resolvedCertificate,
    });
  } catch (error) {
    const notaError = parseNotaApiError(error);
    logError("Falha ao gerar DANFSE", {
      chaveAcesso,
      prestadorId: nota.prestadorId,
      statusCode: notaError.statusCode,
      detalhes: notaError.details,
    });

    throw new AppError(notaError.message, notaError.statusCode ?? 502, notaError.details);
  }

  logInfo("DANFSE gerada com sucesso", {
    chaveAcesso,
    prestadorId: nota.prestadorId,
  });

  const filename = `NFSe-${nota.numero || chaveAcesso}.pdf`;

  return {
    buffer,
    filename,
    contentType: "application/pdf",
  };
}
