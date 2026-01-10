import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { DpsStatus } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { handleRouteError } from "@/lib/http";
import { createDps } from "@/lib/nfse/service";
import { dpsCreateSchema } from "@/lib/validators/dps";

const DEFAULT_STATUSES: DpsStatus[] = [DpsStatus.RASCUNHO, DpsStatus.ASSINADO];

function isValidStatus(value: string): value is DpsStatus {
  return Object.values(DpsStatus).includes(value as DpsStatus);
}

export async function POST(request: Request) {
  try {
    const payload = await request.json().catch(() => null);
    const parseResult = dpsCreateSchema.safeParse(payload);

    if (!parseResult.success) {
      return NextResponse.json({ message: "Dados inválidos", issues: parseResult.error.format() }, { status: 400 });
    }

    const dps = await createDps(parseResult.data);

    return NextResponse.json(
      {
        id: dps.id,
        identificador: dps.identificador,
        numero: dps.numero,
        serie: dps.serie,
        status: dps.status,
        competencia: dps.competencia.toISOString(),
        dataEmissao: dps.dataEmissao.toISOString(),
        ambiente: dps.ambiente,
        prestador: {
          id: dps.prestador.id,
          nomeFantasia: dps.prestador.nomeFantasia,
          cnpj: dps.prestador.cnpj,
        },
        tomador: {
          id: dps.tomador.id,
          nomeRazaoSocial: dps.tomador.nomeRazaoSocial,
          documento: dps.tomador.documento,
        },
        servico: {
          id: dps.servico.id,
          descricao: dps.servico.descricao,
          valorUnitario: dps.servico.valorUnitario.toNumber(),
        },
        certificadoId: dps.certificadoId,
        createdAt: dps.createdAt.toISOString(),
        updatedAt: dps.updatedAt.toISOString(),
      },
      { status: 201 }
    );
  } catch (error) {
    return handleRouteError(error, "Erro ao criar DPS");
  }
}

function resolveStatuses(param: string | null): DpsStatus[] {
  if (!param) {
    return DEFAULT_STATUSES;
  }

  const statuses = param
    .split(",")
    .map((value) => value.trim().toUpperCase())
    .filter(isValidStatus);

  if (statuses.length === 0) {
    return DEFAULT_STATUSES;
  }

  return statuses;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const statusParam = searchParams.get("status");

    const statuses = resolveStatuses(statusParam);

    const dpsList = await prisma.dps.findMany({
      where: {
        ativo: true,
        status: {
          in: statuses,
        },
      },
      select: {
        id: true,
        identificador: true,
        numero: true,
        serie: true,
        versao: true,
        versaoAplicacao: true,
        tipoEmissao: true,
        codigoLocalEmissao: true,
        competencia: true,
        dataEmissao: true,
        ambiente: true,
        status: true,
        prestador: {
          select: {
            id: true,
            nomeFantasia: true,
            cnpj: true,
          },
        },
        tomador: {
          select: {
            id: true,
            nomeRazaoSocial: true,
            documento: true,
          },
        },
        servico: {
          select: {
            id: true,
            descricao: true,
            valorUnitario: true,
          },
        },
        certificadoId: true,
        protocolo: true,
        dataEnvio: true,
        dataRetorno: true,
        updatedAt: true,
      },
      orderBy: {
        updatedAt: "desc",
      },
    });

    const payload = dpsList.map((dps) => ({
      id: dps.id,
      identificador: dps.identificador,
      numero: dps.numero,
      serie: dps.serie,
      versao: dps.versao,
      versaoAplicacao: dps.versaoAplicacao,
      tipoEmissao: dps.tipoEmissao,
      codigoLocalEmissao: dps.codigoLocalEmissao,
      competencia: dps.competencia.toISOString(),
      dataEmissao: dps.dataEmissao.toISOString(),
      ambiente: dps.ambiente,
      status: dps.status,
      prestador: {
        id: dps.prestador.id,
        nomeFantasia: dps.prestador.nomeFantasia,
        cnpj: dps.prestador.cnpj,
      },
      tomador: {
        id: dps.tomador.id,
        nomeRazaoSocial: dps.tomador.nomeRazaoSocial,
        documento: dps.tomador.documento,
      },
      servico: {
        id: dps.servico.id,
        descricao: dps.servico.descricao,
        valorUnitario: dps.servico.valorUnitario.toNumber(),
      },
      certificadoId: dps.certificadoId,
      protocolo: dps.protocolo,
      dataEnvio: dps.dataEnvio ? dps.dataEnvio.toISOString() : null,
      dataRetorno: dps.dataRetorno ? dps.dataRetorno.toISOString() : null,
      updatedAt: dps.updatedAt.toISOString(),
    }));

    return NextResponse.json(payload);
  } catch (error) {
    return handleRouteError(error, "Erro ao listar DPS");
  }
}
