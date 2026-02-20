"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Search } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { assinaturaCreateSchema, type AssinaturaCreateInput } from "@/lib/validators/assinatura";
import { fetchWithAuth } from "@/lib/fetch-with-auth";

type AssinaturaFormValues = z.input<typeof assinaturaCreateSchema>;

interface ClienteOption {
  id: string;
  nomeRazaoSocial: string;
  documento: string | null;
}

interface AssinaturaFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: AssinaturaCreateInput) => Promise<void>;
  isSubmitting?: boolean;
}

const DEFAULT_VALUES: AssinaturaFormValues = {
  clienteId: "",
  intervalo: "MENSAL",
  descricao: "",
  valor: "",
  vencimentoInicial: "",
  dataFim: "",
};

const BRL_FORMAT = {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
} as const;

const formatCurrencyDisplay = (value: number) =>
  value.toLocaleString("pt-BR", BRL_FORMAT);

const formatFieldValue = (value: number) =>
  value.toFixed(2).replace('.', ',');

const parseCurrencyValue = (value: string | number | null | undefined) => {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  if (typeof value === "number") {
    return value;
  }

  const trimmed = value.trim();

  if (trimmed === "") {
    return null;
  }

  if (trimmed.includes(",")) {
    const normalized = trimmed.replace(/\./g, "").replace(/,/g, ".");
    const numeric = Number(normalized);
    return Number.isNaN(numeric) ? null : numeric;
  }

  const numeric = Number(trimmed);
  return Number.isNaN(numeric) ? null : numeric;
};

export function AssinaturaFormDialog({ open, onOpenChange, onSubmit, isSubmitting = false }: AssinaturaFormDialogProps) {
  const [valorDisplay, setValorDisplay] = React.useState("");
  const [clientes, setClientes] = React.useState<ClienteOption[]>([]);
  const [clienteSearch, setClienteSearch] = React.useState("");
  const [showClienteSearch, setShowClienteSearch] = React.useState(false);

  const form = useForm<AssinaturaFormValues>({
    resolver: zodResolver(assinaturaCreateSchema),
    defaultValues: DEFAULT_VALUES,
  });

  const valor = form.watch("valor");
  const clienteId = form.watch("clienteId");

  React.useEffect(() => {
    if (!open) {
      setValorDisplay("");
      setClienteSearch("");
      setShowClienteSearch(false);
      setClientes([]);
    }
  }, [open]);

  React.useEffect(() => {
    if (!valor) {
      setValorDisplay("");
      return;
    }

    const numeric = parseCurrencyValue(valor);

    if (numeric !== null) {
      const formattedDisplay = formatCurrencyDisplay(numeric);
      if (formattedDisplay !== valorDisplay) {
        setValorDisplay(formattedDisplay);
      }

      const formattedField = formatFieldValue(numeric);
      if (formattedField !== valor) {
        form.setValue("valor", formattedField, { shouldDirty: false });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [valor]);

  const searchClientes = async (query: string) => {
    if (query.length < 2) {
      setClientes([]);
      return;
    }

    try {
      const params = new URLSearchParams();
      params.set("search", query);
      params.set("status", "ativos");
      params.set("perPage", "10");

      const response = await fetchWithAuth(`/api/tomadores?${params.toString()}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const data = await response.json();
        setClientes(data.data || []);
      }
    } catch (error) {
      console.error("Erro ao buscar clientes:", error);
    }
  };

  React.useEffect(() => {
    const handler = setTimeout(() => {
      if (clienteSearch) {
        searchClientes(clienteSearch);
      } else {
        setClientes([]);
      }
    }, 300);

    return () => clearTimeout(handler);
  }, [clienteSearch]);

  const selectedCliente = clientes.find(c => c.id === clienteId);

  const handleSubmit = async (values: AssinaturaFormValues) => {
    const parsed = assinaturaCreateSchema.parse(values);
    await onSubmit(parsed);
    form.reset(DEFAULT_VALUES);
    setValorDisplay("");
    setClienteSearch("");
    setShowClienteSearch(false);
    setClientes([]);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nova Assinatura</DialogTitle>
          <DialogDescription>
            Cadastre uma nova assinatura para geração automática de NFSe.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Dados da Assinatura</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="clienteId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cliente</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            placeholder="Buscar cliente..."
                            value={selectedCliente ? selectedCliente.nomeRazaoSocial : clienteSearch}
                            onChange={(e) => {
                              setClienteSearch(e.target.value);
                              setShowClienteSearch(true);
                              if (selectedCliente && e.target.value !== selectedCliente.nomeRazaoSocial) {
                                field.onChange("");
                              }
                            }}
                            onFocus={() => setShowClienteSearch(true)}
                          />
                          <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                          {showClienteSearch && clientes.length > 0 && (
                            <div className="absolute z-10 w-full mt-1 bg-background border rounded-md shadow-lg max-h-48 overflow-y-auto">
                              {clientes.map((cliente) => (
                                <button
                                  key={cliente.id}
                                  type="button"
                                  className="w-full px-3 py-2 text-left hover:bg-muted"
                                  onClick={() => {
                                    field.onChange(cliente.id);
                                    setClienteSearch(cliente.nomeRazaoSocial);
                                    setShowClienteSearch(false);
                                  }}
                                >
                                  <div className="font-medium">{cliente.nomeRazaoSocial}</div>
                                  {cliente.documento && (
                                    <div className="text-xs text-muted-foreground">{cliente.documento}</div>
                                  )}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="intervalo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Intervalo</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o intervalo" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="SEMANAL">Semanal</SelectItem>
                          <SelectItem value="QUINZENAL">Quinzenal</SelectItem>
                          <SelectItem value="MENSAL">Mensal</SelectItem>
                          <SelectItem value="BIMESTRAL">Bimestral</SelectItem>
                          <SelectItem value="TRIMESTRAL">Trimestral</SelectItem>
                          <SelectItem value="SEMESTRAL">Semestral</SelectItem>
                          <SelectItem value="ANUAL">Anual</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="descricao"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Descrição do Serviço</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Descreva o serviço que será prestado..."
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="valor"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Valor</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="0,00"
                          value={valorDisplay}
                          onChange={(e) => {
                            setValorDisplay(e.target.value);
                            const numeric = parseCurrencyValue(e.target.value);
                            if (numeric !== null) {
                              field.onChange(formatFieldValue(numeric));
                            } else {
                              field.onChange("");
                            }
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="vencimentoInicial"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Vencimento Inicial</FormLabel>
                      <FormControl>
                        <Input
                          type="date"
                          {...field}
                          value={field.value as string}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="dataFim"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Data de Fim da Assinatura (opcional)</FormLabel>
                      <FormControl>
                        <Input
                          type="date"
                          {...field}
                          value={field.value as string}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Salvando..." : "Salvar Assinatura"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
