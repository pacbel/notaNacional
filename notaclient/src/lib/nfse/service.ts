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
}

interface TomadorApi {
  id: string;
  tipoDocumento: "CPF" | "CNPJ";
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

interface ServicoApi {
  id: string;
  descricao: string;
  valorUnitario: number;
  codigoTributacaoMunicipal: string;
  codigoTributacaoNacional: string;
  codigoNbs?: string | null;
  aliquotaIss?: number | null;
}

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
  const signaturePattern = /<Signature[\s\S]*?<\/Signature>/;
  const match = signaturePattern.exec(xml);

  if (!match) {
    return xml;
  }

  const signatureBlock = ensureSignatureReference(match[0], elementId);
  const normalizedSignature = signatureBlock.trim();
  const withoutSignature = xml.slice(0, match.index) + xml.slice(match.index + match[0].length);

  const closingElementTag = `</${elementTag}>`;
  const closingElementIndex = withoutSignature.lastIndexOf(closingElementTag);

  if (closingElementIndex !== -1) {
    const insertPosition = closingElementIndex + closingElementTag.length;
    const before = withoutSignature.slice(0, insertPosition);
    const after = withoutSignature.slice(insertPosition);

    return minifyXml(`${before}${normalizedSignature}${after}`);
  }

  const closingRootTag = `</${rootTag}>`;
  const closingRootIndex = withoutSignature.lastIndexOf(closingRootTag);

  if (closingRootIndex !== -1) {
    const before = withoutSignature.slice(0, closingRootIndex);
    const after = withoutSignature.slice(closingRootIndex);

    return minifyXml(`${before}${normalizedSignature}${after}`);
  }

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

function parseNotaApiError(error: unknown): { message: string; statusCode?: number; details?: unknown } {
  if (typeof error === "object" && error !== null && "isAxiosError" in error) {
    const axiosError = error as AxiosError;
    const statusCode = axiosError.response?.status;
    const data = axiosError.response?.data;
    let message = axiosError.message;

    if (typeof data === "string" && data.trim()) {
      message = data;
    } else if (data && typeof data === "object" && "message" in data && typeof (data as { message: unknown }).message === "string") {
      message = (data as { message: string }).message;
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

  if (!prestadorDto || !prestadorDto.ativo) {
    throw new AppError("Prestador não encontrado ou inativo", 404);
  }

  const prestador: PrestadorApi = {
    id: prestadorDto.id,
    cnpj: prestadorDto.cnpj ?? "",
    nomeFantasia: prestadorDto.nomeFantasia ?? "",
    razaoSocial: prestadorDto.razaoSocial ?? "",
    codigoMunicipio: prestadorDto.codigoMunicipio ?? prestadorDto.codigoMunicipioIbge ?? "",
    cidade: prestadorDto.cidade ?? "",
    estado: prestadorDto.estado ?? "",
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
      xLocEmi: configuracao.xLocEmi,
      xLocPrestacao: configuracao.xLocPrestacao,
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
      pTotTrib: {
        fed: configuracao.pTotTribFed,
        est: configuracao.pTotTribEst,
        mun: configuracao.pTotTribMun,
      },
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
        observacoes: data.observacoes ?? configuracao.xTribNac,
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
        tipoDocumento: created.tomador.tipoDocumento,
        documento: created.tomador.documento,
        nomeRazaoSocial: created.tomador.nomeRazaoSocial,
        codigoMunicipio: created.tomador.codigoMunicipio,
        logradouro: created.tomador.logradouro,
        numero: created.tomador.numero,
        bairro: created.tomador.bairro,
        complemento: created.tomador.complemento,
        cep: created.tomador.cep,
        telefone: created.tomador.telefone,
        email: created.tomador.email,
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
      configuracao: mapConfiguracaoToXmlInput(configuracao),
      observacoes: data.observacoes,
    });

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
        xTribNac: "01.07.00",
        xNBS: "1.0101.10.00",
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
    pTotTribFed: config.pTotTribFed,
    pTotTribEst: config.pTotTribEst,
    pTotTribMun: config.pTotTribMun,
    xLocPrestacao: config.xLocPrestacao,
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
