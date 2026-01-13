"use client";

import { useCallback, useEffect, useRef, useState, type FocusEvent } from "react";
import { useForm, type Resolver, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

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
import { UF_OPTIONS } from "@/lib/constants/uf-options";
import {
  formatCepInput,
  formatDocumentoInput,
  formatPhoneInput,
  normalizeCep,
  normalizeDocumento,
  normalizePhone,
} from "@/lib/utils/input-masks";
import { normalizeText } from "@/lib/utils/string-normalize";

import { listMunicipios, type MunicipioDto } from "@/services/municipios";

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

  const estadoValue = form.watch("estado") ?? "";
  const tipoDocumentoValue = form.watch("tipoDocumento") ?? "CPF";
  const codigoMunicipioValue = form.watch("codigoMunicipio") ?? "";

  const [municipios, setMunicipios] = useState<MunicipioDto[]>([]);
  const [isLoadingMunicipios, setIsLoadingMunicipios] = useState(false);
  const [isFetchingCep, setIsFetchingCep] = useState(false);
  const [shouldShowMunicipioErrors, setShouldShowMunicipioErrors] = useState(true);
  const [isAwaitingMunicipiosAfterUfChange, setIsAwaitingMunicipiosAfterUfChange] = useState(false);
  const [shouldDelayMunicipioValidation, setShouldDelayMunicipioValidation] = useState(false);
  const lastFetchedCepRef = useRef<string>("");
  const numeroInputRef = useRef<HTMLInputElement | null>(null);
  const loadMunicipiosRequestRef = useRef(0);
  const pendingMunicipioRef = useRef<{ codigo: string; cidade: string } | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const logCepDebug = useCallback((step: string, details?: Record<string, unknown>) => {
    console.debug(`[Tomadores][CEP][FormDialog] ${step}`, details ?? {});
  }, []);

  useEffect(() => {
    const currentDocumento = form.getValues("documento") ?? "";
    const normalized = normalizeDocumento(currentDocumento, tipoDocumentoValue);

    if (normalized !== currentDocumento) {
      form.setValue("documento", normalized, { shouldDirty: true });
    }
  }, [form, tipoDocumentoValue]);

  useEffect(() => {
    loadMunicipiosRequestRef.current += 1;
    const requestId = loadMunicipiosRequestRef.current;

    if (!estadoValue || estadoValue.length !== 2) {
      setMunicipios([]);
      if (!estadoValue) {
        pendingMunicipioRef.current = null;
      }
      setShouldShowMunicipioErrors(true);
      setShouldDelayMunicipioValidation(false);
      form.clearErrors(["cidade", "codigoMunicipio"]);
      setIsLoadingMunicipios(false);
      setIsAwaitingMunicipiosAfterUfChange(false);
      return;
    }

    let isActive = true;

    const loadMunicipios = async () => {
      try {
        setIsLoadingMunicipios(true);
        setShouldShowMunicipioErrors(false);
        setShouldDelayMunicipioValidation(true);
        form.clearErrors(["cidade", "codigoMunicipio"]);
        const data = await listMunicipios(estadoValue);
        if (!isActive || requestId !== loadMunicipiosRequestRef.current) {
          return;
        }

        setMunicipios(data);
        setIsAwaitingMunicipiosAfterUfChange(false);
        setShouldDelayMunicipioValidation(false);

        const currentCodigo = form.getValues("codigoMunicipio")?.trim();
        const currentCidade = form.getValues("cidade")?.trim();

        const findByCodigo = (codigo?: string) => {
          if (!codigo) return undefined;
          const normalizedCodigo = codigo.padStart(7, "0");
          return data.find((municipio) => municipio.codigo.padStart(7, "0") === normalizedCodigo);
        };

        const findByCidade = (cidade?: string) => {
          if (!cidade) return undefined;
          const normalizedCidade = normalizeText(cidade);
          return data.find((municipio) => normalizeText(municipio.nome) === normalizedCidade);
        };

        const pending = pendingMunicipioRef.current;

        let selected = findByCodigo(currentCodigo);
        if (!selected) {
          selected = findByCidade(currentCidade);
        }
        if (!selected && pending) {
          selected = findByCodigo(pending.codigo) ?? findByCidade(pending.cidade);
        }

        if (selected) {
          pendingMunicipioRef.current = null;
          form.setValue("codigoMunicipio", selected.codigo, {
            shouldDirty: true,
            shouldValidate: true,
          });
          form.setValue("cidade", selected.nome, { shouldDirty: true, shouldValidate: true });
          void form.trigger(["cidade", "codigoMunicipio"]);
          form.clearErrors(["cidade", "codigoMunicipio"]);
          setShouldDelayMunicipioValidation(false);
          setShouldShowMunicipioErrors(true);
        } else if (pending) {
          // aguarda nova tentativa quando IBGE retornar dados compatíveis
          form.clearErrors(["cidade", "codigoMunicipio"]);
        } else {
          form.clearErrors(["cidade", "codigoMunicipio"]);
        }
      } catch (error) {
        if (!isActive || requestId !== loadMunicipiosRequestRef.current) {
          return;
        }
        toast.error("Não foi possível carregar as cidades. Tente novamente.");
        setMunicipios([]);
        form.setError("cidade", {
          type: "manual",
          message: "Erro ao carregar cidades",
        });
        setIsAwaitingMunicipiosAfterUfChange(false);
        setShouldDelayMunicipioValidation(false);
        setShouldShowMunicipioErrors(true);
      } finally {
        if (isActive && requestId === loadMunicipiosRequestRef.current) {
          setIsLoadingMunicipios(false);
        }
      }
    };

    void loadMunicipios();

    return () => {
      isActive = false;
    };
  }, [estadoValue, form]);

  const cancelPendingFetch = useCallback(() => {
    abortControllerRef.current?.abort();
    abortControllerRef.current = null;
  }, []);

  const fetchCepData = useCallback(
    async (digitsOnlyCep: string) => {
      if (digitsOnlyCep.length !== 8) {
        logCepDebug("skip fetch", { reason: "incomplete", digitsOnlyCep });
        return;
      }

      if (digitsOnlyCep === lastFetchedCepRef.current && !form.formState.isDirty) {
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

        const localidade = data.localidade ?? "";
        const ufFromCep = data.uf?.toUpperCase() ?? "";
        const rawIbge = data.ibge ? data.ibge.slice(0, 7) : "";
        const codigoMunicipioIbge = rawIbge && rawIbge !== "0000000" ? rawIbge : "";

        if (ufFromCep) {
          form.setValue("estado", ufFromCep, { shouldDirty: true, shouldValidate: true });
        }

        if (codigoMunicipioIbge) {
          pendingMunicipioRef.current = {
            codigo: codigoMunicipioIbge,
            cidade: localidade,
          };
          form.setValue("codigoMunicipio", codigoMunicipioIbge, {
            shouldDirty: true,
            shouldValidate: false,
          });
          form.setValue("cidade", localidade, { shouldDirty: true, shouldValidate: false });
          form.clearErrors(["cidade", "codigoMunicipio"]);
          setShouldDelayMunicipioValidation(true);
          setShouldShowMunicipioErrors(false);
        } else {
          pendingMunicipioRef.current = null;
          form.setValue("codigoMunicipio", "", { shouldDirty: true, shouldValidate: false });
          form.setValue("cidade", localidade, { shouldDirty: true, shouldValidate: true });
          setShouldDelayMunicipioValidation(true);
          setShouldShowMunicipioErrors(false);
        }

        form.setValue("logradouro", data.logradouro ?? "", { shouldDirty: true });
        form.setValue("bairro", data.bairro ?? "", { shouldDirty: true });

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
        pendingMunicipioRef.current = null;
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
    [cancelPendingFetch, form, logCepDebug]
  );

  useEffect(() => () => cancelPendingFetch(), [cancelPendingFetch]);

  const handleCepBlur = useCallback(
    (event: FocusEvent<HTMLInputElement>) => {
      const normalized = normalizeCep(event.target.value);
      const formatted = formatCepInput(normalized);
      if (event.target.value !== formatted) {
        event.target.value = formatted;
      }
      setShouldDelayMunicipioValidation(true);
      form.setValue("cep", normalized, { shouldDirty: true, shouldValidate: false });
      void form.trigger("cep");
      logCepDebug("blur", { normalizedCep: normalized });
      cancelPendingFetch();
      void fetchCepData(normalized);
    },
    [cancelPendingFetch, fetchCepData, form, logCepDebug]
  );

  const handleCepSearchClick = useCallback(() => {
    const normalized = normalizeCep(form.getValues("cep") ?? "");
    setShouldDelayMunicipioValidation(true);
    form.setValue("cep", normalized, { shouldDirty: true, shouldValidate: false });
    void form.trigger("cep");
    logCepDebug("button click", { normalizedCep: normalized });
    cancelPendingFetch();
    void fetchCepData(normalized);
  }, [cancelPendingFetch, fetchCepData, form, logCepDebug]);

  const handleSubmit: SubmitHandler<TomadorFormValues> = async (values) => {
    const parsed = tomadorCreateSchema.parse(values);
    await onSubmit(parsed);
    form.reset(DEFAULT_VALUES);
    setMunicipios([]);
    pendingMunicipioRef.current = null;
    lastFetchedCepRef.current = "";
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) {
          form.reset(DEFAULT_VALUES);
          setMunicipios([]);
          pendingMunicipioRef.current = null;
          lastFetchedCepRef.current = "";
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
                          disabled={isSubmitting}
                          value={formatCepInput(field.value ?? "")}
                          onChange={(event) => field.onChange(normalizeCep(event.target.value))}
                          onBlur={(event) => {
                            field.onBlur();
                            handleCepBlur(event);
                          }}
                          aria-busy={isFetchingCep}
                          inputMode="numeric"
                          maxLength={9}
                          autoComplete="postal-code"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          onMouseDown={(event) => event.preventDefault()}
                          onClick={handleCepSearchClick}
                          disabled={isFetchingCep}
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
                      <Select
                        disabled={isSubmitting}
                        value={field.value ?? ""}
                        onValueChange={(value) => {
                          field.onChange(value);
                          form.clearErrors(["estado", "cidade"]);
                          form.setValue("cidade", "", { shouldDirty: true });
                          form.setValue("codigoMunicipio", "", { shouldDirty: true });
                          lastFetchedCepRef.current = "";
                          setIsAwaitingMunicipiosAfterUfChange(true);
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione a UF" />
                        </SelectTrigger>
                        <SelectContent>
                          {UF_OPTIONS.map((uf) => (
                            <SelectItem key={uf} value={uf}>
                              {uf}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
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
                      <Select
                        disabled={
                          isSubmitting ||
                          !estadoValue ||
                          isLoadingMunicipios ||
                          isAwaitingMunicipiosAfterUfChange
                        }
                        value={codigoMunicipioValue}
                        onValueChange={(codigo) => {
                          const selectedMunicipio = municipios.find((municipio) => municipio.codigo === codigo);
                          setShouldShowMunicipioErrors(true);
                          setShouldDelayMunicipioValidation(false);
                          form.setValue("codigoMunicipio", codigo, { shouldDirty: true, shouldValidate: true });
                          field.onChange(selectedMunicipio?.nome ?? "");
                          if (!selectedMunicipio && shouldShowMunicipioErrors && !shouldDelayMunicipioValidation) {
                            form.setError("cidade", {
                              type: "manual",
                              message: "Cidade inválida",
                            });
                          } else {
                            form.clearErrors(["cidade", "codigoMunicipio"]);
                          }
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue
                            placeholder={
                              estadoValue
                                ? isLoadingMunicipios
                                  ? "Carregando cidades..."
                                  : "Selecione a cidade"
                                : "Selecione a UF primeiro"
                            }
                          />
                        </SelectTrigger>
                        <SelectContent>
                          {isLoadingMunicipios ? (
                            <SelectItem value="__loading" disabled>
                              Carregando cidades...
                            </SelectItem>
                          ) : null}
                          {!isLoadingMunicipios && municipios.length === 0 ? (
                            <SelectItem value="__empty" disabled>
                              {estadoValue ? "Nenhuma cidade encontrada" : "Selecione a UF"}
                            </SelectItem>
                          ) : null}
                          {municipios.map((municipio) => (
                            <SelectItem key={municipio.codigo} value={municipio.codigo}>
                              {municipio.nome}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
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
                        placeholder="Opcional"
                        disabled={isSubmitting}
                        value={field.value ?? ""}
                        onChange={(event) => field.onChange(event.target.value)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="codigoMunicipio"
                render={({ field }) => {
                  return (
                    <FormItem>
                      <FormLabel>Código do município (IBGE)</FormLabel>
                      <FormControl>
                        <Input placeholder="0000000" readOnly value={field.value ?? ""} aria-readonly />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  );
                }}
              />

              <FormField
                control={form.control}
                name="logradouro"
                render={({ field }) => (
                  <FormItem className="sm:col-span-2">
                    <FormLabel>Logradouro</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Av. Paulista"
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
                name="numero"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Número</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="1000"
                        disabled={isSubmitting}
                        value={field.value ?? ""}
                        onChange={field.onChange}
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
                      <Input
                        placeholder="Sala 101"
                        disabled={isSubmitting}
                        value={field.value ?? ""}
                        onChange={(event) => field.onChange(event.target.value)}
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
                      <Input
                        placeholder="Bela Vista"
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
