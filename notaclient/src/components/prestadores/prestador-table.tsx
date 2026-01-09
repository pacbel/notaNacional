"use client";

import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Building2, Mail, Phone, ShieldCheck } from "lucide-react";

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
import { formatCpfCnpj, formatPhone } from "@/lib/formatters";
import type { PrestadorDto } from "@/services/prestadores";

interface PrestadorTableProps {
  data: PrestadorDto[];
  isLoading: boolean;
  isRefreshing: boolean;
  page: number;
  perPage: number;
  total: number;
  onPageChange: (page: number) => void;
  onSelectPrestador: (prestador: PrestadorDto) => void;
}

export function PrestadorTable({
  data,
  isLoading,
  isRefreshing,
  page,
  perPage,
  total,
  onPageChange,
  onSelectPrestador,
}: PrestadorTableProps) {
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
            Nenhum prestador encontrado.
          </TableCell>
        </TableRow>
      );
    }

    return data.map((prestador) => (
      <TableRow
        key={prestador.id}
        className="cursor-pointer transition hover:bg-muted/50"
        onClick={() => onSelectPrestador(prestador)}
      >
        <TableCell>
          <div className="font-medium flex items-center gap-2">
            <Building2 className="h-4 w-4 text-muted-foreground" />
            {prestador.nomeFantasia}
          </div>
          <div className="text-xs text-muted-foreground">{prestador.razaoSocial}</div>
        </TableCell>
        <TableCell>
          <div className="text-sm">{formatCpfCnpj(prestador.cnpj)}</div>
          <div className="text-xs text-muted-foreground">CNPJ</div>
        </TableCell>
        <TableCell>
          <div className="flex flex-col gap-1 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <Mail className="h-3 w-3" /> {prestador.email}
            </span>
            {prestador.telefone && (
              <span className="inline-flex items-center gap-1">
                <Phone className="h-3 w-3" /> {formatPhone(prestador.telefone)}
              </span>
            )}
          </div>
        </TableCell>
        <TableCell>
          <Badge variant={prestador.ativo ? "default" : "outline"} className="gap-1">
            <ShieldCheck className="h-3 w-3" />
            {prestador.ativo ? "Ativo" : "Inativo"}
          </Badge>
        </TableCell>
        <TableCell className="text-right text-xs text-muted-foreground">
          Atualizado em {format(new Date(prestador.updatedAt), "dd/MM/yyyy HH:mm", { locale: ptBR })}
        </TableCell>
      </TableRow>
    ));
  };

  return (
    <div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Prestador</TableHead>
            <TableHead>Documento</TableHead>
            <TableHead>Contato</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Atualização</TableHead>
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
                  <PaginationLink
                    isActive={page === targetPage}
                    onClick={() => onPageChange(targetPage)}
                  >
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
