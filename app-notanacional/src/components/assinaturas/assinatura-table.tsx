"use client";

import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { BadgeCheck, BadgeX, Calendar, User } from "lucide-react";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { formatCurrency } from "@/lib/formatters";
import type { AssinaturaDto } from "@/services/assinaturas";

interface AssinaturaTableProps {
  data: AssinaturaDto[];
  isLoading: boolean;
  isRefreshing: boolean;
  page: number;
  perPage: number;
  total: number;
  onPageChange: (page: number) => void;
  onSelectAssinatura: (assinatura: AssinaturaDto) => void;
}

const intervaloLabels = {
  SEMANAL: "Semanal",
  QUINZENAL: "Quinzenal",
  MENSAL: "Mensal",
  BIMESTRAL: "Bimestral",
  TRIMESTRAL: "Trimestral",
  SEMESTRAL: "Semestral",
  ANUAL: "Anual",
};

export function AssinaturaTable({
  data,
  isLoading,
  isRefreshing,
  page,
  perPage,
  total,
  onPageChange,
  onSelectAssinatura,
}: AssinaturaTableProps) {
  const totalPages = Math.max(1, Math.ceil(total / perPage));

  const renderRows = () => {
    if (isLoading) {
      return Array.from({ length: perPage }).map((_, index) => (
        <TableRow key={`skeleton-${index}`}>
          <TableCell colSpan={6}>
            <Skeleton className="h-12 w-full" />
          </TableCell>
        </TableRow>
      ));
    }

    if (data.length === 0) {
      return (
        <TableRow>
          <TableCell colSpan={6} className="h-24 text-center text-sm text-muted-foreground">
            Nenhuma assinatura encontrada.
          </TableCell>
        </TableRow>
      );
    }

    return data.map((assinatura) => (
      <TableRow
        key={assinatura.id}
        className="cursor-pointer transition hover:bg-muted/50"
        onClick={() => onSelectAssinatura(assinatura)}
      >
        <TableCell className="max-w-md">
          <div className="flex flex-col gap-1">
            <span className="font-medium wrap-break-word line-clamp-2">{assinatura.descricao}</span>
            <span className="text-xs text-muted-foreground">
              Atualizado em {format(new Date(assinatura.updatedAt), "dd/MM/yyyy HH:mm", { locale: ptBR })}
            </span>
          </div>
        </TableCell>
        <TableCell>
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-1 text-sm">
              <User className="h-3 w-3" />
              {assinatura.cliente.nomeRazaoSocial}
            </div>
            {assinatura.cliente.documento && (
              <span className="text-xs text-muted-foreground">{assinatura.cliente.documento}</span>
            )}
          </div>
        </TableCell>
        <TableCell>
          <Badge variant="secondary" className="gap-1">
            <Calendar className="h-3 w-3" />
            {intervaloLabels[assinatura.intervalo]}
          </Badge>
        </TableCell>
        <TableCell>
          <div className="flex flex-col gap-1 text-xs">
            <span>
              <strong>Início:</strong> {format(new Date(assinatura.vencimentoInicial), "dd/MM/yyyy", { locale: ptBR })}
            </span>
            {assinatura.dataFim && (
              <span>
                <strong>Fim:</strong> {format(new Date(assinatura.dataFim), "dd/MM/yyyy", { locale: ptBR })}
              </span>
            )}
          </div>
        </TableCell>
        <TableCell className="text-right">
          <span className="font-semibold text-sm">{formatCurrency(assinatura.valor)}</span>
        </TableCell>
        <TableCell className="text-right">
          <Badge variant={assinatura.ativo ? "default" : "outline"} className="gap-1">
            {assinatura.ativo ? <BadgeCheck className="h-3 w-3" /> : <BadgeX className="h-3 w-3" />}
            {assinatura.ativo ? "Ativa" : "Inativa"}
          </Badge>
        </TableCell>
      </TableRow>
    ));
  };

  return (
    <div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Serviço</TableHead>
            <TableHead>Cliente</TableHead>
            <TableHead>Intervalo</TableHead>
            <TableHead>Vencimento</TableHead>
            <TableHead className="text-right">Valor</TableHead>
            <TableHead className="text-right">Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>{renderRows()}</TableBody>
      </Table>

      <div className="flex items-center justify-between border-t px-4 py-3 text-xs text-muted-foreground">
        <div>
          Página {page} de {totalPages} · {total} registro{total === 1 ? "" : "s"}
          {isRefreshing && " (atualizando...)"}
        </div>
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                aria-disabled={page === 1}
                className={page === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                onClick={() => page > 1 && onPageChange(page - 1)}
              />
            </PaginationItem>
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter((pageNumber) => {
                const start = Math.max(1, page - 2);
                const end = Math.min(totalPages, page + 2);
                return pageNumber >= start && pageNumber <= end;
              })
              .map((pageNumber) => (
                <PaginationItem key={pageNumber}>
                  <PaginationLink
                    isActive={page === pageNumber}
                    onClick={() => onPageChange(pageNumber)}
                    className="cursor-pointer"
                  >
                    {pageNumber}
                  </PaginationLink>
                </PaginationItem>
              ))}
            <PaginationItem>
              <PaginationNext
                aria-disabled={page === totalPages}
                className={page === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                onClick={() => page < totalPages && onPageChange(page + 1)}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      </div>
    </div>
  );
}
