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
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetFooter,
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

function mapServicoToForm(servico: ServicoDto): ServicoFormValues {
  return {
    descricao: servico.descricao,
    codigoTributacaoMunicipal: servico.codigoTributacaoMunicipal,
    codigoTributacaoNacional: servico.codigoTributacaoNacional,
    codigoNbs: servico.codigoNbs ?? "",
    valorUnitario: String(servico.valorUnitario),
    aliquotaIss: servico.aliquotaIss !== null ? String(servico.aliquotaIss) : "",
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

  const form = useForm<ServicoFormValues>({
    resolver: zodResolver(servicoUpdateSchema) as Resolver<ServicoFormValues>,
    defaultValues: EMPTY_VALUES,
  });

  useEffect(() => {
    if (servico) {
      form.reset(mapServicoToForm(servico));
      setIsEditing(false);
    }
  }, [servico, form]);

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
      <SheetContent className="flex w-[800px] max-w-[90vw] flex-col gap-6 overflow-y-auto p-6">
        <SheetHeader>
          <SheetTitle className="text-left text-2xl font-semibold">{servico.descricao}</SheetTitle>
          <SheetDescription className="text-left text-sm text-muted-foreground">
            Código municipal {servico.codigoTributacaoMunicipal} · Código nacional {servico.codigoTributacaoNacional}
          </SheetDescription>
        </SheetHeader>

        <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
          <Badge variant={servico.ativo ? "default" : "outline"}>{servico.ativo ? "Ativo" : "Inativo"}</Badge>
          <span>Atualizado em {updatedAt}</span>
          <span>·</span>
          <span>Criado em {createdAt}</span>
        </div>

        <Separator />

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Editar dados</h2>
            <Button variant="ghost" onClick={() => setIsEditing((prev) => !prev)} disabled={isMutating}>
              {isEditing ? "Cancelar" : "Editar"}
            </Button>
          </div>

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
                          <Input value={field.value ?? ""} onChange={field.onChange} disabled={isMutating} />
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
                          <Input type="number" step="0.01" value={field.value ?? ""} onChange={field.onChange} disabled={isMutating} />
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

                <SheetFooter className="gap-2">
                  <Button type="button" variant="outline" onClick={() => setIsEditing(false)} disabled={isMutating}>
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={isMutating}>
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
