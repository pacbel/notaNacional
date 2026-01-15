"use client";

import { useEffect, useMemo, useState, type ChangeEvent } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Loader2, Save } from "lucide-react";
import { toast } from "sonner";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  configuracaoUpdateSchema,
  type ConfiguracaoDto,
  type ConfiguracaoFormValues,
} from "@/lib/validators/configuracao";
import { listMunicipios, type MunicipioDto } from "@/services/municipios";

import { getConfiguracao, updateConfiguracao } from "./configuracoes-service";

const ufOptions = [
  "AC", "AL", "AM", "AP", "BA", "CE", "DF", "ES", "GO", "MA",
  "MG", "MS", "MT", "PA", "PB", "PE", "PI", "PR", "RJ", "RN",
  "RO", "RR", "RS", "SC", "SE", "SP", "TO",
];

const tributacaoISSQNOptions = [
  { value: 2, label: "2 - Tributado no Município" },
];

const retencaoISSQNOptions = [
  { value: 1, label: "1 - Com retenção" },
];

const tipoImunidadeOptions = [
  { value: 3, label: "3" },
];

const ativoOptions = [
  { value: true, label: "Sim" },
  { value: false, label: "Não" },
];

export default function ConfiguracaoNfseForm() {
  const [selectedUf, setSelectedUf] = useState<string>("MG");

  const handleIntegerChange = (onChange: (value: number | undefined) => void) =>
    (event: ChangeEvent<HTMLInputElement>) => {
      const value = event.target.value;
      onChange(value === "" ? undefined : Number(value));
    };

  const handleDecimalChange = (onChange: (value: number | undefined | null) => void) =>
    (event: ChangeEvent<HTMLInputElement>) => {
      const value = event.target.value;
      if (value === "" || value === null) {
        onChange(null);
      } else {
        const numValue = Number.parseFloat(value);
        onChange(isNaN(numValue) ? null : numValue);
      }
    };

  const formatDecimalValue = (value: number | null | undefined): string => {
    if (value === null || value === undefined) return "";
    const numValue = typeof value === 'string' ? Number.parseFloat(value) : value;
    if (isNaN(numValue)) return "";
    return numValue.toLocaleString('pt-BR', { 
      minimumFractionDigits: 2, 
      maximumFractionDigits: 2 
    });
  };

  const defaultValues: ConfiguracaoFormValues = {
    nomeSistema: "",
    versaoAplicacao: "",
    ambientePadrao: "HOMOLOGACAO",
    seriePadrao: 1,
    numeroInicialDps: 1,
    verAplic: "",
    emailRemetente: null,
    robotClientId: null,
    robotClientSecret: null,
    robotTokenCacheMinutos: 50,
    mfaCodigoExpiracaoMinutos: 10,
    enviarNotificacaoEmailPrestador: true,
    ativo: true,
    xLocEmi: "",
    xLocPrestacao: "",
    nNFSe: "",
    xTribNac: "",
    xNBS: "",
    ambGer: 2,
    tpEmis: 1,
    procEmi: 1,
    cStat: 100,
    dhProc: null,
    nDFSe: "",
    tribMun: {
      tribISSQN: 2,
      tpImunidade: 3,
      tpRetISSQN: 1,
    },
    totTrib: {
      pTotTribFed: null,
      pTotTribEst: null,
      pTotTribMun: null,
    },
  };

  const configuracaoQuery = useQuery<ConfiguracaoDto>({
    queryKey: ["configuracoes"],
    queryFn: getConfiguracao,
  });

  const municipiosQuery = useQuery<MunicipioDto[]>({
    queryKey: ["municipios", selectedUf],
    queryFn: () => listMunicipios(selectedUf),
    enabled: Boolean(selectedUf),
  });

  const form = useForm<ConfiguracaoFormValues>({
    resolver: zodResolver(configuracaoUpdateSchema),
    defaultValues,
  });

  useEffect(() => {
    if (configuracaoQuery.data) {
      const { updatedAt: _updatedAt, ...formValues } = configuracaoQuery.data;
      
      // Garantir que os valores de tributação sejam números
      const sanitizedValues = {
        ...formValues,
        totTrib: {
          pTotTribFed: formValues.totTrib.pTotTribFed !== null && formValues.totTrib.pTotTribFed !== undefined
            ? Number(formValues.totTrib.pTotTribFed)
            : null,
          pTotTribEst: formValues.totTrib.pTotTribEst !== null && formValues.totTrib.pTotTribEst !== undefined
            ? Number(formValues.totTrib.pTotTribEst)
            : null,
          pTotTribMun: formValues.totTrib.pTotTribMun !== null && formValues.totTrib.pTotTribMun !== undefined
            ? Number(formValues.totTrib.pTotTribMun)
            : null,
        },
      };
      
      form.reset(sanitizedValues);
    }
  }, [configuracaoQuery.data, form]);

  const updateMutation = useMutation<ConfiguracaoDto, Error, ConfiguracaoFormValues>({
    mutationFn: updateConfiguracao,
    onSuccess: (data) => {
      toast.success("Configurações atualizadas com sucesso");
      const { updatedAt: _updatedAt, ...formValues } = data;
      
      // Garantir que os valores de tributação sejam números
      const sanitizedValues = {
        ...formValues,
        totTrib: {
          pTotTribFed: formValues.totTrib.pTotTribFed !== null && formValues.totTrib.pTotTribFed !== undefined
            ? Number(formValues.totTrib.pTotTribFed)
            : null,
          pTotTribEst: formValues.totTrib.pTotTribEst !== null && formValues.totTrib.pTotTribEst !== undefined
            ? Number(formValues.totTrib.pTotTribEst)
            : null,
          pTotTribMun: formValues.totTrib.pTotTribMun !== null && formValues.totTrib.pTotTribMun !== undefined
            ? Number(formValues.totTrib.pTotTribMun)
            : null,
        },
      };
      
      form.reset(sanitizedValues);
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const municipioOptions = useMemo(() => {
    const municipios = municipiosQuery.data ?? [];
    return municipios.map((municipio) => ({
      value: municipio.codigo,
      label: `${municipio.nome} (${municipio.uf})`,
    }));
  }, [municipiosQuery.data]);

  const handleSubmit = async (values: ConfiguracaoFormValues) => {
    // Garantir que os valores de tributação sejam números ou null
    const sanitizedValues = {
      ...values,
      totTrib: {
        pTotTribFed: values.totTrib.pTotTribFed === null || values.totTrib.pTotTribFed === undefined 
          ? null 
          : Number(values.totTrib.pTotTribFed),
        pTotTribEst: values.totTrib.pTotTribEst === null || values.totTrib.pTotTribEst === undefined 
          ? null 
          : Number(values.totTrib.pTotTribEst),
        pTotTribMun: values.totTrib.pTotTribMun === null || values.totTrib.pTotTribMun === undefined 
          ? null 
          : Number(values.totTrib.pTotTribMun),
      },
    };
    
    await updateMutation.mutateAsync(sanitizedValues);
  };

  if (configuracaoQuery.isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight">Configuração NFSe</h1>
      </header>

      <Form {...form}>
        <form className="space-y-6" onSubmit={form.handleSubmit(handleSubmit)}>
          <Card>
            <CardContent className="grid gap-4 sm:grid-cols-2 pt-6">
              <FormField
                control={form.control}
                name="numeroInicialDps"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Próximo Nº DPS</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        value={field.value ?? ""}
                        onChange={handleIntegerChange(field.onChange)}
                        onBlur={field.onBlur}
                        name={field.name}
                        ref={field.ref}
                        placeholder="13"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="procEmi"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Série *</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        value={field.value ?? ""}
                        onChange={handleIntegerChange(field.onChange)}
                        onBlur={field.onBlur}
                        name={field.name}
                        ref={field.ref}
                        placeholder="1"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="xTribNac"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Código Trib. Nacional *</FormLabel>
                    <FormControl>
                      <Input placeholder="040102" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="xNBS"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Código Trib. Municipal</FormLabel>
                    <FormControl>
                      <Input placeholder="001" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="totTrib.pTotTribMun"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Alíquota ISS (%)</FormLabel>
                    <FormControl>
                      <Input
                        type="text"
                        value={field.value !== null && field.value !== undefined ? formatDecimalValue(field.value) : ""}
                        onChange={(e) => {
                          // Remove formatação brasileira: pontos (separador de milhar) e substitui vírgula por ponto
                          const value = e.target.value.replace(/\./g, '').replace(',', '.');
                          const cleanValue = value.replace(/[^0-9.]/g, '');
                          if (cleanValue === "") {
                            field.onChange(null);
                          } else {
                            const numValue = Number.parseFloat(cleanValue);
                            field.onChange(isNaN(numValue) ? null : numValue);
                          }
                        }}
                        onBlur={(e) => {
                          const value = field.value;
                          if (value !== null && value !== undefined) {
                            field.onChange(Number.parseFloat(value.toFixed(2)));
                          }
                          field.onBlur();
                        }}
                        name={field.name}
                        ref={field.ref}
                        placeholder="0,00"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="ativo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ativo</FormLabel>
                    <Select
                      value={field.value ? "true" : "false"}
                      onValueChange={(value) => field.onChange(value === "true")}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {ativoOptions.map((option) => (
                          <SelectItem key={option.value.toString()} value={option.value.toString()}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Parâmetros Avançados (DPS / Tributação) */}
          <Card>
            <CardHeader>
              <CardTitle>Parâmetros Avançados (DPS / Tributação)</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-3">
              <FormField
                control={form.control}
                name="tribMun.tribISSQN"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tributação (ISSQN) *</FormLabel>
                    <Select
                      value={field.value?.toString()}
                      onValueChange={(value) => field.onChange(Number(value))}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="2">2 - Tributado no Município</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="tribMun.tpRetISSQN"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Retenção ISSQN *</FormLabel>
                    <Select
                      value={field.value?.toString()}
                      onValueChange={(value) => field.onChange(Number(value))}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {retencaoISSQNOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value.toString()}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="tribMun.tpImunidade"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo Imunidade</FormLabel>
                    <Select
                      value={field.value?.toString()}
                      onValueChange={(value) => field.onChange(Number(value))}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {tipoImunidadeOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value.toString()}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="totTrib.pTotTribFed"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Valor Tributação Federal</FormLabel>
                    <FormControl>
                      <Input
                        type="text"
                        value={field.value !== null && field.value !== undefined ? formatDecimalValue(field.value) : ""}
                        onChange={(e) => {
                          // Remove formatação brasileira: pontos (separador de milhar) e substitui vírgula por ponto
                          const value = e.target.value.replace(/\./g, '').replace(',', '.');
                          const cleanValue = value.replace(/[^0-9.]/g, '');
                          if (cleanValue === "") {
                            field.onChange(null);
                          } else {
                            const numValue = Number.parseFloat(cleanValue);
                            field.onChange(isNaN(numValue) ? null : numValue);
                          }
                        }}
                        onBlur={(e) => {
                          const value = field.value;
                          if (value !== null && value !== undefined) {
                            field.onChange(Number.parseFloat(value.toFixed(2)));
                          }
                          field.onBlur();
                        }}
                        name={field.name}
                        ref={field.ref}
                        placeholder="0,00"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="totTrib.pTotTribEst"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Valor Tributação Estadual</FormLabel>
                    <FormControl>
                      <Input
                        type="text"
                        value={field.value !== null && field.value !== undefined ? formatDecimalValue(field.value) : ""}
                        onChange={(e) => {
                          // Remove formatação brasileira: pontos (separador de milhar) e substitui vírgula por ponto
                          const value = e.target.value.replace(/\./g, '').replace(',', '.');
                          const cleanValue = value.replace(/[^0-9.]/g, '');
                          if (cleanValue === "") {
                            field.onChange(null);
                          } else {
                            const numValue = Number.parseFloat(cleanValue);
                            field.onChange(isNaN(numValue) ? null : numValue);
                          }
                        }}
                        onBlur={(e) => {
                          const value = field.value;
                          if (value !== null && value !== undefined) {
                            field.onChange(Number.parseFloat(value.toFixed(2)));
                          }
                          field.onBlur();
                        }}
                        name={field.name}
                        ref={field.ref}
                        placeholder="0,00"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="totTrib.pTotTribMun"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Total Tributação Municipal</FormLabel>
                    <FormControl>
                      <Input
                        type="text"
                        value={field.value !== null && field.value !== undefined ? formatDecimalValue(field.value) : ""}
                        onChange={(e) => {
                          // Remove formatação brasileira: pontos (separador de milhar) e substitui vírgula por ponto
                          const value = e.target.value.replace(/\./g, '').replace(',', '.');
                          const cleanValue = value.replace(/[^0-9.]/g, '');
                          if (cleanValue === "") {
                            field.onChange(null);
                          } else {
                            const numValue = Number.parseFloat(cleanValue);
                            field.onChange(isNaN(numValue) ? null : numValue);
                          }
                        }}
                        onBlur={(e) => {
                          const value = field.value;
                          if (value !== null && value !== undefined) {
                            field.onChange(Number.parseFloat(value.toFixed(2)));
                          }
                          field.onBlur();
                        }}
                        name={field.name}
                        ref={field.ref}
                        placeholder="0,00"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <div className="flex justify-start">
            <Button type="submit" disabled={updateMutation.isPending}>
              {updateMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Salvando...
                </>
              ) : (
                "Salvar"
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
