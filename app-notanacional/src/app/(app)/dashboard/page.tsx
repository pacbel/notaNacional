import { Metadata } from "next";
import { redirect } from "next/navigation";

import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { startOfMonth, subMonths } from "date-fns";

import { DpsStatus } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { getPrestadorById } from "@/lib/services/prestador";
import { RobotCredentialsMissingError } from "@/lib/errors";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import { ChartNotasMes } from "@/components/dashboard/chart-notas-mes";

export const metadata: Metadata = {
  title: "Dashboard | NotaClient",
};

function formatNumber(value: number) {
  return new Intl.NumberFormat("pt-BR").format(value);
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 2,
  }).format(value);
}

function getStatusClasses(status: string | null) {
  switch (status) {
    case DpsStatus.RASCUNHO:
      return "bg-gray-500 text-white";
    case DpsStatus.ASSINADO:
      return "bg-blue-500 text-white";
    case DpsStatus.ENVIADO:
      return "bg-green-500 text-white"; // Verde WhatsApp
    case "AUTORIZADO":
      return "bg-green-600 text-white"; // Verde para autorizado
    case DpsStatus.CANCELADO:
      return "bg-red-600 text-white"; // Vermelho mais escuro
    default:
      return "border border-gray-300 text-gray-700";
  }
}

async function getDashboardData() {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    throw new Error("Usuário não autenticado");
  }

  const prestadorId = currentUser.prestadorId;
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const configuracao = await prisma.configuracaoDps.findUnique({
    where: { prestadorId },
    select: {
      robotClientId: true,
      robotClientSecret: true,
    },
  });

  if (!configuracao?.robotClientId || !configuracao.robotClientSecret) {
    redirect("/configuracoes?missingRobotCredentials=1");
  }

  // Calcular últimos 6 meses para o gráfico
  const last6Months = Array.from({ length: 6 }, (_, i) => {
    const date = subMonths(now, 5 - i);
    return {
      month: format(date, "MMM/yy", { locale: ptBR }),
      year: date.getFullYear(),
      monthNumber: date.getMonth() + 1,
      startDate: new Date(date.getFullYear(), date.getMonth(), 1),
      endDate: new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59),
    };
  });

  const [
    totalNotas,
    notasMes,
    notasHoje,
    dpsPendentes,
    prestadoresAtivos,
    tomadoresAtivos,
    servicosAtivos,
    notasComValor,
    recentNotas,
    notasPorMes,
    prestadorData,
  ] = await Promise.all([
    prisma.notaFiscal.count({ where: { ativo: true, prestadorId } }),
    prisma.notaFiscal.count({
      where: {
        ativo: true,
        prestadorId,
        createdAt: {
          gte: startOfMonth,
        },
      },
    }),
    prisma.notaFiscal.count({
      where: {
        ativo: true,
        prestadorId,
        createdAt: {
          gte: startOfToday,
        },
      },
    }),
    prisma.dps.count({
      where: {
        ativo: true,
        prestadorId,
        status: {
          in: [DpsStatus.RASCUNHO, DpsStatus.ASSINADO],
        },
      },
    }),
    // Prestador: sempre 1 (o próprio)
    Promise.resolve(1),
    prisma.tomador.count({ where: { ativo: true, prestadorId } }),
    prisma.servico.count({ where: { ativo: true, prestadorId } }),
    prisma.notaFiscal.findMany({
      where: {
        ativo: true,
        prestadorId,
        createdAt: {
          gte: startOfMonth,
        },
      },
      select: {
        id: true,
        createdAt: true,
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
    prisma.notaFiscal.findMany({
      where: {
        ativo: true,
        prestadorId,
      },
      take: 6,
      orderBy: { createdAt: "desc" },
      include: {
        tomador: {
          select: {
            nomeRazaoSocial: true,
          },
        },
        dps: {
          select: {
            numero: true,
            status: true,
          },
        },
      },
    }),
    // Buscar contagem de notas por mês
    Promise.all(
      last6Months.map(async (monthData) => {
        const count = await prisma.notaFiscal.count({
          where: {
            ativo: true,
            prestadorId,
            createdAt: {
              gte: monthData.startDate,
              lte: monthData.endDate,
            },
          },
        });
        return {
          mes: monthData.month,
          total: count,
        };
      })
    ),
    getPrestadorById(prestadorId),
  ]);

  const valorTotalMes = notasComValor.reduce((acc, nota) => {
    const valorServico = nota.dps?.servico?.valorUnitario ?? 0;
    return acc + Number(valorServico);
  }, 0);

  const recentNotasWithPrestador = recentNotas.map((nota) => ({
    ...nota,
    prestador: prestadorData
      ? {
          id: prestadorData.id,
          nomeFantasia: prestadorData.nomeFantasia,
          cnpj: prestadorData.cnpj,
        }
      : null,
  }));

  return {
    totalNotas,
    notasMes,
    notasHoje,
    dpsPendentes,
    prestadoresAtivos,
    tomadoresAtivos,
    servicosAtivos,
    valorTotalMes,
    recentNotas: recentNotasWithPrestador,
    notasPorMes,
  };
}

export default async function DashboardPage() {
  try {
    const data = await getDashboardData();

    return (
      <div className="space-y-6">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            Acompanhe as emissões de NFSe e o status operacional da plataforma.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>NFSe emitidas (total)</CardDescription>
              <CardTitle className="text-2xl">{formatNumber(data.totalNotas)}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">
                {formatNumber(data.notasMes)} emissões neste mês
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Emissões de hoje</CardDescription>
              <CardTitle className="text-2xl">{formatNumber(data.notasHoje)}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">Dados atualizados diariamente</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription>DPS aguardando ação</CardDescription>
              <CardTitle className="text-2xl">{formatNumber(data.dpsPendentes)}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">Inclui rascunhos e pendentes de envio</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Valor emitido no mês</CardDescription>
              <CardTitle className="text-2xl">{formatCurrency(data.valorTotalMes)}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">Total consolidado das NFSe do mês</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Pessoas ativas</CardDescription>
              <CardTitle className="text-2xl">
                {formatNumber(data.prestadoresAtivos + data.tomadoresAtivos)}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">
                {formatNumber(data.prestadoresAtivos)} prestadores · {formatNumber(data.tomadoresAtivos)} tomadores
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>NFSe recentes</CardTitle>
              <CardDescription>Últimas emissões registradas na plataforma</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>NFSe</TableHead>
                    <TableHead>Tomador</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Emissão</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.recentNotas.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="h-24 text-center text-sm text-muted-foreground">
                        Nenhuma NFSe emitida ainda.
                      </TableCell>
                    </TableRow>
                  ) : (
                    data.recentNotas.map((nota) => (
                      <TableRow key={nota.id}>
                        <TableCell>
                          <div className="font-medium">{nota.numero}</div>
                          <div className="text-xs text-muted-foreground">
                            {nota.prestador?.nomeFantasia || "Prestador"}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {nota.tomador ? nota.tomador.nomeRazaoSocial : "Tomador não identificado"}
                          </div>
                          <div className="text-xs text-muted-foreground">{nota.chaveAcesso}</div>
                        </TableCell>
                        <TableCell>
                          <Badge className={getStatusClasses(nota.dps?.status)}>{nota.dps?.status ?? "-"}</Badge>
                        </TableCell>
                        <TableCell className="text-right text-sm">
                          {format(nota.createdAt, "dd/MM/yyyy HH:mm", { locale: ptBR })}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Notas Emitidas por Mês</CardTitle>
              <CardDescription>Evolução das emissões nos últimos 6 meses</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartNotasMes data={data.notasPorMes} />
            </CardContent>
          </Card>
        </div>
      </div>
    );
  } catch (error) {
    if (error instanceof RobotCredentialsMissingError) {
      redirect("/configuracoes?missingRobotCredentials=1");
    }

    throw error;
  }
}
