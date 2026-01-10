"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface StatisticsSummaryProps {
  totalNotas: number;
  notasMes: number;
  dpsPendentes: number;
  valorTotalMes: number;
  className?: string;
}

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

export default function StatisticsSummary({
  totalNotas,
  notasMes,
  dpsPendentes,
  valorTotalMes,
  className,
}: StatisticsSummaryProps) {
  return (
    <div className={cn("grid gap-4 md:grid-cols-2 xl:grid-cols-4", className)}>
      <Card>
        <CardHeader className="pb-2">
          <CardDescription>NFSe emitidas (total)</CardDescription>
          <CardTitle className="text-2xl">{formatNumber(totalNotas)}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-muted-foreground">{formatNumber(notasMes)} emissões neste mês</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardDescription>DPS aguardando ação</CardDescription>
          <CardTitle className="text-2xl">{formatNumber(dpsPendentes)}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-muted-foreground">Inclui rascunhos e pendentes de envio</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardDescription>Valor emitido no mês</CardDescription>
          <CardTitle className="text-2xl">{formatCurrency(valorTotalMes)}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-muted-foreground">Total consolidado das NFSe do mês</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardDescription>Notas a emitir</CardDescription>
          <CardTitle className="text-2xl">{formatNumber(dpsPendentes)}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-muted-foreground">Reveja as DPS e finalize a emissão</p>
        </CardContent>
      </Card>
    </div>
  );
}
