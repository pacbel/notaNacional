import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { handleRouteError } from "@/lib/http";

function resolveMonthBoundaries(reference: Date) {
  const start = new Date(reference.getFullYear(), reference.getMonth(), 1, 0, 0, 0, 0);
  const end = new Date(reference.getFullYear(), reference.getMonth() + 1, 1, 0, 0, 0, 0);

  return { start, end };
}

export async function GET() {
  try {
    const now = new Date();
    const { start: monthStart, end: monthEnd } = resolveMonthBoundaries(now);

    const [totalNotas, notasMes, dpsPendentes, notasMesData] = await Promise.all([
      prisma.notaFiscal.count({
        where: {
          ativo: true,
        },
      }),
      prisma.notaFiscal.count({
        where: {
          ativo: true,
          createdAt: {
            gte: monthStart,
            lt: monthEnd,
          },
        },
      }),
      prisma.dps.count({
        where: {
          ativo: true,
          status: {
            in: ["RASCUNHO", "ASSINADO"],
          },
        },
      }),
      prisma.notaFiscal.findMany({
        where: {
          ativo: true,
          createdAt: {
            gte: monthStart,
            lt: monthEnd,
          },
        },
        select: {
          dps: {
            select: {
              servico: {
                select: {
                  valorUnitario: true,
                },
              },
            },
          },
        },
      }),
    ]);

    const valorTotalMes = notasMesData.reduce((accumulator, nota) => {
      const valor = nota.dps?.servico?.valorUnitario?.toNumber() ?? 0;
      return accumulator + valor;
    }, 0);

    return NextResponse.json({
      totalNotas,
      notasMes,
      dpsPendentes,
      valorTotalMes,
    });
  } catch (error) {
    return handleRouteError(error, "Erro ao calcular métricas de NFSe");
  }
}
