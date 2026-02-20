"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, RefreshCw } from "lucide-react";
import { toast } from "sonner";

import {
  listAssinaturas,
  createAssinatura,
  updateAssinatura,
  inactivateAssinatura,
  reactivateAssinatura,
  type AssinaturaDto,
  type AssinaturasListResponse,
  type AssinaturaStatusFilter,
} from "@/services/assinaturas";
import {
  assinaturaCreateSchema,
  assinaturaUpdateSchema,
  type AssinaturaCreateInput,
  type AssinaturaUpdateInput,
} from "@/lib/validators/assinatura";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AssinaturaToolbar } from "@/components/assinaturas/assinatura-toolbar";
import { AssinaturaTable } from "@/components/assinaturas/assinatura-table";
import { AssinaturaFormDialog } from "@/components/assinaturas/assinatura-form-dialog";
import { AssinaturaDetailsDrawer } from "./assinatura-details-drawer";

interface AssinaturasFilters {
  search: string;
  status: AssinaturaStatusFilter;
  clienteId: string;
  dataInicio: string;
  dataFim: string;
  page: number;
  perPage: number;
}

const DEFAULT_FILTERS: AssinaturasFilters = {
  search: "",
  status: "ativos",
  clienteId: "",
  dataInicio: "",
  dataFim: "",
  page: 1,
  perPage: 10,
};

function useAssinaturas(filters: AssinaturasFilters) {
  const queryClient = useQueryClient();

  const query = useQuery<AssinaturasListResponse>({
    queryKey: ["assinaturas", filters],
    queryFn: () => listAssinaturas(filters),
    placeholderData: (previousData) => previousData,
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["assinaturas"] });

  return { ...query, invalidate };
}

export default function AssinaturasPage() {
  const [filters, setFilters] = useState<AssinaturasFilters>(DEFAULT_FILTERS);
  const [showForm, setShowForm] = useState(false);
  const [selectedAssinatura, setSelectedAssinatura] = useState<AssinaturaDto | null>(null);

  const { data, isLoading, isFetching, invalidate } = useAssinaturas(filters);

  const createMutation = useMutation({
    mutationFn: (payload: AssinaturaCreateInput) => createAssinatura(payload),
    onSuccess: () => {
      toast.success("Assinatura cadastrada!");
      setShowForm(false);
      invalidate();
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, input }: { id: string; input: AssinaturaUpdateInput }) => updateAssinatura(id, input),
    onSuccess: (assinatura) => {
      toast.success("Assinatura atualizada!");
      setSelectedAssinatura(assinatura);
      invalidate();
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const inactivateMutation = useMutation({
    mutationFn: inactivateAssinatura,
    onSuccess: () => {
      toast.success("Assinatura inativada");
      setSelectedAssinatura(null);
      invalidate();
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const reactivateMutation = useMutation({
    mutationFn: reactivateAssinatura,
    onSuccess: (assinatura) => {
      toast.success("Assinatura reativada");
      setSelectedAssinatura(assinatura);
      invalidate();
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const isMutating =
    createMutation.isPending ||
    updateMutation.isPending ||
    inactivateMutation.isPending ||
    reactivateMutation.isPending;

  const handleCreate = async (values: unknown) => {
    const parsed = assinaturaCreateSchema.safeParse(values);
    if (!parsed.success) {
      return Promise.reject(new Error("Verifique os dados e tente novamente."));
    }

    await createMutation.mutateAsync(parsed.data);
  };

  const handleUpdate = async (id: string, values: unknown) => {
    const parsed = assinaturaUpdateSchema.safeParse(values);
    if (!parsed.success) {
      return Promise.reject(new Error("Verifique os dados e tente novamente."));
    }

    await updateMutation.mutateAsync({ id, input: parsed.data });
  };

  const handleFiltersChange = (values: Partial<AssinaturasFilters>) => {
    setFilters((previous) => {
      const next = {
        ...previous,
        ...values,
      };

      const shouldResetPage =
        (values.search !== undefined && values.search !== previous.search) ||
        (values.status !== undefined && values.status !== previous.status) ||
        (values.clienteId !== undefined && values.clienteId !== previous.clienteId) ||
        (values.dataInicio !== undefined && values.dataInicio !== previous.dataInicio) ||
        (values.dataFim !== undefined && values.dataFim !== previous.dataFim) ||
        (values.perPage !== undefined && values.perPage !== previous.perPage);

      if (shouldResetPage) {
        next.page = 1;
      } else if (values.page !== undefined) {
        next.page = values.page;
      }

      return next;
    });
  };

  const total = data?.total ?? 0;
  const currentData = data?.data ?? [];

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Assinaturas</h1>
          <p className="text-sm text-muted-foreground">
            Cadastre e mantenha as assinaturas para geração automática de NFSe.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <AssinaturaToolbar filters={filters} onChangeFilters={handleFiltersChange} disabled={isLoading || isMutating} />
          <Button
            onClick={() => {
              setSelectedAssinatura(null);
              setShowForm(true);
            }}
            disabled={isMutating}
          >
            <Plus className="mr-2 h-4 w-4" /> Nova assinatura
          </Button>
        </div>
      </header>

      <Card>
        <CardHeader className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle>Lista de assinaturas</CardTitle>
            <CardDescription>
              {total} assinatura{total === 1 ? "" : "s"} cadastrada{total === 1 ? "" : "s"}
            </CardDescription>
          </div>
          {isLoading && (
            <Badge variant="outline" className="gap-2">
              <RefreshCw className="h-3 w-3 animate-spin" /> Carregando
            </Badge>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between rounded-md border px-4 py-3 text-sm text-muted-foreground">
            <span>
              Página {filters.page} · {currentData.length} exibidas · {total} no total
            </span>
            <Button variant="ghost" size="icon" onClick={() => invalidate()} disabled={isFetching}>
              <RefreshCw className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`} />
            </Button>
          </div>

          <AssinaturaTable
            data={currentData}
            isLoading={isLoading}
            isRefreshing={isFetching}
            page={filters.page}
            perPage={filters.perPage}
            total={total}
            onPageChange={(page: number) => handleFiltersChange({ page })}
            onSelectAssinatura={setSelectedAssinatura}
          />
        </CardContent>
      </Card>

      <AssinaturaFormDialog
        open={showForm}
        onOpenChange={setShowForm}
        onSubmit={handleCreate}
        isSubmitting={createMutation.isPending}
      />

      <AssinaturaDetailsDrawer
        assinatura={selectedAssinatura}
        onClose={() => setSelectedAssinatura(null)}
        onUpdate={handleUpdate}
        onInactivate={async (id: string) => {
          await inactivateMutation.mutateAsync(id);
        }}
        onReactivate={async (id: string) => {
          await reactivateMutation.mutateAsync(id);
        }}
        isMutating={isMutating}
      />
    </div>
  );
}
