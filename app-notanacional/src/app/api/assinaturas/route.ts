import { NextResponse } from "next/server";

import { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { handleRouteError } from "@/lib/http";
import { assinaturaCreateSchema } from "@/lib/validators/assinatura";
import { assinaturaSelect, serializeAssinatura } from "./utils";
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
    const clienteId = searchParams.get("clienteId") ?? "";
    const dataInicio = searchParams.get("dataInicio") ?? "";
    const dataFim = searchParams.get("dataFim") ?? "";
    const pageParam = Number(searchParams.get("page") ?? "1");
    const perPageParam = Number(searchParams.get("perPage") ?? String(DEFAULT_PER_PAGE));

    const page = Number.isNaN(pageParam) || pageParam < 1 ? 1 : pageParam;
    const perPage = Number.isNaN(perPageParam)
      ? DEFAULT_PER_PAGE
      : Math.min(Math.max(perPageParam, 1), MAX_PER_PAGE);

    const where: Prisma.AssinaturaWhereInput = {
      prestadorId: currentUser.prestadorId,
    };

    if (search) {
      const normalized = search.trim();
      where.OR = [
        { descricao: { contains: normalized } },
        {
          cliente: {
            OR: [
              { nomeRazaoSocial: { contains: normalized } },
              { documento: { contains: normalized } },
            ],
          },
        },
      ].filter(Boolean) as Prisma.AssinaturaWhereInput["OR"];
    }

    if (clienteId) {
      where.clienteId = clienteId;
    }

    if (dataInicio || dataFim) {
      where.vencimentoInicial = {};
      if (dataInicio) {
        where.vencimentoInicial.gte = new Date(dataInicio);
      }
      if (dataFim) {
        where.vencimentoInicial.lte = new Date(dataFim);
      }
    }

    if (statusParam === "ativos") {
      where.ativo = true;
    } else if (statusParam === "inativos") {
      where.ativo = false;
    }

    const [total, assinaturas] = await Promise.all([
      prisma.assinatura.count({ where }),
      prisma.assinatura.findMany({
        where,
        orderBy: {
          updatedAt: "desc",
        },
        skip: (page - 1) * perPage,
        take: perPage,
        select: assinaturaSelect,
      }),
    ]);

    return NextResponse.json({
      data: assinaturas.map(serializeAssinatura),
      total,
      page,
      perPage,
    });
  } catch (error) {
    return handleRouteError(error, "Erro ao listar assinaturas");
  }
}

export async function POST(request: Request) {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return NextResponse.json({ message: "Não autorizado" }, { status: 401 });
    }

    const payload = await request.json().catch(() => null);
    const result = assinaturaCreateSchema.safeParse(payload);

    if (!result.success) {
      return NextResponse.json({ message: "Dados inválidos", issues: result.error.format() }, { status: 400 });
    }

    const data = result.data;

    // Verificar se o cliente existe e pertence ao prestador
    const cliente = await prisma.tomador.findFirst({
      where: {
        id: data.clienteId,
        prestadorId: currentUser.prestadorId,
        ativo: true,
      },
    });

    if (!cliente) {
      return NextResponse.json({ message: "Cliente não encontrado" }, { status: 400 });
    }

    const createData: Prisma.AssinaturaCreateInput = {
      clienteId: data.clienteId,
      prestadorId: currentUser.prestadorId,
      servicoId: data.servicoId,
      intervalo: data.intervalo,
      descricao: data.descricao,
      valor: new Prisma.Decimal(data.valor),
      vencimentoInicial: data.vencimentoInicial,
      dataFim: data.dataFim,
    };

    const assinatura = await prisma.assinatura.create({
      data: createData,
      select: assinaturaSelect,
    });

    return NextResponse.json(serializeAssinatura(assinatura), { status: 201 });
  } catch (error) {
    return handleRouteError(error, "Erro ao criar assinatura");
  }
}
