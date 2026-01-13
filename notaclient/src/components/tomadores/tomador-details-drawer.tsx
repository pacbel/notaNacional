"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type FocusEvent } from "react";
import { useForm, type Resolver } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Shield } from "lucide-react";

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
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
import { formatCepInput, formatDocumentoInput, formatPhoneInput, normalizeCep, normalizeDocumento, normalizePhone } from "@/lib/utils/input-masks";
import { tomadorUpdateSchema, type TomadorUpdateInput } from "@/lib/validators/tomador";
import type { TomadorDto } from "@/services/tomadores";

interface ViaCepResponse {
  logradouro?: string;
  bairro?: string;
  localidade?: string;
  uf?: string;
  ibge?: string;
  complemento?: string;
  erro?: boolean;
}

interface TomadorDetailsDrawerProps {
  tomador: TomadorDto | null;
  onClose: () => void;
  onUpdate: (id: string, values: TomadorUpdateInput) => Promise<void>;
  onInactivate: (id: string) => Promise<void>;
  onReactivate: (id: string) => Promise<void>;
  isMutating: boolean;
}

type TomadorFormValues = z.input<typeof tomadorUpdateSchema>;

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
    resolver: zodResolver(tomadorUpdateSchema) as Resolver<TomadorFormValues>,
    defaultValues: EMPTY_VALUES,
  });

  const numeroInputRef = useRef<HTMLInputElement | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const lastFetchedCepRef = useRef<string>("");
  const logCepDebug = useCallback((step: string, details?: Record<string, unknown>) => {
    console.debug(`[Tomadores][CEP][DetailsDrawer] ${step}`, details ?? {});
  }, []);
  const [isFetchingCep, setIsFetchingCep] = useState(false);
  const tipoDocumentoValue = form.watch("tipoDocumento") ?? "CPF";

  useEffect(() => {
    if (tomador) {
      form.reset(mapTomadorToForm(tomador));
      setIsEditing(false);
      lastFetchedCepRef.current = normalizeCep(tomador.cep ?? "");
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

  const cancelPendingFetch = useCallback(() => {
    abortControllerRef.current?.abort();
    abortControllerRef.current = null;
  }, []);

  const fetchCepData = useCallback(
    async (digitsOnlyCep: string) => {
      if (!isEditing) {
        logCepDebug("skip fetch", { reason: "not editing", digitsOnlyCep });
        return;
      }

      if (digitsOnlyCep.length !== 8) {
        logCepDebug("skip fetch", { reason: "incomplete", digitsOnlyCep });
        return;
      }

      if (digitsOnlyCep === lastFetchedCepRef.current) {
        logCepDebug("skip fetch", { reason: "already fetched", digitsOnlyCep });
        return;
      }

      cancelPendingFetch();

      const controller = new AbortController();
      abortControllerRef.current = controller;

      try {
        setIsFetchingCep(true);
        logCepDebug("fetch start", { digitsOnlyCep });
        const response = await fetch(`https://viacep.com.br/ws/${digitsOnlyCep}/json/`, {
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error("CEP inválido ou indisponível");
        }

        const data = (await response.json()) as ViaCepResponse;

        logCepDebug("fetch response", {
          digitsOnlyCep,
          hasErrorFlag: data.erro ?? false,
        });

        if (data.erro) {
          throw new Error("CEP não encontrado");
        }

        if (controller.signal.aborted) {
          return;
        }

        lastFetchedCepRef.current = digitsOnlyCep;
        form.clearErrors("cep");

        if (data.logradouro) {
          form.setValue("logradouro", data.logradouro, { shouldDirty: true });
        }
        if (data.bairro) {
          form.setValue("bairro", data.bairro, { shouldDirty: true });
        }
        if (data.localidade) {
          form.setValue("cidade", data.localidade, { shouldDirty: true });
        }

        if (data.uf) {
          form.setValue("estado", data.uf, { shouldDirty: true, shouldValidate: true });
        }

        if (data.ibge) {
          const codigoMunicipio = data.ibge.slice(0, 7);
          form.setValue("codigoMunicipio", codigoMunicipio, {
            shouldDirty: true,
            shouldValidate: true,
          });
        }

        if (data.complemento) {
          form.setValue("complemento", data.complemento, { shouldDirty: true });
        }

        logCepDebug("fetch success", {
          digitsOnlyCep,
          cidade: data.localidade ?? "",
          estado: data.uf ?? "",
          codigoMunicipio: data.ibge?.slice(0, 7) ?? "",
        });

        window.requestAnimationFrame(() => {
          numeroInputRef.current?.focus();
        });
      } catch (error) {
        if (controller.signal.aborted || (error instanceof DOMException && error.name === "AbortError")) {
          logCepDebug("fetch aborted", { digitsOnlyCep });
          return;
        }
        const message = error instanceof Error ? error.message : "Erro ao buscar CEP";
        toast.error(message);
        form.setError("cep", {
          type: "manual",
          message,
        });
        lastFetchedCepRef.current = "";
        logCepDebug("fetch error", {
          digitsOnlyCep,
          message,
        });
      } finally {
        if (!controller.signal.aborted) {
          setIsFetchingCep(false);
          logCepDebug("fetch end", {
            digitsOnlyCep,
            cancelled: controller.signal.aborted,
          });
        }
        abortControllerRef.current = null;
      }
    },
    [cancelPendingFetch, form, isEditing, logCepDebug]
  );

  useEffect(() => () => cancelPendingFetch(), [cancelPendingFetch]);

  const handleCepBlur = useCallback(
    (event: FocusEvent<HTMLInputElement>) => {
      if (!isEditing) {
        return;
      }

      const normalized = normalizeCep(event.target.value);
      const formatted = formatCepInput(normalized);
      if (event.target.value !== formatted) {
        event.target.value = formatted;
      }

      form.setValue("cep", normalized, { shouldDirty: true, shouldValidate: true });
      logCepDebug("blur", { normalizedCep: normalized });
      cancelPendingFetch();
      void fetchCepData(normalized);
    },
    [cancelPendingFetch, fetchCepData, form, isEditing, logCepDebug]
  );

  const handleCepSearchClick = useCallback(() => {
    if (!isEditing) {
      logCepDebug("button click skipped", { reason: "not editing" });
      return;
    }

    const normalized = normalizeCep(form.getValues("cep") ?? "");
    form.setValue("cep", normalized, { shouldDirty: true, shouldValidate: true });
    logCepDebug("button click", { normalizedCep: normalized });
    cancelPendingFetch();
    void fetchCepData(normalized);
  }, [cancelPendingFetch, fetchCepData, form, isEditing, logCepDebug]);

  const handleSubmit = async (values: TomadorFormValues) => {
    const parsed = tomadorUpdateSchema.parse(values);
    await onUpdate(tomador?.id ?? "", parsed);
    setIsEditing(false);
  };

  if (!tomador) {
    return null;
  }

  return (
    <Sheet
      open={Boolean(tomador)}
      onOpenChange={(open) => {
        if (!open) {
          onClose();
        }
      }}
    >
      <SheetContent widthClass="w-full max-w-4xl border-l" className="flex flex-col gap-6 overflow-y-auto p-6">
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
                    name="tipoDocumento"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tipo de documento</FormLabel>
                        <FormControl>
                          <select
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                            value={field.value ?? "CPF"}
                            onChange={(event) => {
                              const nextTipo = event.target.value as "CPF" | "CNPJ";
                              field.onChange(nextTipo);
                              const normalized = normalizeDocumento(form.getValues("documento") ?? "", nextTipo);
                              form.setValue("documento", normalized, { shouldDirty: true, shouldValidate: true });
                            }}
                            disabled={isMutating}
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
                            value={formatDocumentoInput(field.value ?? "", tipoDocumentoValue)}
                            onChange={(event) =>
                              field.onChange(normalizeDocumento(event.target.value, tipoDocumentoValue))
                            }
                            disabled={isMutating}
                            inputMode="numeric"
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
                          <Input
                            value={field.value ?? ""}
                            onChange={(event) => field.onChange(event.target.value.toLowerCase())}
                            disabled={isMutating}
                            type="email"
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
                            value={formatPhoneInput(field.value ?? "")}
                            onChange={(event) => field.onChange(normalizePhone(event.target.value))}
                            disabled={isMutating}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="cep"
                    render={({ field }) => (
                      <FormItem className="sm:col-span-2">
                        <FormLabel>CEP</FormLabel>
                        <FormControl>
                          <div className="flex gap-2">
                            <Input
                              placeholder="01000-000"
                              disabled={isMutating}
                              value={formatCepInput(field.value ?? "")}
                              onChange={(event) => field.onChange(normalizeCep(event.target.value))}
                              onBlur={(event) => {
                                field.onBlur();
                                handleCepBlur(event);
                              }}
                              aria-busy={isMutating || isFetchingCep}
                              inputMode="numeric"
                              maxLength={9}
                              autoComplete="postal-code"
                            />
                            <Button
                              type="button"
                              variant="outline"
                              onMouseDown={(event) => event.preventDefault()}
                              onClick={handleCepSearchClick}
                              disabled={isMutating || isFetchingCep}
                            >
                              Buscar
                            </Button>
                          </div>
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
                          <Input
                            value={field.value ?? ""}
                            onChange={(event) => field.onChange(event.target.value.toUpperCase())}
                            disabled={isMutating}
                            maxLength={2}
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
                    name="codigoMunicipio"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Código do município (IBGE)</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="0000000"
                            value={field.value ?? ""}
                            readOnly
                            aria-readonly
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
                      <FormItem className="sm:col-span-2">
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
                          <Input
                            value={field.value ?? ""}
                            onChange={field.onChange}
                            disabled={isMutating}
                            ref={(element) => {
                              field.ref(element);
                              numeroInputRef.current = element;
                            }}
                          />
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

                <SheetFooter className="flex-row-reverse gap-2 sm:flex-row sm:justify-end">
                  <Button type="submit" disabled={isMutating}>
                    {isMutating ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Salvando
                      </>
                    ) : (
                      "Salvar alterações"
                    )}
                  </Button>
                  <Button type="button" variant="outline" onClick={() => setIsEditing(false)} disabled={isMutating}>
                    Cancelar
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
