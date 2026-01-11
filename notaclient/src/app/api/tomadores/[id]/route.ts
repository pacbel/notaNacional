import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { tomadorUpdateSchema } from "@/lib/validators/tomador";

export async function GET(_request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const tomador = await prisma.tomador.findUnique({ where: { id } });

  if (!tomador) {
    return NextResponse.json({ message: "Tomador não encontrado" }, { status: 404 });
  }

  return NextResponse.json(tomador);
}

export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const payload = await request.json().catch(() => null);
  const parseResult = tomadorUpdateSchema.safeParse(payload);

  if (!parseResult.success) {
    return NextResponse.json({ message: "Dados inválidos", issues: parseResult.error.format() }, { status: 400 });
  }

  try {
    const tomador = await prisma.tomador.update({
      where: { id },
      data: parseResult.data,
    });

    return NextResponse.json(tomador);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2025") {
        return NextResponse.json({ message: "Tomador não encontrado" }, { status: 404 });
      }

      if (error.code === "P2002") {
        return NextResponse.json({ message: "Documento já cadastrado" }, { status: 409 });
      }
    }

    console.error("Erro ao atualizar tomador", error);
    return NextResponse.json({ message: "Erro interno ao atualizar tomador" }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  try {
    const tomador = await prisma.tomador.update({
      where: { id },
      data: {
        ativo: false,
      },
    });

    return NextResponse.json(tomador);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      return NextResponse.json({ message: "Tomador não encontrado" }, { status: 404 });
    }

    console.error("Erro ao inativar tomador", error);
    return NextResponse.json({ message: "Erro interno ao inativar tomador" }, { status: 500 });
  }
}
