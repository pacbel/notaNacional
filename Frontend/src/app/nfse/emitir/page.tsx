"use client";

import { useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuth } from "@/contexts/auth-context";
import { useApiQuery } from "@/hooks/use-api-query";
import { useApiMutation } from "@/hooks/use-api-mutation";
import { listarPrestadores, listarCertificadosPrestador } from "@/services/prestadores";
import { emitirNfse, cancelarNfse } from "@/services/nfse";
import {
  PrestadorCertificadoDto,
  PrestadorDto,
} from "@/types/prestadores";
import {
  EmitirNfseRequestDto,
  CancelarNfseRequestDto,
} from "@/types/nfse";
import { Card } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

const ambientes = [
  { label: "Produção", value: 1 },
  { label: "Homologação", value: 2 },
];

const emitirSchema = z.object({
  prestadorId: z.string({ required_error: "Selecione um prestador" }).uuid("Prestador inválido"),
  certificateId: z.string({ required_error: "Selecione um certificado válido" }).uuid("Certificado inválido"),
  ambiente: z.coerce.number().int().min(1).max(2),
  xmlAssinado: z
    .string({ required_error: "Informe o XML assinado (Base64 ou texto)" })
    .min(10, "Informe o conteúdo do XML assinado"),
});

type EmitirFormValues = z.infer<typeof emitirSchema>;

const cancelarSchema = z
  .object({
    prestadorId: z.string({ required_error: "Selecione um prestador" }).uuid("Prestador inválido"),
    certificateId: z.string({ required_error: "Selecione um certificado válido" }).uuid("Certificado inválido"),
    ambiente: z.coerce.number().int().min(1).max(2),
    chaveAcesso: z.string().trim().optional(),
    eventoXmlGZipBase64: z.string().trim().optional(),
  })
  .refine((values) => Boolean(values.chaveAcesso?.length || values.eventoXmlGZipBase64?.length), {
    message: "Informe a chave de acesso ou o XML do evento",
    path: ["chaveAcesso"],
  });

type CancelarFormValues = z.infer<typeof cancelarSchema>;

function usePrestadores() {
  return useApiQuery<PrestadorDto[]>({
    queryKey: ["prestadores"],
    queryFn: listarPrestadores,
  });
}

function useCertificados(prestadorId: string | undefined) {
  return useApiQuery<PrestadorCertificadoDto[]>({
    queryKey: ["prestadores", prestadorId, "certificados"],
    enabled: Boolean(prestadorId),
    queryFn: () => listarCertificadosPrestador(prestadorId!),
  });
}

export default function EmitirNfsePage() {
  const { user } = useAuth();
  const prestadoresQuery = usePrestadores();

  const emitirForm = useForm<EmitirFormValues>({
    resolver: zodResolver(emitirSchema),
    defaultValues: {
      prestadorId: user?.prestadorId ?? "",
      ambiente: 2,
      certificateId: "",
      xmlAssinado: "",
    },
  });

  const cancelarForm = useForm<CancelarFormValues>({
    resolver: zodResolver(cancelarSchema),
    defaultValues: {
      prestadorId: user?.prestadorId ?? "",
      ambiente: 2,
      certificateId: "",
      chaveAcesso: "",
      eventoXmlGZipBase64: "",
    },
  });

  const emitirPrestadorId = emitirForm.watch("prestadorId");
  const cancelarPrestadorId = cancelarForm.watch("prestadorId");

  const certificadosEmitirQuery = useCertificados(emitirPrestadorId);
  const certificadosCancelarQuery = useCertificados(cancelarPrestadorId);

  const certificadosEmitir = certificadosEmitirQuery.data ?? [];
  const certificadosCancelar = certificadosCancelarQuery.data ?? [];

  useEffect(() => {
    if (!emitirPrestadorId) {
      emitirForm.setValue("certificateId", "");
      return;
    }

    if (certificadosEmitir.length > 0) {
      const firstValid = certificadosEmitir[0];
      emitirForm.setValue("certificateId", firstValid.id, { shouldDirty: true });
    } else {
      emitirForm.setValue("certificateId", "");
    }
  }, [emitirPrestadorId, certificadosEmitir, emitirForm]);

  useEffect(() => {
    if (!cancelarPrestadorId) {
      cancelarForm.setValue("certificateId", "");
      return;
    }

    if (certificadosCancelar.length > 0) {
      const firstValid = certificadosCancelar[0];
      cancelarForm.setValue("certificateId", firstValid.id, { shouldDirty: true });
    } else {
      cancelarForm.setValue("certificateId", "");
    }
  }, [cancelarPrestadorId, certificadosCancelar, cancelarForm]);

  const emitirMutation = useApiMutation((payload: EmitirNfseRequestDto) => emitirNfse(payload), {
    successMessage: "NFSe emitida com sucesso.",
    onSuccess: (response) => {
      if (response.chaveAcesso) {
        toast.success(`Chave de acesso: ${response.chaveAcesso}`);
      }
    },
  });

  const cancelarMutation = useApiMutation((payload: CancelarNfseRequestDto) => cancelarNfse(payload), {
    successMessage: "NFSe cancelada com sucesso.",
  });

  const prestadoresOptions = useMemo(() => {
    const data = prestadoresQuery.data ?? [];
    return data.map((prestador) => ({
      value: prestador.id,
      label: `${prestador.nomeFantasia} (${prestador.cnpj})`,
    }));
  }, [prestadoresQuery.data]);

  const ambientesOptions = useMemo(() => ambientes, []);

  const certificadosEmitirOptions = useMemo(
    () =>
      certificadosEmitir.map((certificado) => ({
        value: certificado.id,
        label: `${certificado.alias ?? certificado.cnpj} — vence em ${new Date(
          certificado.validadeFim
        ).toLocaleDateString("pt-BR")}`,
      })),
    [certificadosEmitir]
  );

  const certificadosCancelarOptions = useMemo(
    () =>
      certificadosCancelar.map((certificado) => ({
        value: certificado.id,
        label: `${certificado.alias ?? certificado.cnpj} — vence em ${new Date(
          certificado.validadeFim
        ).toLocaleDateString("pt-BR")}`,
      })),
    [certificadosCancelar]
  );

  const handleEmitir = emitirForm.handleSubmit(async (values) => {
    await emitirMutation.mutateAsync(values);
  });

  const handleCancelar = cancelarForm.handleSubmit(async (values) => {
    await cancelarMutation.mutateAsync({
      certificateId: values.certificateId,
      ambiente: values.ambiente,
      chaveAcesso: values.chaveAcesso?.trim() || undefined,
      eventoXmlGZipBase64: values.eventoXmlGZipBase64?.trim() || undefined,
    });
  });

  return (
    <div className="flex flex-col gap-6">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold text-slate-900">Emissão e cancelamento de NFSe</h1>
        <p className="text-sm text-slate-500">
          Utilize os formulários abaixo para enviar os XMLs assinados, selecionando o certificado correto do prestador.
        </p>
      </header>

      <Card className="space-y-6 p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Emitir NFSe</h2>
            <p className="text-sm text-slate-500">
              Informe o prestador, certificado e XML assinado para transmitir a nota à prefeitura.
            </p>
          </div>
          <Badge>Ambientes suportados: 1 (Produção) e 2 (Homologação)</Badge>
        </div>

        <form className="space-y-4" onSubmit={handleEmitir}>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-600" htmlFor="emitirPrestador">
                Prestador
              </label>
              <Select
                id="emitirPrestador"
                value={emitirForm.watch("prestadorId")}
                onChange={(event) => emitirForm.setValue("prestadorId", event.target.value)}
              >
                <option value="">Selecione</option>
                {prestadoresOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </Select>
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-600" htmlFor="emitirCertificate">
                Certificado digital
              </label>
              <Select
                id="emitirCertificate"
                value={emitirForm.watch("certificateId")}
                onChange={(event) => emitirForm.setValue("certificateId", event.target.value)}
                disabled={certificadosEmitirQuery.isPending || certificadosEmitir.length === 0}
              >
                <option value="">Selecione</option>
                {certificadosEmitirOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </Select>
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-600" htmlFor="emitirAmbiente">
                Ambiente
              </label>
              <Select
                id="emitirAmbiente"
                value={emitirForm.watch("ambiente")}
                onChange={(event) => emitirForm.setValue("ambiente", Number(event.target.value))}
              >
                {ambientesOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.value} - {option.label}
                  </option>
                ))}
              </Select>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-600" htmlFor="xmlAssinado">
              XML assinado
            </label>
            <Textarea
              id="xmlAssinado"
              rows={10}
              placeholder="Cole aqui o XML assinado (Base64 ou texto)"
              {...emitirForm.register("xmlAssinado")}
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => emitirForm.reset()}>
              Limpar
            </Button>
            <Button type="submit" disabled={emitirMutation.isPending}>
              {emitirMutation.isPending ? "Enviando..." : "Emitir NFSe"}
            </Button>
          </div>
        </form>
      </Card>

      <Card className="space-y-6 p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Cancelar NFSe</h2>
            <p className="text-sm text-slate-500">
              Utilize o certificado do prestador e informe a chave de acesso ou o XML do evento para cancelar a nota.
            </p>
          </div>
          <Badge>Cancelamento requer certificado válido</Badge>
        </div>

        <form className="space-y-4" onSubmit={handleCancelar}>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-600" htmlFor="cancelarPrestador">
                Prestador
              </label>
              <Select
                id="cancelarPrestador"
                value={cancelarForm.watch("prestadorId")}
                onChange={(event) => cancelarForm.setValue("prestadorId", event.target.value)}
              >
                <option value="">Selecione</option>
                {prestadoresOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </Select>
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-600" htmlFor="cancelarCertificate">
                Certificado digital
              </label>
              <Select
                id="cancelarCertificate"
                value={cancelarForm.watch("certificateId")}
                onChange={(event) => cancelarForm.setValue("certificateId", event.target.value)}
                disabled={certificadosCancelarQuery.isPending || certificadosCancelar.length === 0}
              >
                <option value="">Selecione</option>
                {certificadosCancelarOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </Select>
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-600" htmlFor="cancelarAmbiente">
                Ambiente
              </label>
              <Select
                id="cancelarAmbiente"
                value={cancelarForm.watch("ambiente")}
                onChange={(event) => cancelarForm.setValue("ambiente", Number(event.target.value))}
              >
                {ambientesOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.value} - {option.label}
                  </option>
                ))}
              </Select>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-600" htmlFor="chaveAcesso">
                Chave de acesso
              </label>
              <Input
                id="chaveAcesso"
                placeholder="Informe a chave completa"
                {...cancelarForm.register("chaveAcesso")}
              />
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-600" htmlFor="eventoXml">
                Evento XML (Base64 GZip)
              </label>
              <Textarea
                id="eventoXml"
                rows={6}
                placeholder="Cole aqui o XML de cancelamento comprimido"
                {...cancelarForm.register("eventoXmlGZipBase64")}
              />
              <span className="text-xs text-slate-500">
                Informe a chave de acesso ou o XML do evento para prosseguir.
              </span>
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => cancelarForm.reset()}>
              Limpar
            </Button>
            <Button type="submit" disabled={cancelarMutation.isPending}>
              {cancelarMutation.isPending ? "Cancelando..." : "Cancelar NFSe"}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
