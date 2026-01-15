import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { handleRouteError } from "@/lib/http";

const paramsSchema = z.object({
  id: z.string().uuid(),
});

export async function DELETE(_request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const params = await context.params;
    const parseResult = paramsSchema.safeParse(params);

    if (!parseResult.success) {
      return NextResponse.json({ message: "Identificador de DPS inválido" }, { status: 400 });
    }

    const { id } = parseResult.data;

    const dps = await prisma.dps.findUnique({
      where: { id },
      select: {
        id: true,
        status: true,
      },
    });

    if (!dps) {
      return NextResponse.json({ message: "DPS não encontrada" }, { status: 404 });
    }

    if (dps.status === "ENVIADO" || dps.status === "CANCELADO") {
      return NextResponse.json({ message: "Não é possível excluir uma DPS já emitida ou cancelada" }, { status: 409 });
    }

    await prisma.dps.delete({ where: { id } });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    return handleRouteError(error, "Erro ao excluir DPS");
  }
}
