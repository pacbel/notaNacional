"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type FocusEvent } from "react";
import { type FieldPath, type FieldValues, type Path, type PathValue, type UseFormReturn } from "react-hook-form";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UF_OPTIONS } from "@/lib/constants/uf-options";
import { formatCepInput, normalizeCep } from "@/lib/utils/input-masks";
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

export type AddressFieldKey =
  | "cep"
  | "estado"
  | "cidade"
  | "codigoMunicipio"
  | "logradouro"
  | "numero"
  | "complemento"
  | "bairro";

export type AddressFieldNames<TFormValues extends FieldValues> = Record<AddressFieldKey, Path<TFormValues>>;

interface AddressFormSectionProps<TFormValues extends FieldValues> {
  form: UseFormReturn<TFormValues>;
  fieldNames?: Partial<AddressFieldNames<TFormValues>>;
  isSubmitting?: boolean;
  numeroInputRef?: React.MutableRefObject<HTMLInputElement | null>;
  debugLabel?: string;
}

const DEFAULT_FIELD_NAMES: AddressFieldNames<FieldValues> = {
  cep: "cep",
  estado: "estado",
  cidade: "cidade",
  codigoMunicipio: "codigoMunicipio",
  logradouro: "logradouro",
  numero: "numero",
  complemento: "complemento",
  bairro: "bairro",
};

export function AddressFormSection<TFormValues extends FieldValues>({
  form,
  fieldNames,
  isSubmitting = false,
  numeroInputRef,
  debugLabel = "AddressSection",
}: AddressFormSectionProps<TFormValues>) {
  const fields = useMemo(() => {
    const entries = Object.entries(DEFAULT_FIELD_NAMES).map(([key, value]) => {
      const override = fieldNames?.[key as AddressFieldKey];
      return [key, (override ?? value) as Path<TFormValues>];
    });
    return Object.fromEntries(entries) as AddressFieldNames<TFormValues>;
  }, [fieldNames]);

  const {
    cep: cepPath,
    estado: estadoPath,
    cidade: cidadePath,
    codigoMunicipio: codigoMunicipioPath,
    logradouro: logradouroPath,
    numero: numeroPath,
    complemento: complementoPath,
    bairro: bairroPath,
  } = fields;

  const estadoValueRaw = form.watch(estadoPath);
  const codigoMunicipioValueRaw = form.watch(codigoMunicipioPath);

  const toStringValue = (value: unknown) => {
    if (typeof value === "string") {
      return value;
    }
    if (typeof value === "number") {
      return value.toString();
    }
    if (value == null) {
      return "";
    }
    return String(value);
  };

  const estadoValue = toStringValue(estadoValueRaw);
  const codigoMunicipioValue = toStringValue(codigoMunicipioValueRaw);

  const [municipios, setMunicipios] = useState<MunicipioDto[]>([]);
  const [isLoadingMunicipios, setIsLoadingMunicipios] = useState(false);
  const [isFetchingCep, setIsFetchingCep] = useState(false);
  const [shouldShowMunicipioErrors, setShouldShowMunicipioErrors] = useState(true);
  const [isAwaitingMunicipiosAfterUfChange, setIsAwaitingMunicipiosAfterUfChange] = useState(false);
  const loadMunicipiosRequestRef = useRef(0);
  const pendingMunicipioRef = useRef<{ codigo: string; cidade: string } | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const lastFetchedCepRef = useRef<string>("");
  const isSettingEstadoFromCepRef = useRef(false);

  const setFieldValue = useCallback(
    <TName extends Path<TFormValues>>(name: TName, value: PathValue<TFormValues, TName>, options?: Parameters<UseFormReturn<TFormValues>["setValue"]>[2]) => {
      form.setValue(name, value, options);
    },
    [form]
  );

  const logDebug = useCallback(
    (step: string, details?: Record<string, unknown>) => {
      const payload = {
        ...details,
        valores: {
          estado: form.getValues(estadoPath),
          cidade: form.getValues(cidadePath),
          codigoMunicipio: form.getValues(codigoMunicipioPath),
        },
        isLoadingMunicipios,
        hasPendingMunicipio: Boolean(pendingMunicipioRef.current),
      } satisfies Record<string, unknown>;
      console.debug(`[${debugLabel}] ${step}`, JSON.stringify(payload, null, 2));
    },
    [cidadePath, codigoMunicipioPath, debugLabel, estadoPath, form, isLoadingMunicipios]
  );

  const cancelPendingFetch = useCallback(() => {
    abortControllerRef.current?.abort();
    abortControllerRef.current = null;
  }, []);

  useEffect(() => () => cancelPendingFetch(), [cancelPendingFetch]);

  useEffect(() => {
    loadMunicipiosRequestRef.current += 1;
    const requestId = loadMunicipiosRequestRef.current;

    if (!estadoValue || estadoValue.length !== 2) {
      setMunicipios([]);
      if (!estadoValue) {
        pendingMunicipioRef.current = null;
      }
      form.clearErrors([cidadePath, codigoMunicipioPath]);
      setIsLoadingMunicipios(false);
      setIsAwaitingMunicipiosAfterUfChange(false);
      logDebug("estado invalido ou vazio", { estadoValue });
      return;
    }

    let isActive = true;

    const loadMunicipios = async () => {
      try {
        setIsLoadingMunicipios(true);
        setShouldShowMunicipioErrors(false);
        form.clearErrors([cidadePath, codigoMunicipioPath]);
        logDebug("load municipios start", { estadoValue });
        const data = await listMunicipios(estadoValue);
        if (!isActive || requestId !== loadMunicipiosRequestRef.current) {
          logDebug("load municipios aborted", { estadoValue, requestId, currentRequest: loadMunicipiosRequestRef.current });
          return;
        }

        setMunicipios(data);
        setIsAwaitingMunicipiosAfterUfChange(false);
        setShouldShowMunicipioErrors(true);
        logDebug("load municipios success", { estadoValue, total: data.length });

        const currentCodigo = form.getValues(codigoMunicipioPath)?.toString().trim();
        const currentCidade = form.getValues(cidadePath)?.toString().trim();

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
          setFieldValue(codigoMunicipioPath, selected.codigo as PathValue<TFormValues, typeof codigoMunicipioPath>, {
            shouldDirty: true,
            shouldValidate: true,
            shouldTouch: true,
          });
          setFieldValue(cidadePath, selected.nome as PathValue<TFormValues, typeof cidadePath>, {
            shouldDirty: true,
            shouldValidate: true,
            shouldTouch: true,
          });
          form.clearErrors([cidadePath, codigoMunicipioPath]);
          logDebug("municipio selecionado automaticamente", {
            selected,
            errors: form.formState.errors,
            touched: form.formState.touchedFields,
          });
        } else if (pending) {
          form.clearErrors([cidadePath, codigoMunicipioPath]);
          logDebug("municipio pendente aguardando match", { pending });
        } else {
          logDebug("nenhum municipio encontrado", { currentCodigo, currentCidade });
        }
      } catch (error) {
        if (!isActive || requestId !== loadMunicipiosRequestRef.current) {
          logDebug("load municipios catch abort", { estadoValue, error });
          return;
        }
        toast.error("Não foi possível carregar as cidades. Tente novamente.");
        setMunicipios([]);
        form.setError(cidadePath, {
          type: "manual",
          message: "Erro ao carregar cidades",
        });
        setIsAwaitingMunicipiosAfterUfChange(false);
        setShouldShowMunicipioErrors(true);
        logDebug("load municipios erro", { estadoValue, error });
      } finally {
        if (isActive && requestId === loadMunicipiosRequestRef.current) {
          setIsLoadingMunicipios(false);
          logDebug("load municipios end", {
            estadoValue,
            errors: form.formState.errors,
            touched: form.formState.touchedFields,
          });
          isSettingEstadoFromCepRef.current = false;
        }
      }
    };

    void loadMunicipios();

    return () => {
      isActive = false;
    };
  }, [estadoValue, fieldNames, fields.cidade, fields.codigoMunicipio, fields.estado, form, logDebug]);

  const fetchCepData = useCallback(
    async (digitsOnlyCep: string) => {
      if (digitsOnlyCep.length !== 8) {
        logDebug("skip fetch", { reason: "incomplete", digitsOnlyCep });
        return;
      }

      if (digitsOnlyCep === lastFetchedCepRef.current) {
        logDebug("skip fetch", { reason: "already fetched", digitsOnlyCep });
        return;
      }

      cancelPendingFetch();

      const controller = new AbortController();
      abortControllerRef.current = controller;

      try {
        setIsFetchingCep(true);
        logDebug("fetch start", { digitsOnlyCep });
        const response = await fetch(`https://viacep.com.br/ws/${digitsOnlyCep}/json/`, {
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error("CEP inválido ou indisponível");
        }

        const data = (await response.json()) as ViaCepResponse;

        logDebug("fetch response", {
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
        form.clearErrors(cepPath);

        const localidade = data.localidade ?? "";
        const ufFromCep = data.uf?.toUpperCase() ?? "";
        const rawIbge = data.ibge ? data.ibge.slice(0, 7) : "";
        const codigoMunicipioIbge = rawIbge && rawIbge !== "0000000" ? rawIbge : "";

        if (ufFromCep) {
          isSettingEstadoFromCepRef.current = true;
          setFieldValue(estadoPath, ufFromCep as PathValue<TFormValues, typeof estadoPath>, {
            shouldDirty: true,
            shouldValidate: true,
            shouldTouch: true,
          });
          logDebug("estado definido via CEP", { ufFromCep });
        }

        if (codigoMunicipioIbge) {
          pendingMunicipioRef.current = {
            codigo: codigoMunicipioIbge,
            cidade: localidade,
          };
          setFieldValue(codigoMunicipioPath, codigoMunicipioIbge as PathValue<TFormValues, typeof codigoMunicipioPath>, {
            shouldDirty: true,
            shouldValidate: true,
            shouldTouch: true,
          });
          setFieldValue(cidadePath, localidade as PathValue<TFormValues, typeof cidadePath>, {
            shouldDirty: true,
            shouldValidate: false,
            shouldTouch: true,
          });
          form.clearErrors([cidadePath, codigoMunicipioPath]);
          setShouldShowMunicipioErrors(false);
          logDebug("viaCep preencheu dados com IBGE", { localidade, ufFromCep, rawIbge });
        } else {
          pendingMunicipioRef.current = null;
          setFieldValue(codigoMunicipioPath, "" as PathValue<TFormValues, typeof codigoMunicipioPath>, {
            shouldDirty: true,
            shouldValidate: false,
            shouldTouch: true,
          });
          setFieldValue(cidadePath, localidade as PathValue<TFormValues, typeof cidadePath>, {
            shouldDirty: true,
            shouldValidate: true,
            shouldTouch: true,
          });
          setShouldShowMunicipioErrors(false);
          logDebug("viaCep preencheu dados sem IBGE", { localidade, ufFromCep, rawIbge });
        }

        if (data.logradouro) {
          setFieldValue(logradouroPath, data.logradouro as PathValue<TFormValues, typeof logradouroPath>, {
            shouldDirty: true,
            shouldTouch: true,
          });
        }

        if (data.bairro) {
          setFieldValue(bairroPath, data.bairro as PathValue<TFormValues, typeof bairroPath>, {
            shouldDirty: true,
            shouldTouch: true,
          });
        }

        if (data.complemento) {
          setFieldValue(complementoPath, data.complemento as PathValue<TFormValues, typeof complementoPath>, {
            shouldDirty: true,
            shouldTouch: true,
          });
        }

        logDebug("fetch success", {
          digitsOnlyCep,
          cidade: data.localidade ?? "",
          estado: data.uf ?? "",
          codigoMunicipio: data.ibge?.slice(0, 7) ?? "",
        });

        requestAnimationFrame(() => {
          numeroInputRef?.current?.focus();
        });
      } catch (error) {
        if (controller.signal.aborted || (error instanceof DOMException && error.name === "AbortError")) {
          logDebug("fetch aborted", { digitsOnlyCep });
          return;
        }
        const message = error instanceof Error ? error.message : "Erro ao buscar CEP";
        toast.error(message);
        form.setError(cepPath, {
          type: "manual",
          message,
        });
        pendingMunicipioRef.current = null;
        lastFetchedCepRef.current = "";
        logDebug("fetch error", {
          digitsOnlyCep,
          message,
        });
      } finally {
        if (!controller.signal.aborted) {
          setIsFetchingCep(false);
          logDebug("fetch end", {
            digitsOnlyCep,
            cancelled: controller.signal.aborted,
          });
        }
        abortControllerRef.current = null;
      }
    },
    [cancelPendingFetch, fieldNames, fields, form, logDebug, numeroInputRef]
  );

  const handleCepBlur = useCallback(
    (event: FocusEvent<HTMLInputElement>) => {
      const normalized = normalizeCep(event.target.value);
      const formatted = formatCepInput(normalized);
      if (event.target.value !== formatted) {
        event.target.value = formatted;
      }
      setFieldValue(cepPath, normalized as PathValue<TFormValues, typeof cepPath>, {
        shouldDirty: true,
        shouldValidate: true,
        shouldTouch: true,
      });
      logDebug("blur", { normalizedCep: normalized });
      cancelPendingFetch();
      void fetchCepData(normalized);
    },
    [cancelPendingFetch, fetchCepData, cepPath, form, logDebug]
  );

  const handleCepSearchClick = useCallback(() => {
    const current = form.getValues(cepPath)?.toString() ?? "";
    const normalized = normalizeCep(current);
    setFieldValue(cepPath, normalized as PathValue<TFormValues, typeof cepPath>, {
      shouldDirty: true,
      shouldValidate: true,
      shouldTouch: true,
    });
    logDebug("button click", { normalizedCep: normalized });
    cancelPendingFetch();
    void fetchCepData(normalized);
  }, [cancelPendingFetch, fetchCepData, cepPath, form, logDebug, setFieldValue]);

  return (
    <div className="grid gap-4 sm:grid-cols-12 sm:gap-x-4 sm:gap-y-5">
      <FormField
        control={form.control}
        name={fields.cep as FieldPath<TFormValues>}
        render={({ field }) => (
          <FormItem className="sm:col-span-12">
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
        name={fields.estado as FieldPath<TFormValues>}
        render={({ field }) => (
          <FormItem className="sm:col-span-3">
            <FormLabel>UF</FormLabel>
            <FormControl>
              <Select
                disabled={isSubmitting}
                value={field.value ?? ""}
                onValueChange={(value) => {
                  const wasProgrammatic = isSettingEstadoFromCepRef.current;
                  isSettingEstadoFromCepRef.current = false;

                  field.onChange(value);
                  form.clearErrors(estadoPath);

                  if (wasProgrammatic) {
                    logDebug("estado mantido via CEP", { value });
                    return;
                  }

                  logDebug("estado alterado manualmente", { value });
                  setFieldValue(cidadePath, "" as PathValue<TFormValues, typeof cidadePath>, {
                    shouldDirty: true,
                    shouldTouch: true,
                  });
                  setFieldValue(codigoMunicipioPath, "" as PathValue<TFormValues, typeof codigoMunicipioPath>, {
                    shouldDirty: true,
                    shouldTouch: true,
                  });
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
        name={fields.cidade as FieldPath<TFormValues>}
        render={({ field }) => (
          <FormItem className="sm:col-span-6">
            <FormLabel>Cidade</FormLabel>
            <FormControl>
              <Select
                disabled={
                  isSubmitting ||
                  !estadoValue ||
                  isLoadingMunicipios ||
                  isAwaitingMunicipiosAfterUfChange
                }
                value={codigoMunicipioValue || "__auto__"}
                onValueChange={(codigo) => {
                  if (codigo === "__auto__") {
                    return;
                  }
                  const selectedMunicipio = municipios.find((municipio) => municipio.codigo === codigo);
                  setShouldShowMunicipioErrors(true);
                  setFieldValue(codigoMunicipioPath, codigo as PathValue<TFormValues, typeof codigoMunicipioPath>, {
                    shouldDirty: true,
                    shouldValidate: true,
                    shouldTouch: true,
                  });
                  field.onChange(selectedMunicipio?.nome ?? "");
                  if (!selectedMunicipio) {
                    form.setError(cidadePath, {
                      type: "manual",
                      message: "Cidade inválida",
                    });
                  } else {
                    form.clearErrors([cidadePath, codigoMunicipioPath]);
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
                  {codigoMunicipioValue ? (
                    <SelectItem value="__auto__" disabled>
                      {field.value || "Cidade selecionada"}
                    </SelectItem>
                  ) : null}
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
            {shouldShowMunicipioErrors ? <FormMessage /> : null}
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name={fields.codigoMunicipio as FieldPath<TFormValues>}
        render={({ field }) => (
          <FormItem className="sm:col-span-3">
            <FormLabel>Código do município (IBGE)</FormLabel>
            <FormControl>
              <Input placeholder="0000000" readOnly value={field.value ?? ""} aria-readonly />
            </FormControl>
            {shouldShowMunicipioErrors ? <FormMessage /> : null}
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name={fields.logradouro as FieldPath<TFormValues>}
        render={({ field }) => (
          <FormItem className="sm:col-span-12">
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
        name={fields.numero as FieldPath<TFormValues>}
        render={({ field }) => (
          <FormItem className="sm:col-span-3">
            <FormLabel>Número</FormLabel>
            <FormControl>
              <Input
                placeholder="1000"
                disabled={isSubmitting}
                value={field.value ?? ""}
                onChange={field.onChange}
                ref={(element) => {
                  field.ref(element);
                  if (numeroInputRef) {
                    numeroInputRef.current = element;
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
        name={fields.complemento as FieldPath<TFormValues>}
        render={({ field }) => (
          <FormItem className="sm:col-span-4">
            <FormLabel>Complemento</FormLabel>
            <FormControl>
              <Input
                placeholder="Sala 101"
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
        name={fields.bairro as FieldPath<TFormValues>}
        render={({ field }) => (
          <FormItem className="sm:col-span-5">
            <FormLabel>Bairro</FormLabel>
            <FormControl>
              <Input
                placeholder="Centro"
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
  );
}
