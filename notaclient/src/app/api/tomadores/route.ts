import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { tomadorCreateSchema } from "@/lib/validators/tomador";

const DEFAULT_PER_PAGE = 10;
const MAX_PER_PAGE = 50;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const pageParam = Number(searchParams.get("page") ?? "1");
  const perPageParam = Number(searchParams.get("perPage") ?? String(DEFAULT_PER_PAGE));
  const query = (searchParams.get("q") ?? "").trim();
  const statusParam = searchParams.get("status") ?? "ativos";
  const documentoParam = (searchParams.get("documento") ?? "").trim();

  const page = Number.isNaN(pageParam) || pageParam < 1 ? 1 : pageParam;
  const perPage = Number.isNaN(perPageParam)
    ? DEFAULT_PER_PAGE
    : Math.min(Math.max(perPageParam, 1), MAX_PER_PAGE);

  const where: Prisma.TomadorWhereInput = {};

  if (query) {
    where.OR = [
      { nomeRazaoSocial: { contains: query } },
      { email: { contains: query } },
    ];
  }

  if (documentoParam) {
    where.documento = documentoParam.replace(/\D/g, "");
  }

  if (statusParam === "ativos") {
    where.ativo = true;
  } else if (statusParam === "inativos") {
    where.ativo = false;
  }

  const [total, data] = await Promise.all([
    prisma.tomador.count({ where }),
    prisma.tomador.findMany({
      where,
      orderBy: { updatedAt: "desc" },
      skip: (page - 1) * perPage,
      take: perPage,
    }),
  ]);

  return NextResponse.json({
    data,
    total,
    page,
    perPage,
  });
}

export async function POST(request: Request) {
  const payload = await request.json().catch(() => null);
  const parseResult = tomadorCreateSchema.safeParse(payload);

  if (!parseResult.success) {
    return NextResponse.json({ message: "Dados inválidos", issues: parseResult.error.format() }, { status: 400 });
  }

  try {
    const tomador = await prisma.tomador.create({
      data: parseResult.data,
    });

    return NextResponse.json(tomador, { status: 201 });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return NextResponse.json({ message: "Documento já cadastrado" }, { status: 409 });
    }

    console.error("Erro ao criar tomador", error);
    return NextResponse.json({ message: "Erro interno ao criar tomador" }, { status: 500 });
  }
}
