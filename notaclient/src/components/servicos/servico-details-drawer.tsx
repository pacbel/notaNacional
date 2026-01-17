"use client";

import { useEffect, useMemo, useState } from "react";
import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, MapPin, ClipboardList, Pencil } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/formatters";
import { servicoUpdateSchema, type ServicoUpdateInput } from "@/lib/validators/servico";
import type { ServicoDto } from "@/services/servicos";

interface ServicoDetailsDrawerProps {
  servico: ServicoDto | null;
  onClose: () => void;
  onUpdate: (id: string, values: ServicoUpdateInput) => Promise<void>;
  onInactivate: (id: string) => Promise<void>;
  onReactivate: (id: string) => Promise<void>;
  isMutating: boolean;
}

type ServicoFormValues = z.input<typeof servicoUpdateSchema>;

const EMPTY_VALUES: ServicoFormValues = {
  descricao: "",
  codigoTributacaoMunicipal: "",
  codigoTributacaoNacional: "",
  codigoNbs: "",
  valorUnitario: "",
  aliquotaIss: "",
  issRetido: false,
  ativo: true,
};

const BRL_FORMAT = {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
} as const;

const formatCurrencyDisplay = (value: number) =>
  value.toLocaleString("pt-BR", BRL_FORMAT);

const formatFieldValue = (value: number) => value.toFixed(2).replace('.', ',');

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

  const normalized = trimmed.replace(/\./g, "").replace(/,/g, ".");
  const numeric = Number(normalized);
  return Number.isNaN(numeric) ? null : numeric;
};

function mapServicoToForm(servico: ServicoDto): ServicoFormValues {
  return {
    descricao: servico.descricao,
    codigoTributacaoMunicipal: servico.codigoTributacaoMunicipal,
    codigoTributacaoNacional: servico.codigoTributacaoNacional,
    codigoNbs: servico.codigoNbs ?? "",
    valorUnitario: formatFieldValue(servico.valorUnitario ?? 0),
    aliquotaIss: servico.aliquotaIss !== null ? formatFieldValue(servico.aliquotaIss) : "",
    issRetido: servico.issRetido,
    ativo: servico.ativo,
  };
}

export function ServicoDetailsDrawer({
  servico,
  onClose,
  onUpdate,
  onInactivate,
  onReactivate,
  isMutating,
}: ServicoDetailsDrawerProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [valorDisplay, setValorDisplay] = useState("");

  const form = useForm<ServicoFormValues>({
    resolver: zodResolver(servicoUpdateSchema) as Resolver<ServicoFormValues>,
    defaultValues: EMPTY_VALUES,
  });

  const valorUnitario = form.watch("valorUnitario");

  useEffect(() => {
    if (servico) {
      form.reset(mapServicoToForm(servico));
      setIsEditing(false);

      const numeric = parseCurrencyValue(servico.valorUnitario) ?? 0;
      setValorDisplay(formatCurrencyDisplay(numeric));
      form.setValue("valorUnitario", formatFieldValue(numeric));
    }
  }, [servico, form]);

  useEffect(() => {
    if (!valorUnitario) {
      setValorDisplay("");
      return;
    }

    const numeric = parseCurrencyValue(valorUnitario);

    if (numeric !== null) {
      setValorDisplay(formatCurrencyDisplay(numeric));
      form.setValue("valorUnitario", formatFieldValue(numeric), { shouldDirty: false });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [valorUnitario]);

  const createdAt = useMemo(() => {
    if (!servico) return "";
    return format(new Date(servico.createdAt), "dd/MM/yyyy HH:mm", { locale: ptBR });
  }, [servico]);

  const updatedAt = useMemo(() => {
    if (!servico) return "";
    return format(new Date(servico.updatedAt), "dd/MM/yyyy HH:mm", { locale: ptBR });
  }, [servico]);

  if (!servico) {
    return null;
  }

  const handleSubmit = async (values: ServicoFormValues) => {
    const parsed = servicoUpdateSchema.parse(values);
    await onUpdate(servico.id, parsed);
    setIsEditing(false);
  };

  return (
    <Sheet
      open={Boolean(servico)}
      onOpenChange={(open) => {
        if (!open) {
          onClose();
        }
      }}
    >
      <SheetContent widthClass="w-full max-w-4xl border-l" className="flex flex-col gap-6 overflow-y-auto p-6">
        <SheetHeader className="space-y-3">
          <div className="flex items-center justify-between">
            <SheetTitle className="text-lg font-semibold">Editar dados</SheetTitle>
            {!isEditing && (
              <Button variant="ghost" onClick={() => setIsEditing(true)} disabled={isMutating}>
                Editar
              </Button>
            )}
          </div>
        </SheetHeader>

          {isEditing ? (
            <Form {...form}>
              <form className="space-y-4 p-4 bg-muted/30 rounded-lg" onSubmit={form.handleSubmit(handleSubmit)}>
                <div className="grid gap-4 sm:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="descricao"
                    render={({ field }) => (
                      <FormItem className="sm:col-span-2">
                        <FormLabel>Descrição</FormLabel>
                        <FormControl>
                          <Textarea 
                            value={field.value ?? ""} 
                            onChange={field.onChange} 
                            disabled={isMutating}
                            maxLength={1000}
                            rows={3}
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
                        <FormLabel>Código trib. municipal</FormLabel>
                        <FormControl>
                          <Input value={field.value ?? ""} onChange={field.onChange} disabled={isMutating} />
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
                        <FormLabel>Código trib. nacional</FormLabel>
                        <FormControl>
                          <Input value={field.value ?? ""} onChange={field.onChange} disabled={isMutating} />
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
                        <FormLabel>Código NBS</FormLabel>
                        <FormControl>
                          <Input value={field.value ?? ""} onChange={field.onChange} disabled={isMutating} />
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
                            disabled={isMutating}
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
                                  field.onChange(formatFieldValue(numeric));
                                  setValorDisplay(formatCurrencyDisplay(numeric));
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
                          <Input type="number" step="0.01" value={field.value ?? ""} onChange={field.onChange} disabled={isMutating} />
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
                          <Switch checked={field.value ?? false} onCheckedChange={field.onChange} disabled={isMutating} />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="ativo"
                    render={({ field }) => (
                      <FormItem className="flex items-center justify-between rounded-md border px-3 py-2">
                        <FormLabel className="text-sm font-medium">Serviço ativo?</FormLabel>
                        <FormControl>
                          <Switch checked={field.value ?? false} onCheckedChange={field.onChange} disabled={isMutating} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>

                <SheetFooter className="flex flex-col-reverse items-stretch gap-2 sm:flex-row sm:justify-end">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsEditing(false)}
                    disabled={isMutating}
                    className="sm:min-w-[160px]"
                  >
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={isMutating} className="sm:min-w-[160px]">
                    {isMutating ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Salvando
                      </>
                    ) : (
                      "Salvar alterações"
                    )}
                  </Button>
                </SheetFooter>
              </form>
            </Form>
          ) : (
            <div className="space-y-3 text-sm text-muted-foreground">
              <p>Nenhuma anotação cadastrada.</p>
            </div>
          )}
        </div>

        <Separator />

        <SheetFooter className="flex flex-col gap-2 sm:flex-row sm:justify-between">
          <Button variant="outline" onClick={onClose} disabled={isMutating}>
            Fechar
          </Button>

          {servico.ativo ? (
            <Button variant="destructive" onClick={() => onInactivate(servico.id)} disabled={isMutating}>
              {isMutating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Inativar serviço
            </Button>
          ) : (
            <Button onClick={() => onReactivate(servico.id)} disabled={isMutating}>
              {isMutating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Reativar serviço
            </Button>
          )}
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
