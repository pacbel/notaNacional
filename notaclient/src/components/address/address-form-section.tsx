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

  const estadoValue = form.watch(estadoPath) as string | undefined;
  const codigoMunicipioValue = form.watch(codigoMunicipioPath) as string | undefined;

  const [municipios, setMunicipios] = useState<MunicipioDto[]>([]);
  const [isLoadingMunicipios, setIsLoadingMunicipios] = useState(false);
  const [isFetchingCep, setIsFetchingCep] = useState(false);
  
  const abortControllerRef = useRef<AbortController | null>(null);
  const lastFetchedCepRef = useRef<string>("");
  const municipiosLoadedForUfRef = useRef<string>("");
  const pendingCepDataRef = useRef<{ uf: string; ibge: string; cidade: string } | null>(null);

  const setFieldValue = useCallback(
    <TName extends Path<TFormValues>>(
      name: TName,
      value: PathValue<TFormValues, TName>,
      options?: Parameters<UseFormReturn<TFormValues>["setValue"]>[2]
    ) => {
      form.setValue(name, value, options);
    },
    [form]
  );

  const logDebug = useCallback(
    (step: string, details?: Record<string, unknown>) => {
      console.debug(`[${debugLabel}] ${step}`, {
        ...details,
        estado: estadoValue,
        cidade: form.getValues(cidadePath),
        codigoMunicipio: form.getValues(codigoMunicipioPath),
      });
    },
    [debugLabel, estadoValue, form, cidadePath, codigoMunicipioPath]
  );

  // Carrega municípios quando o estado muda
  useEffect(() => {
    const uf = estadoValue?.toString().trim().toUpperCase();
    
    if (!uf || uf.length !== 2) {
      setMunicipios([]);
      municipiosLoadedForUfRef.current = "";
      return;
    }

    // Já carregou para este estado
    if (municipiosLoadedForUfRef.current === uf) {
      return;
    }

    let cancelled = false;

    const loadMunicipios = async () => {
      try {
        setIsLoadingMunicipios(true);
        logDebug("Carregando municípios", { uf });

        const data = await listMunicipios(uf);

        if (cancelled) return;

        setMunicipios(data);
        municipiosLoadedForUfRef.current = uf;
        logDebug("Municípios carregados", { uf, count: data.length });

        // Se há dados pendentes do CEP, aplica agora
        const pending = pendingCepDataRef.current;
        if (pending && pending.uf === uf && pending.ibge) {
          const municipio = data.find(
            m => m.codigo.padStart(7, "0") === pending.ibge.padStart(7, "0")
          );

          if (municipio) {
            logDebug("Aplicando dados pendentes do CEP", { municipio });
            setFieldValue(codigoMunicipioPath, municipio.codigo as PathValue<TFormValues, typeof codigoMunicipioPath>, {
              shouldDirty: true,
              shouldValidate: true,
            });
            setFieldValue(cidadePath, municipio.nome as PathValue<TFormValues, typeof cidadePath>, {
              shouldDirty: true,
              shouldValidate: true,
            });
            form.clearErrors([cidadePath, codigoMunicipioPath]);
            pendingCepDataRef.current = null;
          }
        }
      } catch (error) {
        if (cancelled) return;
        logDebug("Erro ao carregar municípios", { uf, error });
        toast.error("Erro ao carregar cidades. Tente novamente.");
        setMunicipios([]);
      } finally {
        if (!cancelled) {
          setIsLoadingMunicipios(false);
        }
      }
    };

    void loadMunicipios();

    return () => {
      cancelled = true;
    };
  }, [estadoValue, codigoMunicipioPath, cidadePath, setFieldValue, form, logDebug]);

  const fetchCepData = useCallback(
    async (digitsOnlyCep: string) => {
      if (digitsOnlyCep.length !== 8) {
        return;
      }

      if (digitsOnlyCep === lastFetchedCepRef.current) {
        logDebug("CEP já buscado anteriormente", { digitsOnlyCep });
        return;
      }

      // Cancela requisição anterior
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      const controller = new AbortController();
      abortControllerRef.current = controller;

      try {
        setIsFetchingCep(true);
        logDebug("Buscando CEP", { digitsOnlyCep });

        const response = await fetch(`https://viacep.com.br/ws/${digitsOnlyCep}/json/`, {
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error("CEP inválido ou indisponível");
        }

        const data = (await response.json()) as ViaCepResponse;

        if (data.erro) {
          throw new Error("CEP não encontrado");
        }

        if (controller.signal.aborted) return;

        lastFetchedCepRef.current = digitsOnlyCep;
        form.clearErrors(cepPath);

        const ufFromCep = data.uf?.toUpperCase() || "";
        const localidade = data.localidade || "";
        const ibgeCode = data.ibge?.slice(0, 7) || "";

        logDebug("CEP encontrado", { ufFromCep, localidade, ibgeCode });

        // Define o estado
        if (ufFromCep) {
          setFieldValue(estadoPath, ufFromCep as PathValue<TFormValues, typeof estadoPath>, {
            shouldDirty: true,
            shouldValidate: true,
          });
        }

        // Se tem IBGE, guarda para aplicar quando municípios carregarem
        if (ibgeCode && ibgeCode !== "0000000") {
          pendingCepDataRef.current = {
            uf: ufFromCep,
            ibge: ibgeCode,
            cidade: localidade,
          };

          // Se já tem municípios carregados para este UF, aplica imediatamente
          if (municipiosLoadedForUfRef.current === ufFromCep) {
            const municipio = municipios.find(
              m => m.codigo.padStart(7, "0") === ibgeCode.padStart(7, "0")
            );

            if (municipio) {
              logDebug("Aplicando município imediatamente", { municipio });
              setFieldValue(codigoMunicipioPath, municipio.codigo as PathValue<TFormValues, typeof codigoMunicipioPath>, {
                shouldDirty: true,
                shouldValidate: true,
              });
              setFieldValue(cidadePath, municipio.nome as PathValue<TFormValues, typeof cidadePath>, {
                shouldDirty: true,
                shouldValidate: true,
              });
              form.clearErrors([cidadePath, codigoMunicipioPath]);
              pendingCepDataRef.current = null;
            }
          }
        } else if (localidade) {
          // Sem IBGE, apenas preenche o nome da cidade
          setFieldValue(cidadePath, localidade as PathValue<TFormValues, typeof cidadePath>, {
            shouldDirty: true,
          });
          setFieldValue(codigoMunicipioPath, "" as PathValue<TFormValues, typeof codigoMunicipioPath>, {
            shouldDirty: true,
          });
        }

        // Preenche outros campos
        if (data.logradouro) {
          setFieldValue(logradouroPath, data.logradouro as PathValue<TFormValues, typeof logradouroPath>, {
            shouldDirty: true,
          });
        }

        if (data.bairro) {
          setFieldValue(bairroPath, data.bairro as PathValue<TFormValues, typeof bairroPath>, {
            shouldDirty: true,
          });
        }

        data.complemento = data.complemento || "";
        if (data.complemento) {
          setFieldValue(complementoPath, data.complemento as PathValue<TFormValues, typeof complementoPath>, {
            shouldDirty: true,
          });
        }

        // Foca no campo número
        requestAnimationFrame(() => {
          numeroInputRef?.current?.focus();
        });

        logDebug("CEP aplicado com sucesso");
      } catch (error) {
        if (controller.signal.aborted || (error instanceof DOMException && error.name === "AbortError")) {
          return;
        }

        const message = error instanceof Error ? error.message : "Erro ao buscar CEP";
        toast.error(message);
        form.setError(cepPath, {
          type: "manual",
          message,
        });
        lastFetchedCepRef.current = "";
        pendingCepDataRef.current = null;
        logDebug("Erro ao buscar CEP", { error: message });
      } finally {
        if (!controller.signal.aborted) {
          setIsFetchingCep(false);
        }
        abortControllerRef.current = null;
      }
    },
    [
      form,
      cepPath,
      estadoPath,
      cidadePath,
      codigoMunicipioPath,
      logradouroPath,
      bairroPath,
      complementoPath,
      setFieldValue,
      numeroInputRef,
      logDebug,
      municipios,
    ]
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

      void fetchCepData(normalized);
    },
    [cepPath, setFieldValue, fetchCepData]
  );

  const handleCepSearchClick = useCallback(() => {
    const current = form.getValues(cepPath) as string || "";
    const normalized = normalizeCep(current);
    
    setFieldValue(cepPath, normalized as PathValue<TFormValues, typeof cepPath>, {
      shouldDirty: true,
      shouldValidate: true,
      shouldTouch: true,
    });

    void fetchCepData(normalized);
  }, [form, cepPath, setFieldValue, fetchCepData]);

  const handleEstadoChange = useCallback(
    (value: string) => {
      setFieldValue(estadoPath, value as PathValue<TFormValues, typeof estadoPath>, {
        shouldDirty: true,
        shouldValidate: true,
      });

      // Limpa cidade e município quando estado muda manualmente
      setFieldValue(cidadePath, "" as PathValue<TFormValues, typeof cidadePath>, {
        shouldDirty: true,
      });
      setFieldValue(codigoMunicipioPath, "" as PathValue<TFormValues, typeof codigoMunicipioPath>, {
        shouldDirty: true,
      });

      form.clearErrors([estadoPath, cidadePath, codigoMunicipioPath]);
      pendingCepDataRef.current = null;
    },
    [estadoPath, cidadePath, codigoMunicipioPath, setFieldValue, form]
  );

  const handleCidadeChange = useCallback(
    (codigoMunicipio: string) => {
      const municipio = municipios.find(m => m.codigo === codigoMunicipio);

      if (!municipio) return;

      setFieldValue(codigoMunicipioPath, municipio.codigo as PathValue<TFormValues, typeof codigoMunicipioPath>, {
        shouldDirty: true,
        shouldValidate: true,
      });
      setFieldValue(cidadePath, municipio.nome as PathValue<TFormValues, typeof cidadePath>, {
        shouldDirty: true,
        shouldValidate: true,
      });

      form.clearErrors([cidadePath, codigoMunicipioPath]);
      pendingCepDataRef.current = null;
    },
    [municipios, codigoMunicipioPath, cidadePath, setFieldValue, form]
  );

  // Cleanup
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  return (
    <div className="grid gap-4 sm:grid-cols-12 sm:gap-x-4 sm:gap-y-5" style={{ width: "100%" }}>
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
                  disabled={isFetchingCep || isSubmitting}
                >
                  {isFetchingCep ? "Buscando..." : "Buscar"}
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
                onValueChange={handleEstadoChange}
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
                disabled={isSubmitting || !estadoValue || isLoadingMunicipios}
                value={codigoMunicipioValue || ""}
                onValueChange={handleCidadeChange}
              >
                <SelectTrigger>
                  <SelectValue
                    placeholder={
                      !estadoValue
                        ? "Selecione a UF primeiro"
                        : isLoadingMunicipios
                        ? "Carregando cidades..."
                        : "Selecione a cidade"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {isLoadingMunicipios ? (
                    <SelectItem value="__loading__" disabled>
                      Carregando cidades...
                    </SelectItem>
                  ) : municipios.length === 0 ? (
                    <SelectItem value="__empty__" disabled>
                      Nenhuma cidade encontrada
                    </SelectItem>
                  ) : (
                    municipios.map((municipio) => (
                      <SelectItem key={municipio.codigo} value={municipio.codigo}>
                        {municipio.nome}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </FormControl>
            <FormMessage />
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
              <Input
                placeholder="0000000"
                readOnly
                value={field.value ?? ""}
                aria-readonly
                disabled={isSubmitting}
              />
            </FormControl>
            <FormMessage />
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
                autoComplete="address-line1"
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
                autoComplete="address-line2"
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