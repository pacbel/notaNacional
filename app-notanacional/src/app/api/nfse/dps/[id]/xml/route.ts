import { NextResponse } from "next/server";
import { DpsStatus } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { handleRouteError } from "@/lib/http";

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

export async function GET(_request: Request, { params }: RouteParams) {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return NextResponse.json({ message: "Não autorizado" }, { status: 401 });
    }

    const { id } = await params;

    const dps = await prisma.dps.findUnique({
      where: { id },
      select: {
        id: true,
        prestadorId: true,
        status: true,
        numero: true,
        xmlAssinado: true,
      },
    });

    if (!dps || dps.prestadorId !== currentUser.prestadorId) {
      return NextResponse.json({ message: "DPS não encontrada" }, { status: 404 });
    }

    if (dps.status !== DpsStatus.ASSINADO || !dps.xmlAssinado) {
      return NextResponse.json({ message: "DPS ainda não assinada" }, { status: 409 });
    }

    return new Response(dps.xmlAssinado, {
      headers: {
        "Content-Type": "text/xml; charset=utf-8",
        "Content-Disposition": `inline; filename="dps-assinada-${dps.numero}.xml"`,
      },
    });
  } catch (error) {
    return handleRouteError(error, "Erro ao carregar XML da DPS assinada");
  }
}
