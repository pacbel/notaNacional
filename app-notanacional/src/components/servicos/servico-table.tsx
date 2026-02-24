"use client";

import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { BadgeCheck, BadgeX, ClipboardList, RefreshCw } from "lucide-react";

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
import type { ServicoDto } from "@/services/servicos";

interface ServicoTableProps {
  data: ServicoDto[];
  isLoading: boolean;
  isRefreshing: boolean;
  page: number;
  perPage: number;
  total: number;
  onPageChange: (page: number) => void;
  onSelectServico: (servico: ServicoDto) => void;
}

export function ServicoTable({
  data,
  isLoading,
  isRefreshing,
  page,
  perPage,
  total,
  onPageChange,
  onSelectServico,
}: ServicoTableProps) {
  const totalPages = Math.max(1, Math.ceil(total / perPage));

  const renderRows = () => {
    if (isLoading) {
      return Array.from({ length: perPage }).map((_, index) => (
        <TableRow key={`skeleton-${index}`}>
          <TableCell colSpan={5}>
            <Skeleton className="h-12 w-full" />
          </TableCell>
        </TableRow>
      ));
    }

    if (data.length === 0) {
      return (
        <TableRow>
          <TableCell colSpan={5} className="h-24 text-center text-sm text-muted-foreground">
            Nenhum serviço encontrado.
          </TableCell>
        </TableRow>
      );
    }

    return data.map((servico) => (
      <TableRow
        key={servico.id}
        className="cursor-pointer transition hover:bg-muted/50"
        onClick={() => onSelectServico(servico)}
      >
        <TableCell className="max-w-md">
          <div className="flex flex-col gap-1">
            <span className="font-medium wrap-break-word line-clamp-2">{servico.descricao}</span>
            <span className="text-xs text-muted-foreground">
              Atualizado em {format(new Date(servico.updatedAt), "dd/MM/yyyy HH:mm", { locale: ptBR })}
            </span>
          </div>
        </TableCell>
        <TableCell className="text-center">
          <div className="flex flex-col gap-1 text-xs text-muted-foreground">
            <span>
              <strong>Trib. Municipal:</strong> {servico.codigoTributacaoMunicipal}
            </span>
            <span>
              <strong>Trib. Nacional:</strong> {servico.codigoTributacaoNacional}
            </span>
            {servico.codigoNbs && (
              <span>
                <strong>NBS:</strong> {servico.codigoNbs}
              </span>
            )}
          </div>
        </TableCell>
        <TableCell>
          <div className="flex flex-col gap-1 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <RefreshCw className="h-3 w-3" /> ISS Retido: {servico.issRetido ? "Sim" : "Não"}
            </span>
            {servico.aliquotaIss !== null && (
              <span>
                <strong>Alíquota:</strong> {servico.aliquotaIss.toFixed(2)}%
              </span>
            )}
          </div>
        </TableCell>
        <TableCell className="text-center">
          <div className="flex flex-col items-center gap-1">
            <span className="font-semibold text-sm">{formatCurrency(servico.valorUnitario)}</span>
            <Badge variant={servico.ativo ? "default" : "outline"} className="gap-1">
              {servico.ativo ? <BadgeCheck className="h-3 w-3" /> : <BadgeX className="h-3 w-3" />}
              {servico.ativo ? "Ativo" : "Inativo"}
            </Badge>
          </div>
        </TableCell>
      </TableRow>
    ));
  };

  return (
    <div>
      <Table>
        <TableHeader className="bg-[#1351b4] text-white">
          <TableRow>
            <TableHead className="text-white">Serviço</TableHead>
            <TableHead className="text-white">Códigos</TableHead>
            <TableHead className="text-white">Município</TableHead>
            <TableHead className="text-white text-center">Informações</TableHead>
            <TableHead className="text-white text-center">Valor</TableHead>
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
                tabIndex={page === 1 ? -1 : 0}
                className={page === 1 ? "pointer-events-none opacity-50" : ""}
                onClick={() => page > 1 && onPageChange(page - 1)}
              />
            </PaginationItem>

            {Array.from({ length: totalPages }).slice(0, 5).map((_, index) => {
              const targetPage = index + 1;
              return (
                <PaginationItem key={targetPage}>
                  <PaginationLink isActive={page === targetPage} onClick={() => onPageChange(targetPage)}>
                    {targetPage}
                  </PaginationLink>
                </PaginationItem>
              );
            })}

            <PaginationItem>
              <PaginationNext
                aria-disabled={page === totalPages}
                tabIndex={page === totalPages ? -1 : 0}
                className={page === totalPages ? "pointer-events-none opacity-50" : ""}
                onClick={() => page < totalPages && onPageChange(page + 1)}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      </div>
    </div>
  );
}
