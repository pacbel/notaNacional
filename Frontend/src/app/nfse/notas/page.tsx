"use client";

import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuth } from "@/contexts/auth-context";
import { useApiQuery } from "@/hooks/use-api-query";
import { listarPrestadores } from "@/services/prestadores";
import { listarNotasEmitidas } from "@/services/nfse";
import { PrestadorDto } from "@/types/prestadores";
import { NotaEmitidaDto } from "@/types/nfse";
import { Card } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Pagination } from "@/components/ui/pagination";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const filterSchema = z.object({
  prestadorId: z.string().uuid("Selecione um prestador").optional(),
  chaveAcesso: z.string().trim().optional(),
  numero: z.string().trim().optional(),
});

type FilterValues = z.infer<typeof filterSchema>;

export default function NotasEmitidasPage() {
  const { roles, user } = useAuth();
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);

  const form = useForm<FilterValues>({
    resolver: zodResolver(filterSchema),
    defaultValues: {
      prestadorId: user?.prestadorId ?? undefined,
      chaveAcesso: "",
      numero: "",
    },
  });

  const prestadoresQuery = useApiQuery<PrestadorDto[]>({
    queryKey: ["prestadores"],
    queryFn: listarPrestadores,
    enabled: roles.includes("Administrador") || roles.includes("Gestao") || roles.includes("Operacao"),
  });

  const filters = form.watch();

  const notasQuery = useApiQuery({
    queryKey: ["notas-emitidas", filters, page, pageSize],
    queryFn: () =>
      listarNotasEmitidas({
        prestadorId: filters.prestadorId,
        chaveAcesso: filters.chaveAcesso,
        numero: filters.numero,
        page,
        pageSize,
      }),
  });

  const handleSubmit = form.handleSubmit(() => {
    setPage(1);
    notasQuery.refetch();
  });

  const prestadorOptions = useMemo(() => {
    const data = prestadoresQuery.data ?? [];
    return data.map((prestador) => ({
      value: prestador.id,
      label: `${prestador.nomeFantasia} (${prestador.cnpj})`,
    }));
  }, [prestadoresQuery.data]);

  const notas = notasQuery.data?.items ?? [];
  const total = notasQuery.data?.total ?? notas.length;

  return (
    <div className="flex flex-col gap-6">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold text-slate-900">Notas emitidas</h1>
        <p className="text-sm text-slate-500">
          Consulte as NFSe emitidas pelos prestadores autorizados.
        </p>
      </header>

      <Card className="p-6 space-y-4">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-600" htmlFor="prestadorId">
                Prestador
              </label>
              <Select
                id="prestadorId"
                value={filters.prestadorId ?? ""}
                onChange={(event) => form.setValue("prestadorId", event.target.value || undefined)}
                disabled={!roles.includes("Administrador") && !roles.includes("Gestao") && !roles.includes("Operacao")}
              >
                <option value="">Todos</option>
                {prestadorOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </Select>
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-600" htmlFor="chaveAcesso">
                Chave de acesso
              </label>
              <Input id="chaveAcesso" {...form.register("chaveAcesso")} placeholder="Informe a chave completa ou parcial" />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-600" htmlFor="numero">
                Número
              </label>
              <Input id="numero" {...form.register("numero")} placeholder="Número da NFSe" />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => {
              form.reset({
                prestadorId: user?.prestadorId ?? undefined,
                chaveAcesso: "",
                numero: "",
              });
              setPage(1);
              notasQuery.refetch();
            }}>
              Limpar
            </Button>
            <Button type="submit" disabled={notasQuery.isPending}>
              Filtrar
            </Button>
          </div>
        </form>
      </Card>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Prestador</TableHead>
                <TableHead>Chave de acesso</TableHead>
                <TableHead>Número</TableHead>
                <TableHead>Situação</TableHead>
                <TableHead>Emitida em</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {notas.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="py-10 text-center text-sm text-slate-500">
                    Nenhuma nota encontrada com os filtros informados.
                  </TableCell>
                </TableRow>
              ) : (
                notas.map((nota: NotaEmitidaDto) => (
                  <TableRow key={nota.chaveAcesso}>
                    <TableCell className="whitespace-nowrap text-sm text-slate-700">{nota.prestadorNome}</TableCell>
                    <TableCell className="font-mono text-sm text-slate-700">{nota.chaveAcesso}</TableCell>
                    <TableCell className="text-sm text-slate-700">{nota.numero ?? "—"}</TableCell>
                    <TableCell className="text-sm text-slate-700">{nota.situacao}</TableCell>
                    <TableCell className="text-sm text-slate-700">
                      {nota.emitidaEm ? format(new Date(nota.emitidaEm), "Pp", { locale: ptBR }) : "—"}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
        {total > pageSize && (
          <div className="border-t border-slate-100 px-4 py-3">
            <Pagination
              page={page}
              pageSize={pageSize}
              total={total}
              onPageChange={(value) => {
                setPage(value);
                notasQuery.refetch();
              }}
            />
          </div>
        )}
      </Card>
    </div>
  );
}
