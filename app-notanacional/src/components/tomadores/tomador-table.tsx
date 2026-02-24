"use client";

import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Building2, Mail, Phone, ShieldCheck, IdCard } from "lucide-react";

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
import type { TomadorDto } from "@/services/tomadores";

interface TomadorTableProps {
  data: TomadorDto[];
  isLoading: boolean;
  isRefreshing: boolean;
  page: number;
  perPage: number;
  total: number;
  onPageChange: (page: number) => void;
  onSelectTomador: (tomador: TomadorDto) => void;
}

export function TomadorTable({
  data,
  isLoading,
  isRefreshing,
  page,
  perPage,
  total,
  onPageChange,
  onSelectTomador,
}: TomadorTableProps) {
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
            Nenhum tomador encontrado.
          </TableCell>
        </TableRow>
      );
    }

    return data.map((tomador) => (
      <TableRow
        key={tomador.id}
        className="cursor-pointer transition hover:bg-muted/50"
        onClick={() => onSelectTomador(tomador)}
      >
        <TableCell>
          <div className="font-medium flex items-center gap-2">
            <Building2 className="h-4 w-4 text-muted-foreground" />
            {tomador.nomeRazaoSocial}
          </div>
          <div className="text-xs text-muted-foreground">{tomador.email}</div>
        </TableCell>
        <TableCell>
          <div className="flex items-center gap-2 text-sm">
            <IdCard className="h-3.5 w-3.5 text-muted-foreground" />
            {formatCpfCnpj(tomador.documento)}
          </div>
          <div className="text-xs text-muted-foreground">{tomador.tipoDocumento}</div>
        </TableCell>
        <TableCell>
          <div className="flex flex-col gap-1 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <Mail className="h-3 w-3" /> {tomador.email}
            </span>
            {tomador.telefone && (
              <span className="inline-flex items-center gap-1">
                <Phone className="h-3 w-3" /> {formatPhone(tomador.telefone)}
              </span>
            )}
          </div>
        </TableCell>
        <TableCell className="text-center">
          <Badge variant={tomador.ativo ? "default" : "outline"} className="gap-1">
            <ShieldCheck className="h-3 w-3" />
            {tomador.ativo ? "Ativo" : "Inativo"}
          </Badge>
        </TableCell>
        <TableCell className="text-right text-xs text-muted-foreground">
          Atualizado em {format(new Date(tomador.updatedAt), "dd/MM/yyyy HH:mm", { locale: ptBR })}
        </TableCell>
      </TableRow>
    ));
  };

  return (
    <div>
      <Table>
        <TableHeader className="bg-[#1351b4] text-white">
          <TableRow>
            <TableHead className="text-white">Tomador</TableHead>
            <TableHead className="text-white">Documento</TableHead>
            <TableHead className="text-white">Contato</TableHead>
            <TableHead className="text-white text-center">Status</TableHead>
            <TableHead className="text-white text-right">Atualização</TableHead>
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
