import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { prestadorUpdateSchema } from "@/lib/validators/prestador";

export async function GET(_request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const prestador = await prisma.prestador.findUnique({ where: { id } });

  if (!prestador) {
    return NextResponse.json({ message: "Prestador não encontrado" }, { status: 404 });
  }

  return NextResponse.json(prestador);
}

export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const payload = await request.json().catch(() => null);
  const parseResult = prestadorUpdateSchema.safeParse(payload);

  if (!parseResult.success) {
    return NextResponse.json({ message: "Dados inválidos", issues: parseResult.error.format() }, { status: 400 });
  }

  try {
    const prestador = await prisma.prestador.update({
      where: { id },
      data: parseResult.data,
    });

    return NextResponse.json(prestador);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2025") {
        return NextResponse.json({ message: "Prestador não encontrado" }, { status: 404 });
      }

      if (error.code === "P2002") {
        return NextResponse.json({ message: "CNPJ já cadastrado" }, { status: 409 });
      }
    }

    console.error("Erro ao atualizar prestador", error);
    return NextResponse.json({ message: "Erro interno ao atualizar prestador" }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  try {
    const prestador = await prisma.prestador.update({
      where: { id },
      data: {
        ativo: false,
      },
    });

    return NextResponse.json(prestador);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      return NextResponse.json({ message: "Prestador não encontrado" }, { status: 404 });
    }

    console.error("Erro ao inativar prestador", error);
    return NextResponse.json({ message: "Erro interno ao inativar prestador" }, { status: 500 });
  }
}
