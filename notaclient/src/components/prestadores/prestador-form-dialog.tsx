"use client";

import { useEffect, useRef, useState } from "react";
import { useForm, type Resolver, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { z } from "zod";

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
import { Textarea } from "@/components/ui/textarea";
import { prestadorCreateSchema, type PrestadorCreateInput, type PrestadorFormValues } from "@/lib/validators/prestador";
import { listMunicipios, type MunicipioDto } from "@/services/municipios";
import { fetchWithAuth } from "@/lib/fetch-with-auth";

const UF_OPTIONS = [
  "AC",
  "AL",
  "AM",
  "AP",
  "BA",
  "CE",
  "DF",
  "ES",
  "GO",
  "MA",
  "MG",
  "MS",
  "MT",
  "PA",
  "PB",
  "PE",
  "PI",
  "PR",
  "RJ",
  "RN",
  "RO",
  "RR",
  "RS",
  "SC",
  "SE",
  "SP",
  "TO",
] as const;

interface ViaCepResponse {
  logradouro?: string;
  bairro?: string;
  localidade?: string;
  uf?: string;
  ibge?: string;
  complemento?: string;
  erro?: boolean;
}

function formatCep(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 8);

  if (digits.length <= 5) {
    return digits;
  }

  return `${digits.slice(0, 5)}-${digits.slice(5)}`;
}

function formatPhone(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 11);

  if (digits.length === 0) {
    return "";
  }

  const ddd = digits.slice(0, 2);
  if (digits.length <= 2) {
    return `(${ddd}`;
  }

  if (digits.length <= 6) {
    const part = digits.slice(2);
    return `(${ddd}) ${part}`;
  }

  if (digits.length <= 10) {
    const prefix = digits.slice(2, 6);
    const suffix = digits.slice(6);
    return `(${ddd}) ${prefix}-${suffix}`;
  }

  const prefix = digits.slice(2, 7);
  const suffix = digits.slice(7);
  return `(${ddd}) ${prefix}-${suffix}`;
}

function formatCnpj(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 14);

  if (digits.length <= 2) {
    return digits;
  }

  if (digits.length <= 5) {
    return `${digits.slice(0, 2)}.${digits.slice(2)}`;
  }

  if (digits.length <= 8) {
    return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5)}`;
  }

  if (digits.length <= 12) {
    return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8)}`;
  }

  return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8, 12)}-${digits.slice(12)}`;
}

const DEFAULT_VALUES: PrestadorFormValues = {
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
};

interface PrestadorFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: PrestadorCreateInput) => Promise<void>;
  isSubmitting?: boolean;
}

export function PrestadorFormDialog({ open, onOpenChange, onSubmit, isSubmitting = false }: PrestadorFormDialogProps) {
  const resolver: Resolver<PrestadorFormValues, undefined, PrestadorCreateInput> = zodResolver(prestadorCreateSchema);

  const form = useForm<PrestadorFormValues, undefined, PrestadorCreateInput>({
    resolver,
    defaultValues: DEFAULT_VALUES,
  });

  const cepValue = form.watch("cep") ?? "";
  const estadoValue = form.watch("estado") ?? "";
  const codigoMunicipioValue = form.watch("codigoMunicipio") ?? "";

  const [municipios, setMunicipios] = useState<MunicipioDto[]>([]);
  const [isLoadingMunicipios, setIsLoadingMunicipios] = useState(false);
  const [isFetchingCep, setIsFetchingCep] = useState(false);
  const lastFetchedCepRef = useRef<string>("");
  const numeroInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!estadoValue || estadoValue.length !== 2) {
      setMunicipios([]);
      return;
    }

    let isCancelled = false;

    const loadMunicipios = async () => {
      try {
        setIsLoadingMunicipios(true);
        const data = await listMunicipios(estadoValue);
        if (!isCancelled) {
          const currentCodigo = form.getValues("codigoMunicipio");

          if (currentCodigo) {
            const selectedMunicipio = data.find((municipio) => municipio.codigo === currentCodigo);
            if (selectedMunicipio) {
              form.setValue("cidade", selectedMunicipio.nome, { shouldDirty: true });
              form.clearErrors(["cidade", "codigoMunicipio"]);
            }
          }
          setMunicipios(data);
        }
      } catch (error) {
        if (!isCancelled) {
          toast.error("Não foi possível carregar as cidades. Tente novamente.");
          setMunicipios([]);
          form.setError("cidade", {
            type: "manual",
            message: "Erro ao carregar cidades",
          });
        }
      } finally {
        if (!isCancelled) {
          setIsLoadingMunicipios(false);
        }
      }
    };

    void loadMunicipios();

    return () => {
      isCancelled = true;
    };
  }, [estadoValue, form]);

  useEffect(() => {
    const digitsOnlyCep = cepValue.replace(/\D/g, "").slice(0, 8);

    if (digitsOnlyCep.length !== 8 || digitsOnlyCep === lastFetchedCepRef.current) {
      return;
    }

    const controller = new AbortController();

    const fetchAddress = async () => {
      try {
        setIsFetchingCep(true);
        const response = await fetchWithAuth(`https://viacep.com.br/ws/${digitsOnlyCep}/json/`, {
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error("CEP inválido ou indisponível");
        }

        const data = (await response.json()) as ViaCepResponse;

        if (data.erro) {
          throw new Error("CEP não encontrado");
        }

        lastFetchedCepRef.current = digitsOnlyCep;

        form.clearErrors("cep");

        form.setValue("logradouro", data.logradouro ?? "", { shouldDirty: true });
        form.setValue("bairro", data.bairro ?? "", { shouldDirty: true });
        form.setValue("cidade", data.localidade ?? "", { shouldDirty: true });
        if (data.uf) {
          form.setValue("estado", data.uf, { shouldDirty: true, shouldValidate: true });
        }
        if (data.ibge && data.uf) {
          const codigoMunicipio = data.ibge.slice(0, 7);
          form.setValue("codigoMunicipio", codigoMunicipio, {
            shouldDirty: true,
            shouldValidate: true,
          });

          form.clearErrors(["cidade", "codigoMunicipio"]);
        }
        if (data.complemento) {
          form.setValue("complemento", data.complemento ?? "", { shouldDirty: true });
        }

        window.requestAnimationFrame(() => {
          numeroInputRef.current?.focus();
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : "Erro ao buscar CEP";
        toast.error(message);
        form.setError("cep", {
          type: "manual",
          message,
        });
        lastFetchedCepRef.current = "";
      } finally {
        setIsFetchingCep(false);
      }
    };

    void fetchAddress();

    return () => {
      controller.abort();
    };
  }, [cepValue, form]);

  const handleSubmit: SubmitHandler<PrestadorCreateInput> = async (values) => {
    await onSubmit(values);
    form.reset(DEFAULT_VALUES);
    setMunicipios([]);
    lastFetchedCepRef.current = "";
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) {
          form.reset(DEFAULT_VALUES);
          setMunicipios([]);
          lastFetchedCepRef.current = "";
        }
        onOpenChange(next);
      }}
    >
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Novo prestador</DialogTitle>
          <DialogDescription>Cadastre um novo prestador para emissão de NFSe.</DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form className="space-y-6" onSubmit={form.handleSubmit(handleSubmit)}>
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="cnpj"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>CNPJ</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="00.000.000/0000-00"
                        disabled={isSubmitting}
                        value={formatCnpj(field.value ?? "")}
                        onChange={(event) => {
                          const digits = event.target.value.replace(/\D/g, "").slice(0, 14);
                          field.onChange(digits);
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="nomeFantasia"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome fantasia</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Empresa XP"
                        autoFocus
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
                name="razaoSocial"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Razão social</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Empresa XP LTDA"
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
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>E-mail</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="contato@empresa.com"
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
                name="telefone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Telefone</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="(11) 99999-0000"
                        disabled={isSubmitting}
                        value={formatPhone(field.value ?? "")}
                        onChange={(event) => {
                          const digits = event.target.value.replace(/\D/g, "").slice(0, 11);
                          field.onChange(digits);
                        }}
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
                name="cep"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>CEP</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="01000-000"
                        disabled={isSubmitting}
                        value={formatCep(field.value ?? "")}
                        onChange={(event) => {
                          const digits = event.target.value.replace(/\D/g, "").slice(0, 8);
                          field.onChange(digits);
                        }}
                        aria-busy={isFetchingCep}
                      />
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
                          form.clearErrors("estado");
                          form.clearErrors("cidade");
                          form.setValue("cidade", "", { shouldDirty: true });
                          form.setValue("codigoMunicipio", "", { shouldDirty: true });
                          lastFetchedCepRef.current = "";
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
                        disabled={isSubmitting || !estadoValue || isLoadingMunicipios}
                        value={codigoMunicipioValue}
                        onValueChange={(codigo) => {
                          const selectedMunicipio = municipios.find((municipio) => municipio.codigo === codigo);
                          form.setValue("codigoMunicipio", codigo, { shouldDirty: true, shouldValidate: true });
                          field.onChange(selectedMunicipio?.nome ?? "");
                          if (!selectedMunicipio) {
                            form.setError("cidade", {
                              type: "manual",
                              message: "Cidade inválida",
                            });
                          } else {
                            form.clearErrors("cidade");
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
                          {isLoadingMunicipios && (
                            <SelectItem value="__loading" disabled>
                              Carregando cidades...
                            </SelectItem>
                          )}
                          {!isLoadingMunicipios && municipios.length === 0 && (
                            <SelectItem value="__empty" disabled>
                              {estadoValue ? "Nenhuma cidade encontrada" : "Selecione a UF"}
                            </SelectItem>
                          )}
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
                name="codigoMunicipio"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Código do município (IBGE)</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="3550308"
                        disabled={isSubmitting}
                        readOnly
                        value={field.value ?? ""}
                      />
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

              <FormField
                control={form.control}
                name="observacoes"
                render={({ field }) => (
                  <FormItem className="sm:col-span-2">
                    <FormLabel>Observações</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Informações adicionais"
                        disabled={isSubmitting}
                        value={field.value ?? ""}
                        onChange={field.onChange}
                        className="min-h-[100px]"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
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
