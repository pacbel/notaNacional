"use client";

import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, Mail, Phone, MapPin, Building2, Shield } from "lucide-react";

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
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { formatCpfCnpj, formatPhone } from "@/lib/formatters";
import {
  prestadorUpdateSchema,
  type PrestadorUpdateInput,
} from "@/lib/validators/prestador";
import type { PrestadorDto } from "@/services/prestadores";

interface PrestadorDetailsDrawerProps {
  prestador: PrestadorDto | null;
  onClose: () => void;
  onUpdate: (id: string, values: PrestadorUpdateInput) => Promise<void>;
  onInactivate: (id: string) => Promise<void>;
  onReactivate: (id: string) => Promise<void>;
  isMutating: boolean;
}

type PrestadorUpdateFormValues = z.input<typeof prestadorUpdateSchema>;

const EMPTY_FORM_VALUES: PrestadorUpdateFormValues = {
  nomeFantasia: "",
  razaoSocial: "",
  cnpj: "",
  inscricaoMunicipal: "",
  email: "",
  telefone: "",
  codigoMunicipio: "",
  cidade: "",
  estado: "",
  cep: "",
  logradouro: "",
  numero: "",
  complemento: "",
  bairro: "",
  observacoes: "",
  ativo: true,
};

function mapPrestadorToForm(prestador: PrestadorDto) {
  return {
    nomeFantasia: prestador.nomeFantasia ?? "",
    razaoSocial: prestador.razaoSocial ?? "",
    cnpj: prestador.cnpj ?? "",
    inscricaoMunicipal: prestador.inscricaoMunicipal ?? "",
    email: prestador.email ?? "",
    telefone: prestador.telefone ?? "",
    codigoMunicipio: prestador.codigoMunicipio ?? "",
    cidade: prestador.cidade ?? "",
    estado: prestador.estado ?? "",
    cep: prestador.cep ?? "",
    logradouro: prestador.logradouro ?? "",
    numero: prestador.numero ?? "",
    complemento: prestador.complemento ?? "",
    bairro: prestador.bairro ?? "",
    observacoes: prestador.observacoes ?? "",
    ativo: prestador.ativo ?? true,
  } satisfies PrestadorUpdateFormValues;
}

export function PrestadorDetailsDrawer({
  prestador,
  onClose,
  onUpdate,
  onInactivate,
  onReactivate,
  isMutating,
}: PrestadorDetailsDrawerProps) {
  const [isEditing, setIsEditing] = useState(false);

  const form = useForm<PrestadorUpdateFormValues>({
    resolver: zodResolver(prestadorUpdateSchema) as any,
    defaultValues: EMPTY_FORM_VALUES,
  });

  useEffect(() => {
    if (prestador) {
      const values = mapPrestadorToForm(prestador);
      form.reset(values);
      setIsEditing(false);
    }
  }, [prestador, form]);

  const address = useMemo(() => {
    if (!prestador) {
      return "";
    }

    const parts = [
      `${prestador.logradouro ?? ""}, ${prestador.numero ?? ""}`.trim(),
      prestador.complemento ?? "",
      prestador.bairro ?? "",
      `${prestador.cidade ?? ""} - ${prestador.estado ?? ""}`.trim(),
      prestador.cep ?? "",
    ].filter(Boolean);

    return parts.join(" · ");
  }, [prestador]);

  if (!prestador) {
    return null;
  }

  const handleSubmit = async (values: PrestadorUpdateFormValues) => {
    const parsed = prestadorUpdateSchema.parse(values);
    await onUpdate(prestador.id, parsed);
    setIsEditing(false);
  };

  return (
    <Sheet
      open={Boolean(prestador)}
      onOpenChange={(open) => {
        if (!open) {
          onClose();
        }
      }}
    >
      <SheetContent className="flex w-full max-w-xl flex-col gap-6 overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="text-left text-2xl font-semibold">
            {prestador.nomeFantasia}
          </SheetTitle>
          <SheetDescription className="text-left text-sm text-muted-foreground">
            {prestador.razaoSocial ?? ""} · {formatCpfCnpj(prestador.cnpj ?? "")}
          </SheetDescription>
        </SheetHeader>

        <div className="flex items-center gap-2">
          <Badge variant={prestador.ativo ? "default" : "outline"} className="gap-1">
            <Shield className="h-3 w-3" />
            {prestador.ativo ? "Prestador ativo" : "Prestador inativo"}
          </Badge>
          <Badge variant="secondary">
            Criado em {prestador.createdAt ? new Date(prestador.createdAt).toLocaleString("pt-BR") : "—"}
          </Badge>
        </div>

        <Separator />

        <div className="space-y-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Mail className="h-4 w-4" />
            <span>{prestador.email}</span>
          </div>
          {prestador.telefone && (
            <div className="flex items-center gap-2">
              <Phone className="h-4 w-4" />
              <span>{formatPhone(prestador.telefone)}</span>
            </div>
          )}
          <div className="flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            <span>Inscrição Municipal: {prestador.inscricaoMunicipal ?? "—"}</span>
          </div>
          <div className="flex items-start gap-2">
            <MapPin className="mt-0.5 h-4 w-4" />
            <span>{address}</span>
          </div>
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
              <form className="space-y-4" onSubmit={form.handleSubmit(handleSubmit)}>
                <div className="grid gap-4 sm:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="nomeFantasia"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nome fantasia</FormLabel>
                        <FormControl>
                          <Input value={field.value ?? ""} onChange={field.onChange} disabled={isMutating} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="razaoSocial"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Razão social</FormLabel>
                        <FormControl>
                          <Input value={field.value ?? ""} onChange={field.onChange} disabled={isMutating} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="inscricaoMunicipal"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Inscrição municipal</FormLabel>
                        <FormControl>
                          <Input
                            value={field.value ?? ""}
                            onChange={(event) => field.onChange(event.target.value || null)}
                            disabled={isMutating}
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
                            value={field.value ?? ""}
                            onChange={field.onChange}
                            disabled={isMutating}
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
                            value={field.value ?? ""}
                            onChange={(event) => field.onChange(event.target.value || null)}
                            disabled={isMutating}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="codigoMunicipio"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Código do município (IBGE)</FormLabel>
                        <FormControl>
                          <Input value={field.value ?? ""} onChange={field.onChange} disabled={isMutating} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="cidade"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Cidade</FormLabel>
                        <FormControl>
                          <Input value={field.value ?? ""} onChange={field.onChange} disabled={isMutating} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="estado"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>UF</FormLabel>
                        <FormControl>
                          <Input value={field.value ?? ""} onChange={field.onChange} disabled={isMutating} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="cep"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>CEP</FormLabel>
                        <FormControl>
                          <Input value={field.value ?? ""} onChange={field.onChange} disabled={isMutating} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="logradouro"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Logradouro</FormLabel>
                        <FormControl>
                          <Input value={field.value ?? ""} onChange={field.onChange} disabled={isMutating} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="numero"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Número</FormLabel>
                        <FormControl>
                          <Input value={field.value ?? ""} onChange={field.onChange} disabled={isMutating} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="complemento"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Complemento</FormLabel>
                        <FormControl>
                          <Input
                            value={field.value ?? ""}
                            onChange={(event) => field.onChange(event.target.value || null)}
                            disabled={isMutating}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="bairro"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Bairro</FormLabel>
                        <FormControl>
                          <Input value={field.value ?? ""} onChange={field.onChange} disabled={isMutating} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="observacoes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Observações</FormLabel>
                      <FormControl>
                        <Textarea
                          value={field.value ?? ""}
                          onChange={(event) => field.onChange(event.target.value || null)}
                          disabled={isMutating}
                          className="min-h-[100px]"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

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
              <div>
                <span className="font-medium text-foreground">Observações</span>
                <p className="mt-1 whitespace-pre-line">
                  {prestador.observacoes ? prestador.observacoes : "Nenhuma anotação cadastrada."}
                </p>
              </div>
            </div>
          )}
        </div>

        <Separator />

        <SheetFooter className="flex flex-col gap-2 sm:flex-row sm:justify-between">
          <Button variant="outline" onClick={onClose} disabled={isMutating}>
            Fechar
          </Button>

          {prestador.ativo ? (
            <Button
              variant="destructive"
              onClick={() => onInactivate(prestador.id)}
              disabled={isMutating}
            >
              {isMutating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Inativar prestador
            </Button>
          ) : (
            <Button onClick={() => onReactivate(prestador.id)} disabled={isMutating}>
              {isMutating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Reativar prestador
            </Button>
          )}
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
