"use client";

import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Loader2, Save } from "lucide-react";
import { toast } from "sonner";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
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
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  configuracaoUpdateSchema,
  type ConfiguracaoDto,
  type ConfiguracaoFormValues,
} from "@/lib/validators/configuracao";
import { listMunicipios, type MunicipioDto } from "@/services/municipios";

import { getConfiguracao, updateConfiguracao } from "./configuracoes-service";

const ambienteOptions = [
  { label: "Produção", value: "PRODUCAO" },
  { label: "Homologação", value: "HOMOLOGACAO" },
];

const ufOptions = [
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
];

export default function ConfiguracoesPage() {
  const [selectedUf, setSelectedUf] = useState<string>("MG");

  const defaultValues: ConfiguracaoFormValues = {
    nomeSistema: "",
    versaoAplicacao: "",
    ambientePadrao: "HOMOLOGACAO",
    seriePadrao: 1,
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
      pTotTribFed: 0,
      pTotTribEst: 0,
      pTotTribMun: 0,
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
      form.reset(formValues);
    }
  }, [configuracaoQuery.data, form]);

  const updateMutation = useMutation<ConfiguracaoDto, Error, ConfiguracaoFormValues>({
    mutationFn: updateConfiguracao,
    onSuccess: (data) => {
      toast.success("Configurações atualizadas com sucesso");
      const { updatedAt: _updatedAt, ...formValues } = data;
      form.reset(formValues);
    },
    onError: (error: Error) => {
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
    await updateMutation.mutateAsync(values);
  };

  const dhProcFormatted = form.watch("dhProc");
  const updatedAt = configuracaoQuery.data?.updatedAt;

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight">Configurações de emissão</h1>
        <p className="text-sm text-muted-foreground">
          Defina parâmetros fixos utilizados na geração da DPS e emissão da NFSe.
        </p>
      </header>

      <Form {...form}>
        <form className="space-y-6" onSubmit={form.handleSubmit(handleSubmit)}>
          <Card>
            <CardHeader>
              <CardTitle>Dados gerais</CardTitle>
              <CardDescription>Informações principais do sistema e controles de emissão.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="nomeSistema"
                render={({ field }) => (
                  <FormItem className="sm:col-span-2">
                    <FormLabel>Nome do sistema</FormLabel>
                    <FormControl>
                      <Input placeholder="NotaClient" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="versaoAplicacao"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Versão da aplicação</FormLabel>
                    <FormControl>
                      <Input placeholder="1.0.0" {...field} />
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
                    <FormLabel>verAplic</FormLabel>
                    <FormControl>
                      <Input placeholder="SefinNac_Pre_1.4.0" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="ambientePadrao"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ambiente padrão</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o ambiente" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {ambienteOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
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
                name="seriePadrao"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Série padrão</FormLabel>
                    <FormControl>
                      <Input type="number" min={1} {...field} />
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
                    <FormLabel>Número NFSe</FormLabel>
                    <FormControl>
                      <Input placeholder="40" {...field} />
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
                    <FormLabel>Número DFSe</FormLabel>
                    <FormControl>
                      <Input placeholder="778552" {...field} />
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
                    <FormLabel>xTribNac</FormLabel>
                    <FormControl>
                      <Input placeholder="Medicina." {...field} />
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
                    <FormLabel>xNBS</FormLabel>
                    <FormControl>
                      <Input placeholder="Serviços de clínica médica" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="xLocEmi"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Local de emissão</FormLabel>
                    <FormControl>
                      <Input placeholder="Belo Horizonte" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="xLocPrestacao"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Local de prestação</FormLabel>
                    <FormControl>
                      <Input placeholder="Belo Horizonte" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="ambGer"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>ambGer</FormLabel>
                    <FormControl>
                      <Input type="number" min={0} max={9} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="tpEmis"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>tpEmis</FormLabel>
                    <FormControl>
                      <Input type="number" min={0} max={9} {...field} />
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
                    <FormLabel>procEmi</FormLabel>
                    <FormControl>
                      <Input type="number" min={0} max={9} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="cStat"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>cStat</FormLabel>
                    <FormControl>
                      <Input type="number" min={0} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="dhProc"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>dhProc</FormLabel>
                    <FormControl>
                      <Input type="datetime-local" value={field.value ?? ""} onChange={field.onChange} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="emailRemetente"
                render={({ field }) => (
                  <FormItem className="sm:col-span-2">
                    <FormLabel>E-mail remetente</FormLabel>
                    <FormControl>
                      <Input type="email" value={field.value ?? ""} onChange={field.onChange} placeholder="contato@empresa.com" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="robotClientId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Robot Client ID</FormLabel>
                    <FormControl>
                      <Input value={field.value ?? ""} onChange={field.onChange} placeholder="CLIENT_ID" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="robotClientSecret"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Robot Client Secret</FormLabel>
                    <FormControl>
                      <Input value={field.value ?? ""} onChange={field.onChange} placeholder="CLIENT_SECRET" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="robotTokenCacheMinutos"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Token cache (minutos)</FormLabel>
                    <FormControl>
                      <Input type="number" min={1} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="mfaCodigoExpiracaoMinutos"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Validade MFA (minutos)</FormLabel>
                    <FormControl>
                      <Input type="number" min={1} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="enviarNotificacaoEmailPrestador"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between rounded-md border px-3 py-2">
                    <FormLabel className="text-sm font-medium">Enviar emails aos prestadores</FormLabel>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="ativo"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between rounded-md border px-3 py-2">
                    <FormLabel className="text-sm font-medium">Configuração ativa</FormLabel>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Parâmetros tributários</CardTitle>
              <CardDescription>Informações complementares enviadas na DPS.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-3">
              <FormField
                control={form.control}
                name="tribMun.tribISSQN"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>tribISSQN</FormLabel>
                    <FormControl>
                      <Input type="number" min={0} max={9} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="tribMun.tpImunidade"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>tpImunidade</FormLabel>
                    <FormControl>
                      <Input type="number" min={0} max={9} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="tribMun.tpRetISSQN"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>tpRetISSQN</FormLabel>
                    <FormControl>
                      <Input type="number" min={0} max={9} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="totTrib.pTotTribFed"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>pTotTribFed</FormLabel>
                    <FormControl>
                      <Input type="number" min={0} step="0.01" {...field} />
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
                    <FormLabel>pTotTribEst</FormLabel>
                    <FormControl>
                      <Input type="number" min={0} step="0.01" {...field} />
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
                    <FormLabel>pTotTribMun</FormLabel>
                    <FormControl>
                      <Input type="number" min={0} step="0.01" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Referência de municípios</CardTitle>
              <CardDescription>Selecione a UF para carregar a lista do IBGE.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <div>
                <FormLabel>UF</FormLabel>
                <Select
                  value={selectedUf}
                  onValueChange={(value) => {
                    setSelectedUf(value);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a UF" />
                  </SelectTrigger>
                  <SelectContent>
                    {ufOptions.map((uf) => (
                      <SelectItem key={uf} value={uf}>
                        {uf}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <FormLabel>Municípios disponíveis</FormLabel>
                <div className="rounded-md border bg-muted/40 p-3 text-sm text-muted-foreground">
                  {municipiosQuery.isLoading ? (
                    <div className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Carregando lista do IBGE...
                    </div>
                  ) : (
                    <span>{municipioOptions.length} municípios carregados</span>
                  )}
                </div>
              </div>
            </CardContent>

            <CardFooter className="flex flex-col gap-2 text-xs text-muted-foreground">
              <span>
                Use os códigos IBGE ao preencher locais de emissão/prestação e cadastros de prestadores/tomadores.
              </span>
              {dhProcFormatted && (
                <Alert>
                  <AlertTitle>Data de processamento configurada</AlertTitle>
                  <AlertDescription>
                    {format(new Date(dhProcFormatted), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                  </AlertDescription>
                </Alert>
              )}
              {updatedAt && (
                <span>
                  Última atualização: {format(new Date(updatedAt), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                </span>
              )}
            </CardFooter>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Observações adicionais</CardTitle>
              <CardDescription>Opcional, para guardar anotações internas.</CardDescription>
            </CardHeader>
            <CardContent>
              <FormField
                control={form.control}
                name="xTribNac"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Anotações internas</FormLabel>
                    <FormControl>
                      <Textarea
                        className="min-h-[120px]"
                        placeholder="Registre detalhes importantes para a emissão..."
                        value={field.value}
                        onChange={field.onChange}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            {updateMutation.isError && (
              <Alert variant="destructive" className="sm:w-1/2">
                <AlertTitle>Erro ao salvar</AlertTitle>
                <AlertDescription>Revise os dados e tente novamente.</AlertDescription>
              </Alert>
            )}

            <Button type="submit" className="ml-auto" disabled={updateMutation.isPending}>
              {updateMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Salvando...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" /> Salvar alterações
                </>
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
