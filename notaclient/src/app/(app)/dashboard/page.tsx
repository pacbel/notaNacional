import { Metadata } from "next";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

import { DpsStatus } from "@prisma/client";

import { prisma } from "@/lib/prisma";
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

async function getDashboardData() {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

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
    recentLogs,
  ] = await Promise.all([
    prisma.notaFiscal.count({ where: { ativo: true } }),
    prisma.notaFiscal.count({
      where: {
        ativo: true,
        createdAt: {
          gte: startOfMonth,
        },
      },
    }),
    prisma.notaFiscal.count({
      where: {
        ativo: true,
        createdAt: {
          gte: startOfToday,
        },
      },
    }),
    prisma.dps.count({
      where: {
        ativo: true,
        status: {
          in: [DpsStatus.RASCUNHO, DpsStatus.ASSINADO],
        },
      },
    }),
    prisma.prestador.count({ where: { ativo: true } }),
    prisma.tomador.count({ where: { ativo: true } }),
    prisma.servico.count({ where: { ativo: true } }),
    prisma.notaFiscal.findMany({
      where: {
        ativo: true,
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
      take: 6,
      orderBy: { createdAt: "desc" },
      include: {
        prestador: {
          select: {
            nomeFantasia: true,
          },
        },
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
    prisma.logSistema.findMany({
      take: 6,
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const valorTotalMes = notasComValor.reduce((acc, nota) => {
    const valorServico = nota.dps?.servico?.valorUnitario ?? 0;
    return acc + Number(valorServico);
  }, 0);

  return {
    totalNotas,
    notasMes,
    notasHoje,
    dpsPendentes,
    prestadoresAtivos,
    tomadoresAtivos,
    servicosAtivos,
    valorTotalMes,
    recentNotas,
    recentLogs,
  };
}

export default async function DashboardPage() {
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
            <CardDescription>Parceiros ativos</CardDescription>
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
                        <div className="text-xs text-muted-foreground">{nota.prestador.nomeFantasia}</div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">{nota.tomador.nomeRazaoSocial}</div>
                        <div className="text-xs text-muted-foreground">{nota.chaveAcesso}</div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{nota.dps?.status ?? "-"}</Badge>
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
            <CardTitle>Logs recentes</CardTitle>
            <CardDescription>Monitoramento das últimas ações registradas</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {data.recentLogs.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhum log registrado.</p>
            ) : (
              data.recentLogs.map((log) => (
                <div key={log.id} className="space-y-1 rounded-md border p-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">{log.acao}</span>
                    <Badge variant="secondary">{log.nivel}</Badge>
                  </div>
                  <Separator />
                  <p className="text-sm text-muted-foreground">{log.mensagem}</p>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>Sistema</span>
                    <span>{format(log.createdAt, "dd/MM/yyyy HH:mm", { locale: ptBR })}</span>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
