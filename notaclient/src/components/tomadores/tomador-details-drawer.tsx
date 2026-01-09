"use client";

import { useEffect, useMemo, useState } from "react";
import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, Mail, Phone, MapPin, Shield } from "lucide-react";

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
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { formatCpfCnpj, formatPhone } from "@/lib/formatters";
import { tomadorUpdateSchema, type TomadorUpdateInput } from "@/lib/validators/tomador";
import type { TomadorDto } from "@/services/tomadores";

interface TomadorDetailsDrawerProps {
  tomador: TomadorDto | null;
  onClose: () => void;
  onUpdate: (id: string, values: TomadorUpdateInput) => Promise<void>;
  onInactivate: (id: string) => Promise<void>;
  onReactivate: (id: string) => Promise<void>;
  isMutating: boolean;
}

const updateSchema = tomadorUpdateSchema.partial();

type TomadorFormValues = z.input<typeof updateSchema>;

const EMPTY_VALUES: TomadorFormValues = {
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
  ativo: true,
};

function mapTomadorToForm(tomador: TomadorDto): TomadorFormValues {
  return {
    tipoDocumento: tomador.tipoDocumento,
    documento: tomador.documento,
    nomeRazaoSocial: tomador.nomeRazaoSocial,
    email: tomador.email,
    telefone: tomador.telefone ?? "",
    inscricaoMunicipal: tomador.inscricaoMunicipal ?? "",
    codigoMunicipio: tomador.codigoMunicipio,
    cidade: tomador.cidade,
    estado: tomador.estado,
    cep: tomador.cep,
    logradouro: tomador.logradouro,
    numero: tomador.numero,
    complemento: tomador.complemento ?? "",
    bairro: tomador.bairro,
    ativo: tomador.ativo,
  };
}

export function TomadorDetailsDrawer({
  tomador,
  onClose,
  onUpdate,
  onInactivate,
  onReactivate,
  isMutating,
}: TomadorDetailsDrawerProps) {
  const [isEditing, setIsEditing] = useState(false);

  const form = useForm<TomadorFormValues>({
    resolver: zodResolver(updateSchema) as Resolver<TomadorFormValues>,
    defaultValues: EMPTY_VALUES,
  });

  useEffect(() => {
    if (tomador) {
      form.reset(mapTomadorToForm(tomador));
      setIsEditing(false);
    }
  }, [tomador, form]);

  const address = useMemo(() => {
    if (!tomador) return "";

    const parts = [
      `${tomador.logradouro}, ${tomador.numero}`,
      tomador.complemento,
      tomador.bairro,
      `${tomador.cidade} - ${tomador.estado}`,
      tomador.cep,
    ].filter(Boolean);

    return parts.join(" · ");
  }, [tomador]);

  if (!tomador) {
    return null;
  }

  const handleSubmit = async (values: TomadorFormValues) => {
    const parsed = updateSchema.parse(values);
    await onUpdate(tomador.id, parsed);
    setIsEditing(false);
  };

  return (
    <Sheet
      open={Boolean(tomador)}
      onOpenChange={(open) => {
        if (!open) {
          onClose();
        }
      }}
    >
      <SheetContent className="flex w-full max-w-xl flex-col gap-6 overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="text-left text-2xl font-semibold">
            {tomador.nomeRazaoSocial}
          </SheetTitle>
          <SheetDescription className="text-left text-sm text-muted-foreground">
            Documento: {formatCpfCnpj(tomador.documento)}
          </SheetDescription>
        </SheetHeader>

        <div className="flex items-center gap-2">
          <Badge variant={tomador.ativo ? "default" : "outline"} className="gap-1">
            <Shield className="h-3 w-3" />
            {tomador.ativo ? "Tomador ativo" : "Tomador inativo"}
          </Badge>
          <Badge variant="secondary">Criado em {new Date(tomador.createdAt).toLocaleString("pt-BR")}</Badge>
        </div>

        <Separator />

        <div className="space-y-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Mail className="h-4 w-4" />
            <span>{tomador.email}</span>
          </div>
          {tomador.telefone && (
            <div className="flex items-center gap-2">
              <Phone className="h-4 w-4" />
              <span>{formatPhone(tomador.telefone)}</span>
            </div>
          )}
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
                    name="nomeRazaoSocial"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nome / Razão social</FormLabel>
                        <FormControl>
                          <Input value={field.value ?? ""} onChange={field.onChange} disabled={isMutating} />
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
                          <Input value={field.value ?? ""} onChange={field.onChange} disabled={isMutating} />
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
                    name="inscricaoMunicipal"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Inscrição municipal</FormLabel>
                        <FormControl>
                          <Input
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
                    name="codigoMunicipio"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Código do município</FormLabel>
                        <FormControl>
                          <Input
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
                          <Input value={field.value ?? ""} onChange={field.onChange} disabled={isMutating} />
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

          {tomador.ativo ? (
            <Button variant="destructive" onClick={() => onInactivate(tomador.id)} disabled={isMutating}>
              {isMutating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Inativar tomador
            </Button>
          ) : (
            <Button onClick={() => onReactivate(tomador.id)} disabled={isMutating}>
              {isMutating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Reativar tomador
            </Button>
          )}
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
