import { NextResponse } from "next/server";
import { DpsStatus, Ambiente as AmbienteEnum, Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { handleRouteError } from "@/lib/http";
import { getCurrentUser } from "@/lib/auth";
import { getPrestadoresByIds } from "@/lib/services/prestador";

const DEFAULT_PAGE = 1;
const DEFAULT_PER_PAGE = 25;
const MAX_PER_PAGE = 200;

function isValidStatus(value: string): value is DpsStatus {
  return Object.values(DpsStatus).includes(value as DpsStatus);
}

function resolveNumberParam(value: string | null, fallback: number): number {
  if (!value) {
    return fallback;
  }

  const parsed = Number(value);

  if (Number.isNaN(parsed) || parsed <= 0) {
    return fallback;
  }

  return parsed;
}

function resolveDateParam(value: string | null): Date | null {
  if (!value) {
    return null;
  }

  const date = new Date(value);

  return Number.isNaN(date.getTime()) ? null : date;
}

function parseDecimal(param: string | null): Prisma.Decimal | null {
  if (!param) {
    return null;
  }

  const parsed = Number(param);

  if (Number.isNaN(parsed)) {
    return null;
  }

  return new Prisma.Decimal(parsed);
}

function normalizeDocument(value: string): string {
  return value.replace(/\D/g, "");
}

function resolveStatuses(param: string | null): DpsStatus[] | undefined {
  if (!param) {
    return undefined;
  }

  const statuses = param
    .split(",")
    .map((value) => value.trim().toUpperCase())
    .filter(isValidStatus);

  return statuses.length > 0 ? statuses : undefined;
}

export async function GET(request: Request) {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return NextResponse.json({ message: "Não autorizado" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search")?.trim();
    const ambienteParam = searchParams.get("ambiente")?.trim().toUpperCase() as AmbienteEnum | undefined;
    const startDate = resolveDateParam(searchParams.get("startDate"));
    const endDate = resolveDateParam(searchParams.get("endDate"));
    const minValueParam = searchParams.get("minValue");
    const maxValueParam = searchParams.get("maxValue");
    const tomadorIds = searchParams.getAll("tomadorId").filter(Boolean);
    const statuses = resolveStatuses(searchParams.get("status"));
    const page = Math.max(1, resolveNumberParam(searchParams.get("page"), DEFAULT_PAGE));
    const perPage = Math.min(MAX_PER_PAGE, resolveNumberParam(searchParams.get("perPage"), DEFAULT_PER_PAGE));
    const skip = (page - 1) * perPage;

    const where: Prisma.NotaFiscalWhereInput = {
      prestadorId: currentUser.prestadorId, // Forçar filtro por prestador
    };

    if (ambienteParam === AmbienteEnum.PRODUCAO || ambienteParam === AmbienteEnum.HOMOLOGACAO) {
      where.ambiente = ambienteParam;
    }

    if (tomadorIds.length > 0) {
      where.tomadorId = {
        in: tomadorIds,
      };
    }

    if (startDate || endDate) {
      where.createdAt = {
        gte: startDate ?? undefined,
        lte: endDate ?? undefined,
      };
    }

    const minValue = parseDecimal(minValueParam);
    const maxValue = parseDecimal(maxValueParam);

    const dpsFilters: Prisma.DpsWhereInput = {};
    let hasDpsFilters = false;

    if (minValue || maxValue) {
      dpsFilters.servico = {
        is: {
          valorUnitario: {
            gte: minValue ?? undefined,
            lte: maxValue ?? undefined,
          },
        },
      };
      hasDpsFilters = true;
    }

    if (statuses && statuses.length > 0) {
      dpsFilters.status = {
        in: statuses,
      };
      hasDpsFilters = true;
    }

    if (hasDpsFilters) {
      where.dps = {
        is: dpsFilters,
      };
    }

    if (search && search.length > 2) {
      const normalizedDocument = normalizeDocument(search);
      const searchConditions: Prisma.NotaFiscalWhereInput[] = [
        {
          chaveAcesso: {
            contains: search,
          },
        },
        {
          numero: {
            contains: search,
          },
        },
        {
          tomador: {
            is: {
              nomeRazaoSocial: {
                contains: search,
              },
            },
          },
        },
      ];

      const numericSearch = Number(search);

      if (!Number.isNaN(numericSearch)) {
        searchConditions.push({ dps: { is: { numero: numericSearch } } });
      }

      if (normalizedDocument.length >= 6) {
        searchConditions.push({
          tomador: {
            is: {
              documento: {
                contains: normalizedDocument,
              },
            },
          },
        });
      }

      const existingAnd = Array.isArray(where.AND) ? where.AND : where.AND ? [where.AND] : [];

      where.AND = [...existingAnd, { OR: searchConditions }];
    }

    const [totalItems, notas] = await Promise.all([
      prisma.notaFiscal.count({ where }),
      prisma.notaFiscal.findMany({
        where,
        include: {
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
              servico: {
                select: {
                  valorUnitario: true,
                  descricao: true,
                },
              },
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
        skip,
        take: perPage,
      }),
    ]);

    // Buscar dados dos prestadores da API
    const prestadorIds = [...new Set(notas.map((n) => n.prestadorId))];
    const prestadoresMap = await getPrestadoresByIds(prestadorIds);

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
      prestador: prestadoresMap.get(nota.prestadorId)
        ? {
            id: prestadoresMap.get(nota.prestadorId)!.id,
            nomeFantasia: prestadoresMap.get(nota.prestadorId)!.nomeFantasia,
            cnpj: prestadoresMap.get(nota.prestadorId)!.cnpj,
          }
        : {
            id: nota.prestadorId,
            nomeFantasia: "Prestador",
            cnpj: "",
          },
      tomador: nota.tomador
        ? {
            id: nota.tomador.id,
            nomeRazaoSocial: nota.tomador.nomeRazaoSocial,
            documento: nota.tomador.documento,
          }
        : null,
      dps: nota.dps
        ? {
            id: nota.dps.id,
            numero: nota.dps.numero,
            serie: nota.dps.serie,
            status: nota.dps.status,
            servico: {
              descricao: nota.dps.servico.descricao,
              valorUnitario: nota.dps.servico.valorUnitario.toNumber(),
            },
          }
        : null,
    }));

    return NextResponse.json({
      data: payload,
      meta: {
        page,
        perPage,
        totalItems,
        totalPages: Math.max(1, Math.ceil(totalItems / perPage)),
      },
    });
  } catch (error) {
    return handleRouteError(error, "Erro ao listar NFSe emitidas");
  }
}
