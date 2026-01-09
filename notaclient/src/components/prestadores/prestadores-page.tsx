"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Search, Filter, RefreshCw } from "lucide-react";
import { toast } from "sonner";

import {
  listPrestadores,
  createPrestador,
  updatePrestador,
  inactivatePrestador,
  reactivatePrestador,
  type PrestadorDto,
  type PrestadorStatusFilter,
  type PrestadoresListResponse,
} from "@/services/prestadores";
import { prestadorCreateSchema, prestadorUpdateSchema, type PrestadorUpdateInput } from "@/lib/validators/prestador";
import { PrestadorFormDialog } from "@/components/prestadores/prestador-form-dialog";
import { PrestadorDetailsDrawer } from "@/components/prestadores/prestador-details-drawer";
import { PrestadorToolbar } from "@/components/prestadores/prestador-toolbar";
import { PrestadorTable } from "@/components/prestadores/prestador-table";
import { Button } from "@/components/ui/button";

interface PrestadoresFilters {
  search: string;
  status: PrestadorStatusFilter;
  page: number;
  perPage: number;
}

const DEFAULT_FILTERS: PrestadoresFilters = {
  search: "",
  status: "ativos",
  page: 1,
  perPage: 10,
};

function usePrestadores(filters: PrestadoresFilters) {
  const queryClient = useQueryClient();

  const query = useQuery<PrestadoresListResponse>({
    queryKey: ["prestadores", filters],
    queryFn: () => listPrestadores(filters),
    placeholderData: (previousData) => previousData,
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["prestadores"] });

  return { ...query, invalidate };
}

export default function PrestadoresPage() {
  const [filters, setFilters] = useState<PrestadoresFilters>(DEFAULT_FILTERS);
  const [selectedPrestador, setSelectedPrestador] = useState<PrestadorDto | null>(null);
  const [showForm, setShowForm] = useState(false);

  const { data, isLoading, invalidate, isFetching } = usePrestadores(filters);

  const createMutation = useMutation({
    mutationFn: createPrestador,
    onSuccess: () => {
      toast.success("Prestador cadastrado!");
      setShowForm(false);
      invalidate();
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, input }: { id: string; input: PrestadorUpdateInput }) => updatePrestador(id, input),
    onSuccess: (prestador) => {
      toast.success("Prestador atualizado!");
      setSelectedPrestador(prestador);
      invalidate();
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const inactivateMutation = useMutation({
    mutationFn: inactivatePrestador,
    onSuccess: () => {
      toast.success("Prestador inativado");
      setSelectedPrestador(null);
      invalidate();
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const reactivateMutation = useMutation({
    mutationFn: reactivatePrestador,
    onSuccess: (prestador) => {
      toast.success("Prestador reativado");
      setSelectedPrestador(prestador);
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
    const parsed = prestadorCreateSchema.safeParse(values);
    if (!parsed.success) {
      return Promise.reject(new Error("Verifique os dados e tente novamente."));
    }

    await createMutation.mutateAsync(parsed.data);
  };

  const handleUpdate = async (id: string, values: unknown) => {
    const parsed = prestadorUpdateSchema.safeParse(values);
    if (!parsed.success) {
      return Promise.reject(new Error("Verifique os dados e tente novamente."));
    }

    await updateMutation.mutateAsync({ id, input: parsed.data });
  };

  const handleInactivate = async (id: string) => {
    await inactivateMutation.mutateAsync(id);
  };

  const handleReactivate = async (id: string) => {
    await reactivateMutation.mutateAsync(id);
  };

  const handleFiltersChange = (values: Partial<PrestadoresFilters>) => {
    setFilters((prev) => {
      const next = {
        ...prev,
        ...values,
      };

      const shouldResetPage =
        (values.search !== undefined && values.search !== prev.search) ||
        (values.status !== undefined && values.status !== prev.status) ||
        (values.perPage !== undefined && values.perPage !== prev.perPage);

      if (shouldResetPage) {
        next.page = 1;
      } else if (values.page !== undefined) {
        next.page = values.page;
      }

      return next;
    });
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Prestadores</h1>
          <p className="text-sm text-muted-foreground">
            Gerencie prestadores, tokens e configurações de emissão.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <PrestadorToolbar
            filters={filters}
            onChangeFilters={handleFiltersChange}
            disabled={isLoading || isMutating}
          />
          <Button
            onClick={() => {
              setSelectedPrestador(null);
              setShowForm(true);
            }}
          >
            <Plus className="mr-2 h-4 w-4" /> Novo prestador
          </Button>
        </div>
      </header>

      <section className="rounded-lg border bg-card shadow-sm">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Search className="h-4 w-4" />
            {filters.search ? (
              <span>
                Resultados para <strong>"{filters.search}"</strong>
              </span>
            ) : (
              <span>Todos os prestadores ({filters.status})</span>
            )}
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Filter className="h-4 w-4" />
            <span>{data?.total ?? 0} encontrados</span>
            <RefreshCw
              className={`h-4 w-4 ${isFetching ? "animate-spin" : "cursor-pointer"}`}
              onClick={() => invalidate()}
            />
          </div>
        </div>

        <PrestadorTable
          data={data?.data ?? []}
          isLoading={isLoading}
          page={filters.page}
          perPage={filters.perPage}
          total={data?.total ?? 0}
          onPageChange={(page: number) => handleFiltersChange({ page })}
          onSelectPrestador={setSelectedPrestador}
          isRefreshing={isFetching}
        />
      </section>

      <PrestadorFormDialog
        open={showForm}
        onOpenChange={setShowForm}
        onSubmit={handleCreate}
        isSubmitting={createMutation.isPending}
      />

      <PrestadorDetailsDrawer
        prestador={selectedPrestador}
        onClose={() => setSelectedPrestador(null)}
        onUpdate={handleUpdate}
        onInactivate={handleInactivate}
        onReactivate={handleReactivate}
        isMutating={isMutating}
      />
    </div>
  );
}
