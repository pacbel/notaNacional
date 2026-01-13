"use client";

import { useCallback, useRef, useState } from "react";
import { useForm, type Resolver, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { tomadorCreateSchema, type TomadorCreateInput, type TomadorFormValues } from "@/lib/validators/tomador";
import { formatDocumentoInput, formatPhoneInput, normalizeDocumento, normalizePhone } from "@/lib/utils/input-masks";

import { AddressFormSection } from "@/components/address/address-form-section";

interface ViaCepResponse {
  logradouro?: string;
  bairro?: string;
  localidade?: string;
  uf?: string;
  ibge?: string;
  complemento?: string;
  erro?: boolean;
}

interface TomadorFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: TomadorCreateInput) => Promise<void>;
  isSubmitting?: boolean;
}

const DEFAULT_VALUES: TomadorFormValues = {
  tipoDocumento: "CPF",
  documento: "",
  nomeRazaoSocial: "",
  email: "",
  telefone: "",
  inscricaoMunicipal: "",
  codigoMunicipio: "",
  cidade: "",
  estado: "",
  cep: "",
  logradouro: "",
  numero: "",
  complemento: "",
  bairro: "",
};

export function TomadorFormDialog({ open, onOpenChange, onSubmit, isSubmitting = false }: TomadorFormDialogProps) {
  const resolver: Resolver<TomadorFormValues, undefined, TomadorCreateInput> = zodResolver(tomadorCreateSchema);

  const form = useForm<TomadorFormValues, undefined, TomadorCreateInput>({
    resolver,
    defaultValues: DEFAULT_VALUES,
  });

  const tipoDocumentoValue = form.watch("tipoDocumento") ?? "CPF";
  const numeroInputRef = useRef<HTMLInputElement | null>(null);

  const handleSubmit: SubmitHandler<TomadorFormValues> = async (values) => {
    const parsed = tomadorCreateSchema.parse(values);
    await onSubmit(parsed);
    form.reset(DEFAULT_VALUES);
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
      <DialogContent className="max-h-[90vh] overflow-y-auto p-6 sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Novo tomador</DialogTitle>
          <DialogDescription>Cadastre um novo tomador de serviços para emissão de NFSe.</DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form className="space-y-6" onSubmit={form.handleSubmit(handleSubmit)}>
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="tipoDocumento"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo de documento</FormLabel>
                    <FormControl>
                      <select
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                        disabled={isSubmitting}
                        value={field.value}
                        onChange={(event) => {
                          const nextTipo = event.target.value as "CPF" | "CNPJ";
                          field.onChange(nextTipo);
                          const normalized = normalizeDocumento(form.getValues("documento") ?? "", nextTipo);
                          form.setValue("documento", normalized, { shouldDirty: true });
                        }}
                        autoFocus
                      >
                        <option value="CPF">CPF</option>
                        <option value="CNPJ">CNPJ</option>
                      </select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="documento"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Documento</FormLabel>
                    <FormControl>
                      <Input
                        placeholder={tipoDocumentoValue === "CPF" ? "000.000.000-00" : "00.000.000/0000-00"}
                        disabled={isSubmitting}
                        value={formatDocumentoInput(field.value ?? "", tipoDocumentoValue)}
                        onChange={(event) => field.onChange(normalizeDocumento(event.target.value, tipoDocumentoValue))}
                        inputMode="numeric"
                        autoComplete="off"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="nomeRazaoSocial"
                render={({ field }) => (
                  <FormItem className="sm:col-span-2">
                    <FormLabel>Nome / Razão social</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Cliente XP"
                        disabled={isSubmitting}
                        value={field.value}
                        onChange={field.onChange}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>E-mail</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="contato@cliente.com"
                        disabled={isSubmitting}
                        value={field.value ?? ""}
                        onChange={(event) => field.onChange(event.target.value.toLowerCase())}
                        autoComplete="email"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="telefone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Telefone</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="(11) 99999-0000"
                        disabled={isSubmitting}
                        value={formatPhoneInput(field.value ?? "")}
                        onChange={(event) => field.onChange(normalizePhone(event.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />


            </div>

            <AddressFormSection
              form={form}
              isSubmitting={isSubmitting}
              numeroInputRef={numeroInputRef}
              debugLabel="Tomadores/FormDialog"
            />

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
