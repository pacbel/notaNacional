import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { handleRouteError } from "@/lib/http";
import { assinaturaUpdateSchema } from "@/lib/validators/assinatura";
import { assinaturaSelect, serializeAssinatura } from "../utils";
import { getCurrentUser } from "@/lib/auth";

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

export async function GET(_request: Request, context: RouteParams) {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    return NextResponse.json({ message: "Não autorizado" }, { status: 401 });
  }

  const { id } = await context.params;

  try {
    const assinatura = await prisma.assinatura.findFirst({
      where: {
        id,
        prestadorId: currentUser.prestadorId,
      },
      select: assinaturaSelect,
    });

    if (!assinatura) {
      return NextResponse.json({ message: "Assinatura não encontrada" }, { status: 404 });
    }

    return NextResponse.json(serializeAssinatura(assinatura));
  } catch (error) {
    return handleRouteError(error, "Erro ao buscar assinatura");
  }
}

export async function PATCH(request: Request, context: RouteParams) {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    return NextResponse.json({ message: "Não autorizado" }, { status: 401 });
  }

  const { id } = await context.params;

  // Verificar se a assinatura pertence ao prestador
  const existing = await prisma.assinatura.findFirst({
    where: { id, prestadorId: currentUser.prestadorId },
  });

  if (!existing) {
    return NextResponse.json({ message: "Assinatura não encontrada" }, { status: 404 });
  }

  try {
    const payload = await request.json().catch(() => null);
    const result = assinaturaUpdateSchema.safeParse(payload);

    if (!result.success) {
      return NextResponse.json({ message: "Dados inválidos", issues: result.error.format() }, { status: 400 });
    }

    const data = result.data;

    // Verificar cliente se fornecido
    if (data.clienteId) {
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
    }

    const updateData: Prisma.AssinaturaUpdateInput = {};

    if (data.clienteId !== undefined) {
      updateData.clienteId = data.clienteId;
    }
    if (data.servicoId !== undefined) {
      updateData.servicoId = data.servicoId;
    }
    if (data.intervalo !== undefined) {
      updateData.intervalo = data.intervalo;
    }
    if (data.descricao !== undefined) {
      updateData.descricao = data.descricao;
    }
    if (data.valor !== undefined) {
      updateData.valor = new Prisma.Decimal(data.valor);
    }
    if (data.vencimentoInicial !== undefined) {
      updateData.vencimentoInicial = data.vencimentoInicial;
    }
    if (data.dataFim !== undefined) {
      updateData.dataFim = data.dataFim;
    }
    if (data.ativo !== undefined) {
      updateData.ativo = data.ativo;
    }

    try {
      const assinatura = await prisma.assinatura.update({
        where: { id },
        data: updateData,
        select: assinaturaSelect,
      });

      return NextResponse.json(serializeAssinatura(assinatura));
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
        return NextResponse.json({ message: "Assinatura não encontrada" }, { status: 404 });
      }

      throw error;
    }
  } catch (error) {
    return handleRouteError(error, "Erro ao atualizar assinatura");
  }
}

export async function DELETE(_request: Request, context: RouteParams) {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    return NextResponse.json({ message: "Não autorizado" }, { status: 401 });
  }

  const { id } = await context.params;

  // Verificar se a assinatura pertence ao prestador
  const existing = await prisma.assinatura.findFirst({
    where: { id, prestadorId: currentUser.prestadorId },
  });

  if (!existing) {
    return NextResponse.json({ message: "Assinatura não encontrada" }, { status: 404 });
  }

  try {
    const assinatura = await prisma.assinatura.update({
      where: { id },
      data: {
        ativo: false,
      },
      select: assinaturaSelect,
    });

    return NextResponse.json(serializeAssinatura(assinatura));
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      return NextResponse.json({ message: "Assinatura não encontrada" }, { status: 404 });
    }

    return handleRouteError(error, "Erro ao inativar assinatura");
  }
}
