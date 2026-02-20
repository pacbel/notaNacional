"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, Calendar, User, Pencil, Trash2, RotateCcw } from "lucide-react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/formatters";
import { assinaturaUpdateSchema, type AssinaturaUpdateInput } from "@/lib/validators/assinatura";
import type { AssinaturaDto } from "@/services/assinaturas";

interface AssinaturaDetailsDrawerProps {
  assinatura: AssinaturaDto | null;
  onClose: () => void;
  onUpdate: (id: string, values: AssinaturaUpdateInput) => Promise<void>;
  onInactivate: (id: string) => Promise<void>;
  onReactivate: (id: string) => Promise<void>;
  isMutating: boolean;
}

type AssinaturaFormValues = z.input<typeof assinaturaUpdateSchema>;

const EMPTY_VALUES: AssinaturaFormValues = {
  clienteId: "",
  intervalo: "MENSAL",
  descricao: "",
  valor: "",
  vencimentoInicial: "",
  dataFim: "",
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

function mapAssinaturaToForm(assinatura: AssinaturaDto): AssinaturaFormValues {
  return {
    clienteId: assinatura.clienteId,
    intervalo: assinatura.intervalo,
    descricao: assinatura.descricao,
    valor: formatFieldValue(assinatura.valor ?? 0),
    vencimentoInicial: assinatura.vencimentoInicial,
    dataFim: assinatura.dataFim || "",
    ativo: assinatura.ativo,
  };
}

const intervaloLabels = {
  SEMANAL: "Semanal",
  QUINZENAL: "Quinzenal",
  MENSAL: "Mensal",
  BIMESTRAL: "Bimestral",
  TRIMESTRAL: "Trimestral",
  SEMESTRAL: "Semestral",
  ANUAL: "Anual",
};

export function AssinaturaDetailsDrawer({
  assinatura,
  onClose,
  onUpdate,
  onInactivate,
  onReactivate,
  isMutating,
}: AssinaturaDetailsDrawerProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [valorDisplay, setValorDisplay] = useState("");

  const form = useForm<AssinaturaFormValues>({
    resolver: zodResolver(assinaturaUpdateSchema) as Resolver<AssinaturaFormValues>,
    defaultValues: EMPTY_VALUES,
  });

  useEffect(() => {
    if (assinatura) {
      form.reset(mapAssinaturaToForm(assinatura));
      setIsEditing(false);

      const numericValor = parseCurrencyValue(assinatura.valor) ?? 0;
      setValorDisplay(formatCurrencyDisplay(numericValor));
      form.setValue("valor", formatFieldValue(numericValor));
    }
  }, [assinatura, form]);

  const valor = form.watch("valor");

  useEffect(() => {
    if (!valor) {
      setValorDisplay("");
      return;
    }

    const numeric = parseCurrencyValue(valor);

    if (numeric !== null) {
      setValorDisplay(formatCurrencyDisplay(numeric));
      form.setValue("valor", formatFieldValue(numeric), { shouldDirty: false });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [valor]);

  const createdAt = useMemo(() => {
    if (!assinatura) return "";
    return format(new Date(assinatura.createdAt), "dd/MM/yyyy HH:mm", { locale: ptBR });
  }, [assinatura]);

  const updatedAt = useMemo(() => {
    if (!assinatura) return "";
    return format(new Date(assinatura.updatedAt), "dd/MM/yyyy HH:mm", { locale: ptBR });
  }, [assinatura]);

  if (!assinatura) {
    return null;
  }

  const handleSubmit = async (values: AssinaturaFormValues) => {
    const parsed = assinaturaUpdateSchema.parse(values);
    await onUpdate(assinatura.id, parsed);
    setIsEditing(false);
  };

  return (
    <Sheet open={!!assinatura} onOpenChange={() => onClose()}>
      <SheetContent className="w-full sm:max-w-lg">
        <SheetHeader>
          <SheetTitle>Assinatura</SheetTitle>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {isEditing ? (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Editar Assinatura</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="p-3 bg-muted rounded-md">
                      <div className="flex items-center gap-2 text-sm">
                        <User className="h-4 w-4" />
                        <span className="font-medium">{assinatura.cliente.nomeRazaoSocial}</span>
                        {assinatura.cliente.documento && (
                          <span className="text-muted-foreground">({assinatura.cliente.documento})</span>
                        )}
                      </div>
                    </div>

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

                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsEditing(false)}
                    disabled={isMutating}
                  >
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={isMutating}>
                    {isMutating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Salvar
                  </Button>
                </div>
              </form>
            </Form>
          ) : (
            <>
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Dados da Assinatura</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 gap-4">
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Cliente</label>
                      <div className="flex items-center gap-2 mt-1">
                        <User className="h-4 w-4" />
                        <span className="font-medium">{assinatura.cliente.nomeRazaoSocial}</span>
                        {assinatura.cliente.documento && (
                          <span className="text-muted-foreground">({assinatura.cliente.documento})</span>
                        )}
                      </div>
                    </div>

                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Intervalo</label>
                      <Badge variant="secondary" className="mt-1">
                        <Calendar className="mr-1 h-3 w-3" />
                        {intervaloLabels[assinatura.intervalo]}
                      </Badge>
                    </div>

                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Descrição</label>
                      <p className="mt-1 text-sm">{assinatura.descricao}</p>
                    </div>

                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Valor</label>
                      <p className="mt-1 font-semibold">{formatCurrency(assinatura.valor)}</p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Vencimento Inicial</label>
                        <p className="mt-1 text-sm">
                          {format(new Date(assinatura.vencimentoInicial), "dd/MM/yyyy", { locale: ptBR })}
                        </p>
                      </div>
                      {assinatura.dataFim && (
                        <div>
                          <label className="text-sm font-medium text-muted-foreground">Data de Fim</label>
                          <p className="mt-1 text-sm">
                            {format(new Date(assinatura.dataFim), "dd/MM/yyyy", { locale: ptBR })}
                          </p>
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Status</label>
                      <Badge variant={assinatura.ativo ? "default" : "outline"} className="mt-1">
                        {assinatura.ativo ? "Ativa" : "Inativa"}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Separator />

              <div className="space-y-2 text-xs text-muted-foreground">
                <div>Criado em: {createdAt}</div>
                <div>Atualizado em: {updatedAt}</div>
              </div>
            </>
          )}
        </div>

        <SheetFooter className="flex gap-2">
          {!isEditing && (
            <>
              <Button
                variant="outline"
                onClick={() => setIsEditing(true)}
                disabled={isMutating}
              >
                <Pencil className="mr-2 h-4 w-4" />
                Editar
              </Button>
              {assinatura.ativo ? (
                <Button
                  variant="destructive"
                  onClick={() => onInactivate(assinatura.id)}
                  disabled={isMutating}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Inativar
                </Button>
              ) : (
                <Button
                  variant="outline"
                  onClick={() => onReactivate(assinatura.id)}
                  disabled={isMutating}
                >
                  <RotateCcw className="mr-2 h-4 w-4" />
                  Reativar
                </Button>
              )}
            </>
          )}
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
