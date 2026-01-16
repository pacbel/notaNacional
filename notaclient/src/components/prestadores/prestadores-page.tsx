"use client";

import { useQuery } from "@tanstack/react-query";
import { Building2, Loader2, AlertCircle, Mail, Phone, MapPin } from "lucide-react";

import { listPrestadores, type PrestadoresListResponse } from "@/services/prestadores";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";

export default function PrestadoresPage() {
  const { data, isLoading, error } = useQuery<PrestadoresListResponse>({
    queryKey: ["prestadores"],
    queryFn: () => listPrestadores({ search: "", status: "ativos", page: 1, perPage: 1 }),
  });

  const prestador = data?.data?.[0];

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold tracking-tight">Dados do Prestador</h1>
        <p className="text-sm text-muted-foreground">
          Informações do prestador associado à sua conta
        </p>
      </header>

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
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <Building2 className="h-8 w-8 text-primary" />
              <div>
                <CardTitle>{prestador.nomeFantasia}</CardTitle>
                <CardDescription>{prestador.razaoSocial}</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Dados Cadastrais */}
            <div className="grid gap-4 md:grid-cols-3">
              <div>
                <h3 className="mb-2 text-sm font-medium">CNPJ</h3>
                <p className="text-sm text-muted-foreground">
                  {prestador.cnpj?.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, "$1.$2.$3/$4-$5") || prestador.cnpj}
                </p>
              </div>
              {prestador.inscricaoMunicipal && (
                <div>
                  <h3 className="mb-2 text-sm font-medium">Inscrição Municipal</h3>
                  <p className="text-sm text-muted-foreground">{prestador.inscricaoMunicipal}</p>
                </div>
              )}
              {prestador.cnae && (
                <div>
                  <h3 className="mb-2 text-sm font-medium">CNAE</h3>
                  <p className="text-sm text-muted-foreground">{prestador.cnae}</p>
                </div>
              )}
            </div>

            <Separator />

            {/* Informações Tributárias */}
            <div className="grid gap-4 md:grid-cols-3">
              {prestador.codigoMunicipioIbge && (
                <div>
                  <h3 className="mb-2 text-sm font-medium">Código Município IBGE</h3>
                  <p className="text-sm text-muted-foreground">{prestador.codigoMunicipioIbge}</p>
                </div>
              )}
              {prestador.optanteSimplesNacional !== undefined && (
                <div>
                  <h3 className="mb-2 text-sm font-medium">Optante Simples Nacional</h3>
                  <p className="text-sm text-muted-foreground">
                    {prestador.optanteSimplesNacional === 1 ? "Sim" : "Não"}
                  </p>
                </div>
              )}
              {prestador.regimeEspecialTributario !== undefined && (
                <div>
                  <h3 className="mb-2 text-sm font-medium">Regime Especial Tributário</h3>
                  <p className="text-sm text-muted-foreground">
                    {prestador.regimeEspecialTributario === 0 ? "Nenhum" : prestador.regimeEspecialTributario}
                  </p>
                </div>
              )}
            </div>

            <Separator />

            {/* Endereço */}
            <div className="space-y-3">
              <h3 className="text-sm font-medium">Endereço</h3>
              <div className="flex items-start gap-2 text-sm text-muted-foreground">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0" />
                <div>
                  {prestador.endereco?.logradouro && prestador.endereco?.numero && (
                    <p>
                      {prestador.endereco.logradouro}, {prestador.endereco.numero}
                      {prestador.endereco.complemento && ` - ${prestador.endereco.complemento}`}
                    </p>
                  )}
                  {prestador.endereco?.bairro && (
                    <p>{prestador.endereco.bairro}</p>
                  )}
                  {prestador.endereco?.uf && (
                    <p>{prestador.endereco.uf}</p>
                  )}
                  {prestador.endereco?.cep && (
                    <p>CEP: {prestador.endereco.cep.replace(/^(\d{5})(\d{3})$/, "$1-$2")}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Tipo de Emissão */}
            {prestador.tipoEmissao !== undefined && (
              <>
                <Separator />
                <div>
                  <h3 className="mb-2 text-sm font-medium">Tipo de Emissão</h3>
                  <p className="text-sm text-muted-foreground">
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
