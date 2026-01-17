"use client";

import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

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
import { Switch } from "@/components/ui/switch";
import { servicoCreateSchema, type ServicoCreateInput } from "@/lib/validators/servico";

type ServicoFormValues = z.input<typeof servicoCreateSchema>;

interface ServicoFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: ServicoCreateInput) => Promise<void>;
  isSubmitting?: boolean;
}

const DEFAULT_VALUES: ServicoFormValues = {
  descricao: "",
  codigoTributacaoMunicipal: "",
  codigoTributacaoNacional: "",
  codigoNbs: "",
  valorUnitario: "",
  aliquotaIss: "",
  issRetido: false,
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

export function ServicoFormDialog({ open, onOpenChange, onSubmit, isSubmitting = false }: ServicoFormDialogProps) {
  const [valorDisplay, setValorDisplay] = React.useState("");

  const form = useForm<ServicoFormValues>({
    resolver: zodResolver(servicoCreateSchema),
    defaultValues: DEFAULT_VALUES,
  });

  const valorUnitario = form.watch("valorUnitario");

  React.useEffect(() => {
    if (!open) {
      setValorDisplay("");
    }
  }, [open]);

  React.useEffect(() => {
    if (!valorUnitario) {
      setValorDisplay("");
      return;
    }

    const numeric = parseCurrencyValue(valorUnitario);

    if (numeric !== null) {
      const formattedDisplay = formatCurrencyDisplay(numeric);
      if (formattedDisplay !== valorDisplay) {
        setValorDisplay(formattedDisplay);
      }

      const formattedField = formatFieldValue(numeric);
      if (formattedField !== valorUnitario) {
        form.setValue("valorUnitario", formattedField, { shouldDirty: false });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [valorUnitario]);

  const handleSubmit = async (values: ServicoFormValues) => {
    const parsed = servicoCreateSchema.parse(values);
    await onSubmit(parsed);
    form.reset(DEFAULT_VALUES);
    setValorDisplay("");
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) {
          form.reset(DEFAULT_VALUES);
        }
        onOpenChange(next);
      }}
    >
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl p-6">
        <DialogHeader>
          <DialogTitle>Novo serviço</DialogTitle>
          <DialogDescription>Cadastre um serviço para utilização na emissão das DPS e NFSe.</DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form className="space-y-6 p-4 bg-muted/30 rounded-lg" onSubmit={form.handleSubmit(handleSubmit)}>
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="descricao"
                render={({ field }) => (
                  <FormItem className="sm:col-span-2">
                    <FormLabel>Descrição do serviço</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Ex.: Desenvolvimento de software" 
                        disabled={isSubmitting} 
                        maxLength={1000}
                        rows={3}
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="codigoTributacaoMunicipal"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Código tributação municipal</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex.: 001" disabled={isSubmitting} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="codigoTributacaoNacional"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Código tributação nacional</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex.: 040101" disabled={isSubmitting} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="codigoNbs"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Código NBS (opcional)</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex.: 123012100" disabled={isSubmitting} value={field.value ?? ""} onChange={field.onChange} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="valorUnitario"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Valor unitário</FormLabel>
                    <FormControl>
                      <Input
                        type="text"
                        disabled={isSubmitting}
                        value={valorDisplay}
                        onChange={(event) => {
                          const input = event.target.value;
                          const digitsOnly = input.replace(/\D/g, "");

                          if (digitsOnly === "") {
                            setValorDisplay("");
                            field.onChange("");
                            return;
                          }

                          const numeric = Number(digitsOnly) / 100;
                          setValorDisplay(formatCurrencyDisplay(numeric));
                          field.onChange(formatFieldValue(numeric));
                        }}
                        onBlur={() => {
                          if (field.value) {
                            const numeric = parseCurrencyValue(field.value.toString());
                            if (numeric !== null) {
                              setValorDisplay(formatCurrencyDisplay(numeric));
                              field.onChange(formatFieldValue(numeric));
                            }
                          }
                          field.onBlur();
                        }}
                        placeholder="0,00"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="aliquotaIss"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Alíquota ISS (%)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        disabled={isSubmitting}
                        value={field.value ?? ""}
                        onChange={field.onChange}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="issRetido"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between rounded-md border px-3 py-2">
                    <FormLabel className="text-sm font-medium">ISS retido?</FormLabel>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} disabled={isSubmitting} />
                    </FormControl>
                  </FormItem>
                )}
              />

            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Salvando..." : "Cadastrar"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
