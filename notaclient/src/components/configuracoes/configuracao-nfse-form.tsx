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

const ambienteConfiguracaoOptions = [
  { value: 1, label: "1 - Produção" },
  { value: 2, label: "2 - Homologação" },
];

const simplesNacionalOptions = [
  { value: 1, label: "1 - Não Optante" },
  { value: 2, label: "2 - Optante - Microempreendedor Individual (MEI)" },
  { value: 3, label: "3 - Optante - Microempresa ou Empresa de Pequeno Porte (ME/EPP)" },
];

const regimeEspecialOptions = [
  { value: 0, label: "0 - Nenhum" },
  { value: 1, label: "1 - Ato Cooperado (Cooperativa)" },
  { value: 2, label: "2 - Estimativa" },
  { value: 3, label: "3 - Microempresa Municipal" },
  { value: 4, label: "4 - Notário ou Registrador" },
  { value: 5, label: "5 - Profissional Autônomo" },
  { value: 6, label: "6 - Sociedade de Profissionais" },
];

const tributacaoISSQNOptions = [
  { value: 1, label: "1 - Operação tributável" },
  { value: 2, label: "2 - Imunidade" },
  { value: 3, label: "3 - Exportação de serviço" },
  { value: 4, label: "4 - Não Incidência" },
];

const retencaoISSQNOptions = [
  { value: 1, label: "1 - Não Retido" },
  { value: 2, label: "2 - Retido pelo Tomador" },
  { value: 3, label: "3 - Retido pelo Intermediário" },
];

const tipoImunidadeOptions = [
  { value: 0, label: "0 - Imunidade (não informada na nota de origem)" },
  { value: 1, label: "1 - Patrimônio, renda ou serviços, uns dos outros (CF88, Art. 150, VI, a)" },
  { value: 2, label: "2 - Templos de qualquer culto (CF88, Art. 150, VI, b)" },
  {
    value: 3,
    label:
      "3 - Partidos políticos, entidades sindicais trabalhadores, instituições de educação/assistência social sem fins lucrativos (CF88, Art. 150, VI, c)",
  },
  { value: 4, label: "4 - Livros, jornais, periódicos e papel destinado à impressão (CF88, Art. 150, VI, d)" },
  {
    value: 5,
    label:
      "5 - Fonogramas e videofonogramas musicais produzidos no Brasil com obras/ artistas brasileiros (CF88, Art. 150, VI, e)",
  },
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
    if (value === null || value === undefined) {
      return "";
    }

    const numValue = typeof value === "string" ? Number.parseFloat(value) : value;

    if (Number.isNaN(numValue)) {
      return "";
    }

    return numValue.toLocaleString("pt-BR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const toNumberOrNull = (value: unknown): number | null => {
    if (value === null || value === undefined) return null;
    const numeric = typeof value === "number" ? value : Number(value);
    return Number.isNaN(numeric) ? null : numeric;
  };
  type FormValues = ConfiguracaoFormValues;

  const defaultFormValues: FormValues = {
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
    tpAmb: 2,
    opSimpNac: 1,
    regEspTrib: 0,
    ambGer: 2,
    tpEmis: 1,
    procEmi: 1,
    cStat: 100,
    dhProc: null,
    nDFSe: "",
    tribMun: {
      tribISSQN: 1,
      tpRetISSQN: 1,
      tpImunidade: 0,
    },
    totTrib: {
      pTotTribFed: 0,
      pTotTribEst: 0,
      pTotTribMun: 0,
    },
  };

  const mapDtoToFormValues = (data: ConfiguracaoDto): FormValues => ({
    ...defaultFormValues,
    ...data,
    numeroInicialDps: data.numeroInicialDps ?? defaultFormValues.numeroInicialDps,
    seriePadrao: data.seriePadrao ?? defaultFormValues.seriePadrao,
    verAplic: data.verAplic ?? defaultFormValues.verAplic,
    tpAmb: data.tpAmb ?? defaultFormValues.tpAmb,
    opSimpNac: data.opSimpNac ?? defaultFormValues.opSimpNac,
    regEspTrib: data.regEspTrib ?? defaultFormValues.regEspTrib,
    ambGer: data.ambGer ?? defaultFormValues.ambGer,
    tpEmis: data.tpEmis ?? defaultFormValues.tpEmis,
    procEmi: data.procEmi ?? defaultFormValues.procEmi,
    cStat: data.cStat ?? defaultFormValues.cStat,
    nNFSe: data.nNFSe?.trim().length ? data.nNFSe : "1",
    nDFSe: data.nDFSe?.trim().length ? data.nDFSe : "1",
    tribMun: {
      tribISSQN: data.tribMun?.tribISSQN ?? defaultFormValues.tribMun.tribISSQN,
      tpRetISSQN: data.tribMun?.tpRetISSQN ?? defaultFormValues.tribMun.tpRetISSQN,
      tpImunidade: data.tribMun?.tpImunidade ?? defaultFormValues.tribMun.tpImunidade,
    },
    totTrib: {
      pTotTribFed: toNumberOrNull(data.totTrib?.pTotTribFed) ?? defaultFormValues.totTrib.pTotTribFed,
      pTotTribEst: toNumberOrNull(data.totTrib?.pTotTribEst) ?? defaultFormValues.totTrib.pTotTribEst,
      pTotTribMun: toNumberOrNull(data.totTrib?.pTotTribMun) ?? defaultFormValues.totTrib.pTotTribMun,
    },
  });

  const configuracaoQuery = useQuery<ConfiguracaoDto>({
    queryKey: ["configuracoes"],
    queryFn: getConfiguracao,
  });

  const municipiosQuery = useQuery<MunicipioDto[]>({
    queryKey: ["municipios", selectedUf],
    queryFn: () => listMunicipios(selectedUf),
    enabled: Boolean(selectedUf),
  });

  const form = useForm<FormValues>({
    resolver: zodResolver(configuracaoUpdateSchema),
    defaultValues: defaultFormValues,
  });

  useEffect(() => {
    if (configuracaoQuery.data) {
      form.reset(mapDtoToFormValues(configuracaoQuery.data));
    }
  }, [configuracaoQuery.data, form]);

  const updateMutation = useMutation<ConfiguracaoDto, Error, ConfiguracaoFormValues>({
    mutationFn: updateConfiguracao,
    onSuccess: (data) => {
      toast.success("Configurações atualizadas com sucesso");
      form.reset(mapDtoToFormValues(data));
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

  const handleSubmit = async (values: FormValues) => {
    if (!configuracaoQuery.data) {
      toast.error("Configuração ainda não carregou. Tente novamente.");
      return;
    }

    const base = configuracaoQuery.data;

    const sanitizedTotTrib = {
      pTotTribFed: toNumberOrNull(values.totTrib.pTotTribFed),
      pTotTribEst: toNumberOrNull(values.totTrib.pTotTribEst),
      pTotTribMun: toNumberOrNull(values.totTrib.pTotTribMun),
    };

    const payload: ConfiguracaoFormValues = {
      ...base,
      ...values,
      numeroInicialDps: values.numeroInicialDps,
      seriePadrao: values.seriePadrao,
      verAplic: values.verAplic && values.verAplic.trim().length > 0 ? values.verAplic : base.verAplic,
      xTribNac: values.xTribNac,
      xNBS: values.xNBS,
      tpAmb: values.tpAmb,
      opSimpNac: values.opSimpNac,
      regEspTrib: values.regEspTrib,
      totTrib: sanitizedTotTrib,
      tribMun: {
        tribISSQN: values.tribMun.tribISSQN,
        tpRetISSQN: values.tribMun.tpRetISSQN,
        tpImunidade: values.tribMun.tpImunidade,
      },
      nDFSe: values.nDFSe && values.nDFSe.trim().length > 0 ? values.nDFSe : base.nDFSe ?? "1",
      nNFSe: values.nNFSe && values.nNFSe.trim().length > 0 ? values.nNFSe : base.nNFSe ?? "1",
    };

    try {
      await updateMutation.mutateAsync(payload);
    } catch (error) {
      console.error("[ConfiguracaoNfseForm] Erro ao atualizar:", error);
    }
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
            <CardHeader>
              <CardTitle>Ambiente e dados gerais</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="tpAmb"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ambiente (tpAmb)</FormLabel>
                    <Select
                      value={field.value?.toString()}
                      onValueChange={(value) => field.onChange(Number(value))}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o ambiente" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {ambienteConfiguracaoOptions.map((option) => (
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
                name="opSimpNac"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Simples Nacional</FormLabel>
                    <Select
                      value={field.value?.toString()}
                      onValueChange={(value) => field.onChange(Number(value))}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione a opção" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {simplesNacionalOptions.map((option) => (
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
                name="regEspTrib"
                render={({ field }) => (
                  <FormItem className="sm:col-span-2">
                    <FormLabel>Regime Especial Tributário Municipal</FormLabel>
                    <Select
                      value={field.value?.toString()}
                      onValueChange={(value) => field.onChange(Number(value))}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o regime" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {regimeEspecialOptions.map((option) => (
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
                name="seriePadrao"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Série padrão</FormLabel>
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
                name="nNFSe"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Próximo número NFSe</FormLabel>
                    <FormControl>
                      <Input placeholder="1" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="nDFSe"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Próximo número DFSe</FormLabel>
                    <FormControl>
                      <Input placeholder="1" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="verAplic"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Versão da aplicação (verAplic)</FormLabel>
                    <FormControl>
                      <Input placeholder="1.0.0" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="xTribNac"
                render={({ field }) => (
                  <FormItem className="sm:col-span-2">
                    <FormLabel>Código Tributação Nacional</FormLabel>
                    <FormControl>
                      <Input placeholder="01.07.00" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="xNBS"
                render={({ field }) => (
                  <FormItem className="sm:col-span-2">
                    <FormLabel>Código NBS</FormLabel>
                    <FormControl>
                      <Input placeholder="1.0101.10.00" {...field} />
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
                    <FormLabel>Configuração ativa</FormLabel>
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
                        <SelectItem value="true">Sim</SelectItem>
                        <SelectItem value="false">Não</SelectItem>
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
                        {tributacaoISSQNOptions.map((option) => (
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
                      disabled={form.watch("tribMun.tribISSQN") !== 2}
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
