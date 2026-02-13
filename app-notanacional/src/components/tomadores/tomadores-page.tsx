"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Search, Filter, RefreshCw } from "lucide-react";
import { toast } from "sonner";

import {
  listTomadores,
  createTomador,
  updateTomador,
  inactivateTomador,
  reactivateTomador,
  type TomadorDto,
  type TomadoresListResponse,
  type TomadorStatusFilter,
} from "@/services/tomadores";
import {
  tomadorCreateSchema,
  tomadorUpdateSchema,
  type TomadorCreateInput,
  type TomadorUpdateInput,
} from "@/lib/validators/tomador";
import { TomadorFormDialog } from "@/components/tomadores/tomador-form-dialog";
import { TomadorDetailsDrawer } from "@/components/tomadores/tomador-details-drawer";
import { TomadorToolbar } from "@/components/tomadores/tomador-toolbar";
import { TomadorTable } from "@/components/tomadores/tomador-table";
import { Button } from "@/components/ui/button";

interface TomadoresFilters {
  search: string;
  status: TomadorStatusFilter;
  page: number;
  perPage: number;
  documento: string;
}

const DEFAULT_FILTERS: TomadoresFilters = {
  search: "",
  status: "ativos",
  page: 1,
  perPage: 10,
  documento: "",
};

function useTomadores(filters: TomadoresFilters) {
  const queryClient = useQueryClient();

  const query = useQuery<TomadoresListResponse>({
    queryKey: ["tomadores", filters],
    queryFn: () => listTomadores(filters),
    placeholderData: (previousData) => previousData,
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["tomadores"] });

  return { ...query, invalidate };
}

export default function TomadoresPage() {
  const [filters, setFilters] = useState<TomadoresFilters>(DEFAULT_FILTERS);
  const [selectedTomador, setSelectedTomador] = useState<TomadorDto | null>(null);
  const [showForm, setShowForm] = useState(false);

  const { data, isLoading, invalidate, isFetching } = useTomadores(filters);

  const createMutation = useMutation({
    mutationFn: (payload: TomadorCreateInput) => createTomador(payload),
    onSuccess: () => {
      toast.success("Tomador cadastrado!");
      setShowForm(false);
      invalidate();
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, input }: { id: string; input: TomadorUpdateInput }) => updateTomador(id, input),
    onSuccess: (tomador) => {
      toast.success("Tomador atualizado!");
      setSelectedTomador(tomador);
      invalidate();
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const inactivateMutation = useMutation({
    mutationFn: inactivateTomador,
    onSuccess: () => {
      toast.success("Tomador inativado");
      setSelectedTomador(null);
      invalidate();
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const reactivateMutation = useMutation({
    mutationFn: reactivateTomador,
    onSuccess: (tomador) => {
      toast.success("Tomador reativado");
      setSelectedTomador(tomador);
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
    const parsed = tomadorCreateSchema.safeParse(values);
    if (!parsed.success) {
      return Promise.reject(new Error("Verifique os dados e tente novamente."));
    }

    await createMutation.mutateAsync(parsed.data);
  };

  const handleUpdate = async (id: string, values: unknown) => {
    const parsed = tomadorUpdateSchema.safeParse(values);
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

  const handleFiltersChange = (values: Partial<TomadoresFilters>) => {
    setFilters((prev) => {
      const next = {
        ...prev,
        ...values,
      };

      const shouldResetPage =
        (values.search !== undefined && values.search !== prev.search) ||
        (values.status !== undefined && values.status !== prev.status) ||
        (values.perPage !== undefined && values.perPage !== prev.perPage) ||
        (values.documento !== undefined && values.documento !== prev.documento);

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
          <h1 className="text-2xl font-bold tracking-tight">Tomadores</h1>
          <p className="text-sm text-muted-foreground">
            Cadastre e mantenha os tomadores de serviços atualizados para emissão das NFSe.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <TomadorToolbar filters={filters} onChangeFilters={handleFiltersChange} disabled={isLoading || isMutating} />
          <Button
            onClick={() => {
              setSelectedTomador(null);
              setShowForm(true);
            }}
          >
            <Plus className="mr-2 h-4 w-4" /> Novo tomador
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
              <span>Todos os tomadores ({filters.status})</span>
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

        <TomadorTable
          data={data?.data ?? []}
          isLoading={isLoading}
          page={filters.page}
          perPage={filters.perPage}
          total={data?.total ?? 0}
          onPageChange={(page: number) => handleFiltersChange({ page })}
          onSelectTomador={setSelectedTomador}
          isRefreshing={isFetching}
        />
      </section>

      <TomadorFormDialog
        open={showForm}
        onOpenChange={setShowForm}
        onSubmit={handleCreate}
        isSubmitting={createMutation.isPending}
      />

      <TomadorDetailsDrawer
        tomador={selectedTomador}
        onClose={() => setSelectedTomador(null)}
        onUpdate={handleUpdate}
        onInactivate={handleInactivate}
        onReactivate={handleReactivate}
        isMutating={isMutating}
      />
    </div>
  );
}
