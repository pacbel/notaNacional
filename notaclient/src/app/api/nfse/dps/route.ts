import { NextResponse } from "next/server";
import { Prisma, DpsStatus, Ambiente as AmbienteEnum } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { handleRouteError } from "@/lib/http";
import { createDps } from "@/lib/nfse/service";
import { dpsCreateSchema } from "@/lib/validators/dps";
import { getCurrentUser } from "@/lib/auth";
import { getPrestadoresByIds } from "@/lib/services/prestador";

const DEFAULT_STATUSES: DpsStatus[] = [DpsStatus.RASCUNHO, DpsStatus.ASSINADO];
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

function normalizeDocument(value: string): string {
  return value.replace(/\D/g, "");
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

export async function POST(request: Request) {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return NextResponse.json({ message: "Não autorizado" }, { status: 401 });
    }

    const payload = await request.json().catch(() => null);
    const parseResult = dpsCreateSchema.safeParse(payload);

    if (!parseResult.success) {
      return NextResponse.json({ message: "Dados inválidos", issues: parseResult.error.format() }, { status: 400 });
    }

    // Validar que o prestadorId do payload é o mesmo do usuário logado
    if (parseResult.data.prestadorId !== currentUser.prestadorId) {
      return NextResponse.json({ message: "Acesso negado" }, { status: 403 });
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
        prestadorId: dps.prestadorId,
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
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return NextResponse.json({ message: "Não autorizado" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const statusParam = searchParams.get("status");
    const search = searchParams.get("search")?.trim();
    const ambienteParam = searchParams.get("ambiente")?.trim().toUpperCase() as AmbienteEnum | undefined;
    const startDate = resolveDateParam(searchParams.get("startDate"));
    const endDate = resolveDateParam(searchParams.get("endDate"));
    const minValueParam = searchParams.get("minValue");
    const maxValueParam = searchParams.get("maxValue");
    const tomadorIds = searchParams.getAll("tomadorId").filter(Boolean);
    const servicoIds = searchParams.getAll("servicoId").filter(Boolean);
    const page = Math.max(1, resolveNumberParam(searchParams.get("page"), DEFAULT_PAGE));
    const perPage = Math.min(MAX_PER_PAGE, resolveNumberParam(searchParams.get("perPage"), DEFAULT_PER_PAGE));
    const skip = (page - 1) * perPage;

    const statuses = resolveStatuses(statusParam);

    const where: Prisma.DpsWhereInput = {
      ativo: true,
      prestadorId: currentUser.prestadorId, // Forçar filtro por prestador
      status: {
        in: statuses,
      },
    };

    if (ambienteParam === AmbienteEnum.PRODUCAO || ambienteParam === AmbienteEnum.HOMOLOGACAO) {
      where.ambiente = ambienteParam;
    }

    if (tomadorIds.length > 0) {
      where.tomadorId = {
        in: tomadorIds,
      };
    }

    if (servicoIds.length > 0) {
      where.servicoId = {
        in: servicoIds,
      };
    }

    if (startDate || endDate) {
      where.dataEmissao = {
        gte: startDate ?? undefined,
        lte: endDate ?? undefined,
      };
    }

    const minValue = parseDecimal(minValueParam);
    const maxValue = parseDecimal(maxValueParam);

    if (minValue || maxValue) {
      where.servico = {
        is: {
          valorUnitario: {
            gte: minValue ?? undefined,
            lte: maxValue ?? undefined,
          },
        },
      };
    }

    if (search && search.length > 2) {
      const normalizedDocument = normalizeDocument(search);
      const searchConditions: Prisma.DpsWhereInput[] = [
        {
          identificador: {
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
        {
          servico: {
            is: {
              descricao: {
                contains: search,
              },
            },
          },
        },
      ];

      const numericSearch = Number(search);

      if (!Number.isNaN(numericSearch)) {
        searchConditions.push({ numero: numericSearch });
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

    const [totalItems, dpsList] = await Promise.all([
      prisma.dps.count({ where }),
      prisma.dps.findMany({
        where,
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
          prestadorId: true,
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
          protocolo: true,
          dataEnvio: true,
          dataRetorno: true,
          updatedAt: true,
        },
        orderBy: {
          updatedAt: "desc",
        },
        skip,
        take: perPage,
      }),
    ]);

    // Buscar dados dos prestadores da API
    const prestadorIds = [...new Set(dpsList.map((d) => d.prestadorId))];
    const prestadoresMap = await getPrestadoresByIds(prestadorIds);

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
      prestador: prestadoresMap.get(dps.prestadorId)
        ? {
            id: prestadoresMap.get(dps.prestadorId)!.id,
            nomeFantasia: prestadoresMap.get(dps.prestadorId)!.nomeFantasia,
            cnpj: prestadoresMap.get(dps.prestadorId)!.cnpj,
          }
        : {
            id: dps.prestadorId,
            nomeFantasia: "Prestador",
            cnpj: "",
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
      protocolo: dps.protocolo,
      dataEnvio: dps.dataEnvio ? dps.dataEnvio.toISOString() : null,
      dataRetorno: dps.dataRetorno ? dps.dataRetorno.toISOString() : null,
      updatedAt: dps.updatedAt.toISOString(),
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
    return handleRouteError(error, "Erro ao listar DPS");
  }
}
