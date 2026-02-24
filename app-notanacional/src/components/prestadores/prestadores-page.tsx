"use client";

import { useQuery } from "@tanstack/react-query";
import { Building2, Loader2, AlertCircle, MapPin, Mail, Phone, Globe, RefreshCw } from "lucide-react";

import { listPrestadores, type PrestadoresListResponse } from "@/services/prestadores";
import { listMunicipios, type MunicipioDto } from "@/services/municipios";
import { formatPhone } from "@/lib/formatters";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";

export default function PrestadoresPage() {
  const { data, isLoading, error } = useQuery<PrestadoresListResponse>({
    queryKey: ["prestadores"],
    queryFn: () => listPrestadores({ search: "", status: "ativos", page: 1, perPage: 1 }),
  });

  const prestador = data?.data?.[0];

  const codigoMunicipioTributarioRaw = prestador?.codigoMunicipioIbge;
  const codigoMunicipioEnderecoRaw = prestador?.endereco?.codigoMunicipioIbge;

  const codigoMunicipioTributario = codigoMunicipioTributarioRaw
    ? String(codigoMunicipioTributarioRaw).padStart(7, "0")
    : undefined;
  const codigoMunicipioEndereco = codigoMunicipioEnderecoRaw
    ? String(codigoMunicipioEnderecoRaw).padStart(7, "0")
    : undefined;
  const codigoMunicipioParaDescricao = codigoMunicipioEndereco ?? codigoMunicipioTributario;

  const ufMunicipio = (prestador?.endereco?.uf ?? prestador?.estado)?.toUpperCase();

  const { data: municipios, isLoading: isLoadingMunicipios } = useQuery<MunicipioDto[]>({
    queryKey: ["municipios", ufMunicipio],
    queryFn: () => listMunicipios(ufMunicipio),
    enabled: Boolean(ufMunicipio && codigoMunicipioParaDescricao),
    staleTime: 1000 * 60 * 60,
    refetchOnWindowFocus: false,
  });

  const findMunicipioNome = (codigo?: string) => {
    if (!codigo || !municipios) {
      return undefined;
    }

    return municipios.find((municipio) => municipio.codigo.padStart(7, "0") === codigo)?.nome;
  };

  const municipioDescricaoTributario = findMunicipioNome(codigoMunicipioTributario);
  const municipioDescricaoEndereco = findMunicipioNome(codigoMunicipioEndereco);

  const hasInformacoesTributarias = Boolean(
    prestador?.codigoMunicipioIbge ||
      prestador?.optanteSimplesNacional !== undefined ||
      prestador?.regimeEspecialTributario !== undefined,
  );

  const hasEndereco = Boolean(
    prestador?.endereco &&
      (prestador.endereco.logradouro ||
        prestador.endereco.numero ||
        prestador.endereco.complemento ||
        prestador.endereco.bairro ||
        prestador.endereco.uf ||
        prestador.endereco.cep ||
        prestador.endereco.codigoMunicipioIbge),
  );

  const hasContato = Boolean(prestador?.email || prestador?.telefone || prestador?.website || prestador?.site || prestador?.url);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dados do Prestador</h1>
          <p className="text-sm text-muted-foreground">
            Informações do prestador associado à sua conta
          </p>
        </div>
        <Button variant="ghost" size="icon" onClick={() => window.location.reload()}>
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>

      {isLoading && (
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </CardContent>
        </Card>
      )}

      {error && (
        <Card>
          <CardContent className="py-12">
            <div className="flex flex-col items-center gap-2 text-center">
              <AlertCircle className="h-8 w-8 text-destructive" />
              <p className="text-sm text-muted-foreground">Erro ao carregar dados do prestador</p>
            </div>
          </CardContent>
        </Card>
      )}

      {prestador && (
        <Card className="border-l-4 border-l-blue-500 bg-linear-to-br from-blue-50 to-white shadow-lg">
          <CardHeader className="text-black rounded-t-lg pt-0">
            <div className="flex items-center gap-3">
              <Building2 className="h-6 w-6 text-black" />
              <div>
                <CardTitle className="text-black text-lg font-bold">{prestador.nomeFantasia}</CardTitle>
                <CardDescription className="text-black text-sm">{prestador.razaoSocial}</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Dados Cadastrais */}
            <div className="grid gap-4 md:grid-cols-3">
              <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors">
                <h3 className="mb-2 text-sm font-semibold text-gray-800">CNPJ</h3>
                <p className="text-sm text-gray-700 font-medium">
                  {prestador.cnpj?.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, "$1.$2.$3/$4-$5") || prestador.cnpj}
                </p>
              </div>
              {prestador.inscricaoMunicipal && (
                <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors">
                  <h3 className="mb-2 text-sm font-semibold text-gray-800">Inscrição Municipal</h3>
                  <p className="text-sm text-gray-700 font-medium">{prestador.inscricaoMunicipal}</p>
                </div>
              )}
              {prestador.cnae && (
                <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors">
                  <h3 className="mb-2 text-sm font-semibold text-gray-800">CNAE</h3>
                  <p className="text-sm text-gray-700 font-medium">{prestador.cnae}</p>
                </div>
              )}
            </div>

            {hasInformacoesTributarias && (
              <>
                <Separator />

                {/* Informações Tributárias */}
                <div className="grid gap-4 md:grid-cols-3">
                  {codigoMunicipioTributario && (
                    <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors">
                      <h3 className="mb-2 text-sm font-semibold text-gray-800">Município (IBGE)</h3>
                      <p className="text-sm text-gray-700 font-medium">
                        {codigoMunicipioTributario}
                        {municipioDescricaoTributario && ` - ${municipioDescricaoTributario}`}
                        {!municipioDescricaoTributario && isLoadingMunicipios && " - Buscando descrição..."}
                      </p>
                    </div>
                  )}
                  {prestador.optanteSimplesNacional !== undefined && (
                    <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors">
                      <h3 className="mb-2 text-sm font-semibold text-gray-800">Optante Simples Nacional</h3>
                      <p className="text-sm text-gray-700 font-medium">
                        {prestador.optanteSimplesNacional === 1 ? "Sim" : "Não"}
                      </p>
                    </div>
                  )}
                  {prestador.regimeEspecialTributario !== undefined && (
                    <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors">
                      <h3 className="mb-2 text-sm font-semibold text-gray-800">Regime Especial Tributário</h3>
                      <p className="text-sm text-gray-700 font-medium">
                        {prestador.regimeEspecialTributario === 0 ? "Nenhum" : prestador.regimeEspecialTributario}
                      </p>
                    </div>
                  )}
                </div>
              </>
            )}

            {hasContato && (
              <>
                <Separator />

                <div>
                  <h3 className="mb-3 text-sm font-semibold text-gray-800 border-b border-gray-200 pb-2">Contatos</h3>
                  <div className="grid gap-3 md:grid-cols-2">
                    {prestador.email && (
                      <div className="flex items-start gap-2 text-sm text-muted-foreground">
                        <Mail className="mt-0.5 h-4 w-4 shrink-0" />
                        <span>{prestador.email}</span>
                      </div>
                    )}
                    {prestador.telefone && (
                      <div className="flex items-start gap-2 text-sm text-muted-foreground">
                        <Phone className="mt-0.5 h-4 w-4 shrink-0" />
                        <span>{formatPhone(prestador.telefone)}</span>
                      </div>
                    )}
                    {(prestador.website || prestador.site || prestador.url) && (
                      <div className="flex items-start gap-2 text-sm text-muted-foreground">
                        <Globe className="mt-0.5 h-4 w-4 shrink-0" />
                        <a
                          href={(prestador.website || prestador.site || prestador.url) ?? "#"}
                          target="_blank"
                          rel="noreferrer"
                          className="truncate text-primary hover:underline"
                        >
                          {prestador.website || prestador.site || prestador.url}
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}

            {hasEndereco && (
              <>
                <Separator />

                {/* Endereço */}
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold text-gray-800 border-b border-gray-200 pb-2">Endereço</h3>
                  <div className="flex items-start gap-2 text-sm bg-gray-50 p-4 rounded-lg border border-gray-200">
                    <MapPin className="mt-0.5 h-4 w-4 shrink-0" />
                    <div>
                      {prestador.endereco?.logradouro && prestador.endereco?.numero && (
                        <p>
                          {prestador.endereco.logradouro}, {prestador.endereco.numero}
                          {prestador.endereco.complemento && ` - ${prestador.endereco.complemento}`}
                        </p>
                      )}
                      {prestador.endereco?.bairro && <p>{prestador.endereco.bairro}</p>}
                      {codigoMunicipioEndereco && (
                        <p>
                          Município (IBGE): {codigoMunicipioEndereco}
                          {municipioDescricaoEndereco && ` - ${municipioDescricaoEndereco}`}
                          {!municipioDescricaoEndereco && isLoadingMunicipios && " - Buscando descrição..."}
                        </p>
                      )}
                      {prestador.endereco?.uf && <p>{prestador.endereco.uf}</p>}
                      {prestador.endereco?.cep && (
                        <p>CEP: {prestador.endereco.cep.replace(/^(\d{5})(\d{3})$/, "$1-$2")}</p>
                      )}
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* Tipo de Emissão */}
            {prestador.tipoEmissao !== undefined && (
              <>
                <Separator />
                <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors">
                  <h3 className="mb-2 text-sm font-semibold text-gray-800">Tipo de Emissão</h3>
                  <p className="text-sm text-gray-700 font-medium">
                    {prestador.tipoEmissao === 1 ? "Normal" : prestador.tipoEmissao === 2 ? "Contingência" : "Outro"}
                  </p>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
