import type { Ambiente, Prisma } from "@prisma/client";
import { Ambiente as AmbienteEnum, DpsStatus, NotaDocumentoTipo } from "@prisma/client";
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
import type {
  AssinarXmlResponse,
  CancelarNfseResponse,
  CertificadoDto,
  EmitirNfseResponse,
} from "./types";

type Nullable<T> = T | null | undefined;

type DpsWithPrestador = Prisma.DpsGetPayload<{
  include: {
    prestador: true;
  };
}>;

type NotaWithRelations = Prisma.NotaFiscalGetPayload<{
  include: {
    prestador: true;
    dps: true;
  };
}>;

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

  const [prestador, tomador, servico, configuracao] = await Promise.all([
    prisma.prestador.findUnique({ where: { id: data.prestadorId, ativo: true } }),
    prisma.tomador.findUnique({ where: { id: data.tomadorId, ativo: true } }),
    prisma.servico.findUnique({ where: { id: data.servicoId, ativo: true } }),
    resolveConfiguracaoDps(),
  ]);

  if (!prestador) {
    throw new AppError("Prestador não encontrado ou inativo", 404);
  }

  if (!tomador) {
    throw new AppError("Tomador não encontrado ou inativo", 404);
  }

  if (!servico) {
    throw new AppError("Serviço não encontrado ou inativo", 404);
  }

  const competencia = new Date(data.competencia);
  const emissao = new Date(data.dataEmissao);

  const identificador = buildIdentificador(prestador.id);
  const numero = await prisma.dps.count({ where: { prestadorId: prestador.id } }) + 1;
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
    },
    competencia: competencia.toISOString(),
    dataEmissao: emissao.toISOString(),
    configuracao: {
      xLocEmi: configuracao.xLocEmi,
      xLocPrestacao: configuracao.xLocPrestacao,
      verAplic: configuracao.verAplic,
      ambGer: configuracao.ambGer,
      tpEmis: configuracao.tpEmis,
      procEmi: configuracao.procEmi,
      cStat: configuracao.cStat,
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

  const createdDps = await prisma.dps.create({
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
      versaoAplicacao: configuracao.verAplic,
      ambiente: configuracao.ambientePadrao,
      certificadoId: data.certificadoId,
      jsonEntrada: JSON.stringify(jsonEntrada),
      observacoes: data.observacoes ?? configuracao.xTribNac,
    },
    include: {
      prestador: true,
      tomador: true,
      servico: true,
    },
  });

  return createdDps;
}

async function resolveDps(dpsId: string): Promise<DpsWithPrestador> {
  const dps = await prisma.dps.findUnique({
    where: { id: dpsId },
    include: {
      prestador: true,
    },
  });

  if (!dps) {
    throw new AppError("DPS não encontrada", 404);
  }

  return dps;
}

function resolveCertificadoId(options: {
  provided?: Nullable<string>;
  dpsCertificado?: Nullable<string>;
  prestadorCertificado?: Nullable<string>;
  notaCertificado?: Nullable<string>;
}): string {
  const certificateId =
    options.provided?.trim() ||
    options.dpsCertificado?.trim() ||
    options.notaCertificado?.trim() ||
    options.prestadorCertificado?.trim();

  if (!certificateId) {
    throw new AppError("Certificado não configurado para esta operação", 400);
  }

  return certificateId;
}

export async function obterCertificados(): Promise<CertificadoDto[]> {
  return listarCertificados();
}

async function resolveConfiguracaoDps() {
  const config = await prisma.configuracaoDps.findUnique({ where: { id: 1 } });

  if (!config) {
    throw new AppError("Configuração de DPS não encontrada", 500);
  }

  return config;
}

function buildIdentificador(prestadorId: string): string {
  const serial = Math.floor(Math.random() * 1_000_000)
    .toString()
    .padStart(6, "0");

  return `${prestadorId.slice(0, 8)}-${serial}`;
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

  const prestadorCertificadoPadrao = (dps.prestador as Prisma.PrestadorGetPayload<{}>)?.certificadoPadraoId ?? null;

  const resolvedCertificate = resolveCertificadoId({
    provided: certificateId,
    dpsCertificado: dps.certificadoId,
    prestadorCertificado: prestadorCertificadoPadrao,
  });

  const xmlAssinado = await assinarXml({
    prestadorId: dps.prestadorId,
    xml: xmlGerado,
    tag,
    certificateId: resolvedCertificate,
  });

  await prisma.dps.update({
    where: { id: dpsId },
    data: {
      certificadoId: resolvedCertificate,
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

  const prestadorCertificadoPadrao = (dps.prestador as Prisma.PrestadorGetPayload<{}>)?.certificadoPadraoId ?? null;

  const resolvedCertificate = resolveCertificadoId({
    provided: certificateId,
    dpsCertificado: dps.certificadoId,
    prestadorCertificado: prestadorCertificadoPadrao,
  });

  const ambienteApi = mapAmbienteToApi(dps.ambiente, ambiente);

  const response = await emitirNfse({
    xmlAssinado,
    ambiente: ambienteApi,
    certificateId: resolvedCertificate,
  });

  const chaveAcesso = response.chaveAcesso;

  if (!chaveAcesso) {
    throw new AppError("Resposta da emissão não retornou chave de acesso", 502, response);
  }

  const now = new Date();

  await prisma.$transaction(async (tx) => {
    await tx.dps.update({
      where: { id: dpsId },
      data: {
        certificadoId: resolvedCertificate,
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
        certificateId: resolvedCertificate,
        chaveAcesso,
        numero: response.numero ?? "",
        codigoVerificacao: response.codigoVerificacao,
        urlNfse: response.urlNfse,
        statusCode: response.statusCode,
        rawResponseContentType: response.rawResponseContentType,
        rawResponseContent: response.rawResponseContent,
      },
      update: {
        certificateId: resolvedCertificate,
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
  eventoXmlGZipBase64: z.string().min(1),
  ambiente: z.number().int().min(1).max(2).optional(),
  certificateId: z.string().optional(),
});

export type CancelarNfseInput = z.infer<typeof cancelarNfseSchema>;

export async function cancelarNota({
  chaveAcesso,
  eventoXmlGZipBase64,
  ambiente,
  certificateId,
}: CancelarNfseInput): Promise<CancelarNfseResponse> {
  const nota = await prisma.notaFiscal.findFirst({
    where: { chaveAcesso },
    include: {
      prestador: true,
      dps: true,
    },
  });

  if (!nota) {
    throw new AppError("NFSe não encontrada", 404);
  }

  const resolvedCertificate = resolveCertificadoId({
    provided: certificateId,
    notaCertificado: nota.certificateId,
    dpsCertificado: nota.dps?.certificadoId,
    prestadorCertificado: (nota.prestador as Prisma.PrestadorGetPayload<{}>)?.certificadoPadraoId ?? null,
  });

  const ambienteApi = mapAmbienteToApi(nota.ambiente, ambiente);

  const response = await cancelarNfse({
    chaveAcesso,
    eventoXmlGZipBase64,
    ambiente: ambienteApi,
    certificateId: resolvedCertificate,
  });

  await prisma.$transaction(async (tx) => {
    await tx.notaFiscal.update({
      where: { id: nota.id },
      data: {
        certificateId: resolvedCertificate,
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
          certificadoId: resolvedCertificate,
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

export async function gerarDanfse(
  chaveAcesso: string,
  options: { ambiente?: number; certificateId?: string } = {}
): Promise<{ buffer: Buffer; filename: string; contentType: string }> {
  const nota = await prisma.notaFiscal.findFirst({
    where: { chaveAcesso },
    include: {
      prestador: true,
      dps: true,
    },
  });

  if (!nota) {
    throw new AppError("NFSe não encontrada", 404);
  }

  const resolvedCertificate = resolveCertificadoId({
    provided: options.certificateId,
    notaCertificado: nota.certificateId,
    dpsCertificado: nota.dps?.certificadoId,
    prestadorCertificado: (nota.prestador as { certificadoPadraoId?: string | null })?.certificadoPadraoId,
  });

  const ambienteApi = mapAmbienteToApi(nota.ambiente, options.ambiente);

  const buffer = await gerarDanfseApi(chaveAcesso, {
    ambiente: ambienteApi,
    certificateId: resolvedCertificate,
  });

  const filename = `NFSe-${nota.numero || chaveAcesso}.pdf`;

  return {
    buffer,
    filename,
    contentType: "application/pdf",
  };
}
