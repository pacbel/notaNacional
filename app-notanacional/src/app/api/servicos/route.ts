import { NextResponse } from "next/server";

import { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { handleRouteError } from "@/lib/http";
import { servicoCreateSchema } from "@/lib/validators/servico";
import { servicoSelect, serializeServico } from "./utils";
import { getCurrentUser } from "@/lib/auth";

const DEFAULT_PER_PAGE = 10;
const MAX_PER_PAGE = 50;

export async function GET(request: Request) {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return NextResponse.json({ message: "Não autorizado" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const search = (searchParams.get("search") ?? "").trim();
    const statusParam = searchParams.get("status") ?? "ativos";
    const pageParam = Number(searchParams.get("page") ?? "1");
    const perPageParam = Number(searchParams.get("perPage") ?? String(DEFAULT_PER_PAGE));
    const isAutocomplete = searchParams.get("autocomplete") === "true";

    const page = Number.isNaN(pageParam) || pageParam < 1 ? 1 : pageParam;
    const perPage = Number.isNaN(perPageParam)
      ? DEFAULT_PER_PAGE
      : Math.min(Math.max(perPageParam, 1), MAX_PER_PAGE);

    const where: Prisma.ServicoWhereInput = {
      prestadorId: currentUser.prestadorId,
      ativo: true, // autocomplete sempre retorna apenas ativos
    };

    if (search) {
      const normalized = search.trim();
      const normalizedDigits = normalized.replace(/\D/g, "");
      where.OR = [
        { descricao: { contains: normalized } },
        { codigo: { contains: normalized.toUpperCase() } },
        { codigoTributacaoMunicipal: { contains: normalized.toUpperCase() } },
        { codigoTributacaoNacional: { contains: normalized.toUpperCase() } },
        { codigoNbs: { contains: normalized.toUpperCase() } },
      ].filter(Boolean) as Prisma.ServicoWhereInput["OR"];
    }

    if (!isAutocomplete) {
      // Para autocomplete, sempre retorna ativos
      if (statusParam === "ativos") {
        where.ativo = true;
      } else if (statusParam === "inativos") {
        where.ativo = false;
      }
    }

    if (isAutocomplete) {
      // Autocomplete retorna apenas campos essenciais e até 20 resultados
      const servicos = await prisma.servico.findMany({
        where,
        orderBy: {
          updatedAt: "desc",
        },
        take: 20,
        select: {
          id: true,
          descricao: true,
          valorUnitario: true,
          pTotTribFed: true,
          pTotTribEst: true,
          pTotTribMun: true,
        },
      });

      return NextResponse.json(
        servicos.map((servico) => ({
          ...servico,
          valorUnitario: servico.valorUnitario.toNumber(),
          pTotTribFed: servico.pTotTribFed?.toNumber() ?? null,
          pTotTribEst: servico.pTotTribEst?.toNumber() ?? null,
          pTotTribMun: servico.pTotTribMun?.toNumber() ?? null,
        }))
      );
    }

    const [total, servicos] = await Promise.all([
      prisma.servico.count({ where }),
      prisma.servico.findMany({
        where,
        orderBy: {
          updatedAt: "desc",
        },
        skip: (page - 1) * perPage,
        take: perPage,
        select: servicoSelect,
      }),
    ]);

    return NextResponse.json({
      data: servicos.map(serializeServico),
      total,
      page,
      perPage,
    });
  } catch (error) {
    return handleRouteError(error, "Erro ao listar serviços");
  }
}

export async function POST(request: Request) {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return NextResponse.json({ message: "Não autorizado" }, { status: 401 });
    }

    const payload = await request.json().catch(() => null);
    const result = servicoCreateSchema.safeParse(payload);

    if (!result.success) {
      return NextResponse.json({ message: "Dados inválidos", issues: result.error.format() }, { status: 400 });
    }

    const data = result.data;

    const servico = await prisma.servico.create({
      data: {
        prestadorId: currentUser.prestadorId,
        codigo: data.codigo,
        descricao: data.descricao,
        codigoTributacaoMunicipal: data.codigoTributacaoMunicipal,
        codigoTributacaoNacional: data.codigoTributacaoNacional,
        codigoNbs: data.codigoNbs,
        valorUnitario: new Prisma.Decimal(data.valorUnitario),
        aliquotaIss: data.aliquotaIss !== null ? new Prisma.Decimal(data.aliquotaIss) : null,
        issRetido: data.issRetido,
      },
      select: servicoSelect,
    });

    return NextResponse.json(serializeServico(servico), { status: 201 });
  } catch (error) {
    return handleRouteError(error, "Erro ao criar serviço");
  }
}
