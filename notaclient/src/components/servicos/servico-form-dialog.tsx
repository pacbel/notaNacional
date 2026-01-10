"use client";

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
  codigoMunicipioPrestacao: "",
  municipioPrestacao: "",
  informacoesComplementares: "",
  valorUnitario: "",
  aliquotaIss: "",
  issRetido: false,
};

export function ServicoFormDialog({ open, onOpenChange, onSubmit, isSubmitting = false }: ServicoFormDialogProps) {
  const form = useForm<ServicoFormValues>({
    resolver: zodResolver(servicoCreateSchema),
    defaultValues: DEFAULT_VALUES,
  });

  const handleSubmit = async (values: ServicoFormValues) => {
    const parsed = servicoCreateSchema.parse(values);
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
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Novo serviço</DialogTitle>
          <DialogDescription>Cadastre um serviço para utilização na emissão das DPS e NFSe.</DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form className="space-y-6" onSubmit={form.handleSubmit(handleSubmit)}>
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="descricao"
                render={({ field }) => (
                  <FormItem className="sm:col-span-2">
                    <FormLabel>Descrição do serviço</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex.: Desenvolvimento de software" disabled={isSubmitting} {...field} />
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
                name="codigoMunicipioPrestacao"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Código do município de prestação</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Ex.: 3106200"
                        disabled={isSubmitting}
                        value={field.value ?? ""}
                        onChange={(event) => field.onChange(event.target.value.replace(/\D/g, ""))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="municipioPrestacao"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Município de prestação</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex.: Belo Horizonte" disabled={isSubmitting} {...field} />
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

              <FormField
                control={form.control}
                name="informacoesComplementares"
                render={({ field }) => (
                  <FormItem className="sm:col-span-2">
                    <FormLabel>Informações complementares (opcional)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Observações exibidas na nota"
                        disabled={isSubmitting}
                        value={field.value ?? ""}
                        onChange={field.onChange}
                      />
                    </FormControl>
                    <FormMessage />
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
