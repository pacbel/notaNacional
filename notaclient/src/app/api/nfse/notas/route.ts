import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { handleRouteError } from "@/lib/http";

const DEFAULT_LIMIT = 50;

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limitParam = Number(searchParams.get("limit") ?? DEFAULT_LIMIT);

    const take = Number.isNaN(limitParam) || limitParam <= 0 ? DEFAULT_LIMIT : Math.min(limitParam, 200);

    const notas = await prisma.notaFiscal.findMany({
      orderBy: {
        createdAt: "desc",
      },
      take,
      include: {
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
        dps: {
          select: {
            id: true,
            numero: true,
            serie: true,
            status: true,
            certificadoId: true,
            servico: {
              select: {
                valorUnitario: true,
                descricao: true,
              },
            },
          },
        },
      },
    });

    const payload = notas.map((nota) => ({
      id: nota.id,
      chaveAcesso: nota.chaveAcesso,
      numero: nota.numero,
      codigoVerificacao: nota.codigoVerificacao,
      urlNfse: nota.urlNfse,
      ambiente: nota.ambiente,
      statusCode: nota.statusCode,
      createdAt: nota.createdAt.toISOString(),
      updatedAt: nota.updatedAt.toISOString(),
      prestador: {
        id: nota.prestador.id,
        nomeFantasia: nota.prestador.nomeFantasia,
        cnpj: nota.prestador.cnpj,
      },
      tomador: {
        id: nota.tomador.id,
        nomeRazaoSocial: nota.tomador.nomeRazaoSocial,
        documento: nota.tomador.documento,
      },
      certificateId: nota.certificateId ?? undefined,
      dps: nota.dps
        ? {
            id: nota.dps.id,
            numero: nota.dps.numero,
            serie: nota.dps.serie,
            status: nota.dps.status,
            certificadoId: nota.dps.certificadoId ?? undefined,
            servico: {
              descricao: nota.dps.servico.descricao,
              valorUnitario: nota.dps.servico.valorUnitario.toNumber(),
            },
          }
        : null,
    }));

    return NextResponse.json(payload);
  } catch (error) {
    return handleRouteError(error, "Erro ao listar NFSe emitidas");
  }
}
