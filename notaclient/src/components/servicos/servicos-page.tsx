"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, RefreshCw } from "lucide-react";
import { toast } from "sonner";

import {
  listServicos,
  createServico,
  updateServico,
  inactivateServico,
  reactivateServico,
  type ServicoDto,
  type ServicosListResponse,
  type ServicoStatusFilter,
} from "@/services/servicos";
import {
  servicoCreateSchema,
  servicoUpdateSchema,
  type ServicoCreateInput,
  type ServicoUpdateInput,
} from "@/lib/validators/servico";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ServicoToolbar } from "@/components/servicos/servico-toolbar";
import { ServicoTable } from "@/components/servicos/servico-table";
import { ServicoFormDialog } from "@/components/servicos/servico-form-dialog";
import { ServicoDetailsDrawer } from "./servico-details-drawer";

interface ServicosFilters {
  search: string;
  status: ServicoStatusFilter;
  page: number;
  perPage: number;
}

const DEFAULT_FILTERS: ServicosFilters = {
  search: "",
  status: "ativos",
  page: 1,
  perPage: 10,
};

function useServicos(filters: ServicosFilters) {
  const queryClient = useQueryClient();

  const query = useQuery<ServicosListResponse>({
    queryKey: ["servicos", filters],
    queryFn: () => listServicos(filters),
    placeholderData: (previousData) => previousData,
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["servicos"] });

  return { ...query, invalidate };
}

export default function ServicosPage() {
  const [filters, setFilters] = useState<ServicosFilters>(DEFAULT_FILTERS);
  const [showForm, setShowForm] = useState(false);
  const [selectedServico, setSelectedServico] = useState<ServicoDto | null>(null);

  const { data, isLoading, isFetching, invalidate } = useServicos(filters);

  const createMutation = useMutation({
    mutationFn: (payload: ServicoCreateInput) => createServico(payload),
    onSuccess: () => {
      toast.success("Serviço cadastrado!");
      setShowForm(false);
      invalidate();
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, input }: { id: string; input: ServicoUpdateInput }) => updateServico(id, input),
    onSuccess: (servico) => {
      toast.success("Serviço atualizado!");
      setSelectedServico(servico);
      invalidate();
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const inactivateMutation = useMutation({
    mutationFn: inactivateServico,
    onSuccess: () => {
      toast.success("Serviço inativado");
      setSelectedServico(null);
      invalidate();
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const reactivateMutation = useMutation({
    mutationFn: reactivateServico,
    onSuccess: (servico) => {
      toast.success("Serviço reativado");
      setSelectedServico(servico);
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
    const parsed = servicoCreateSchema.safeParse(values);
    if (!parsed.success) {
      return Promise.reject(new Error("Verifique os dados e tente novamente."));
    }

    await createMutation.mutateAsync(parsed.data);
  };

  const handleUpdate = async (id: string, values: unknown) => {
    const parsed = servicoUpdateSchema.safeParse(values);
    if (!parsed.success) {
      return Promise.reject(new Error("Verifique os dados e tente novamente."));
    }

    await updateMutation.mutateAsync({ id, input: parsed.data });
  };

  const handleFiltersChange = (values: Partial<ServicosFilters>) => {
    setFilters((previous) => {
      const next = {
        ...previous,
        ...values,
      };

      const shouldResetPage =
        (values.search !== undefined && values.search !== previous.search) ||
        (values.status !== undefined && values.status !== previous.status) ||
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
          <h1 className="text-2xl font-bold tracking-tight">Serviços</h1>
          <p className="text-sm text-muted-foreground">
            Cadastre e mantenha os serviços utilizados nas DPS e NFSe.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <ServicoToolbar filters={filters} onChangeFilters={handleFiltersChange} disabled={isLoading || isMutating} />
          <Button
            onClick={() => {
              setSelectedServico(null);
              setShowForm(true);
            }}
            disabled={isMutating}
          >
            <Plus className="mr-2 h-4 w-4" /> Novo serviço
          </Button>
        </div>
      </header>

      <Card>
        <CardHeader className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle>Lista de serviços</CardTitle>
            <CardDescription>
              {total} serviço{total === 1 ? "" : "s"} cadastrados
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
              Página {filters.page} · {currentData.length} exibidos · {total} no total
            </span>
            <Button variant="ghost" size="icon" onClick={() => invalidate()} disabled={isFetching}>
              <RefreshCw className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`} />
            </Button>
          </div>

          <ServicoTable
            data={currentData}
            isLoading={isLoading}
            isRefreshing={isFetching}
            page={filters.page}
            perPage={filters.perPage}
            total={total}
            onPageChange={(page: number) => handleFiltersChange({ page })}
            onSelectServico={setSelectedServico}
          />
        </CardContent>
      </Card>

      <ServicoFormDialog
        open={showForm}
        onOpenChange={setShowForm}
        onSubmit={handleCreate}
        isSubmitting={createMutation.isPending}
      />

      <ServicoDetailsDrawer
        servico={selectedServico}
        onClose={() => setSelectedServico(null)}
        onUpdate={handleUpdate}
        onInactivate={async (id: string) => inactivateMutation.mutateAsync(id)}
        onReactivate={async (id: string) => reactivateMutation.mutateAsync(id)}
        isMutating={isMutating}
      />
    </div>
  );
}
