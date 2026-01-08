"use client";

import { ChangeEvent, useMemo, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useApiMutation } from "@/hooks/use-api-mutation";
import { useAuth } from "@/contexts/auth-context";
import { enviarNfseEmail } from "@/services/nfse";
import { obterTokenRobo } from "@/services/auth";
import { listarPrestadores } from "@/services/prestadores";
import { listarRobotClients } from "@/services/robot-clients";
import type { EnviarNfseEmailRequest } from "@/types/nfse";
import type { RobotClientDto } from "@/types/robot-clients";
import type { PrestadorDto } from "@/types/prestadores";
import type { RobotAuthResponse } from "@/types/auth";
import { Select } from "@/components/ui/select";
import { useApiQuery } from "@/hooks/use-api-query";

const MAX_ATTACHMENTS = 3;
const allowedRoles = new Set(["Administrador", "Gestao", "Operacao", "Robot"]);
const DEFAULT_EMAIL_HTML =
  '<html><body style="font-family:Arial,Helvetica,sans-serif;font-size:14px;color:#333;"><p>Olá,</p><p>Este é um e-mail enviado via API.</p><p>Atenciosamente,<br><strong>Pacbel Sistemas</strong></p></body></html>';

const attachmentSchema = z.object({
  fileName: z.string(),
  contentType: z.string(),
  contentBase64: z.string(),
  size: z.number().optional(),
});

const emailSchema = z.object({
  prestadorId: z.string().uuid("Selecione um prestador"),
  robotClientId: z.string().min(1, "Selecione um cliente robótico"),
  robotClientSecret: z
    .string()
    .trim()
    .min(8, "Informe o secret do cliente robótico (mínimo 8 caracteres)"),
  destinatarios: z
    .string()
    .trim()
    .min(1, "Informe ao menos um destinatário")
    .superRefine((value, ctx) => {
      const lista = parseDestinatarios(value);

      if (lista.length === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Informe destinatários válidos",
        });
        return;
      }

      const invalidos = lista.filter((email) => !EMAIL_REGEX.test(email));
      if (invalidos.length > 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Os seguintes e-mails são inválidos: ${invalidos.join(", ")}`,
        });
      }
    }),
  assunto: z.string().min(3, "Informe o assunto"),
  corpoHtml: z.string().min(1, "Informe o conteúdo do e-mail"),
  anexos: z.array(attachmentSchema).max(MAX_ATTACHMENTS, `Máximo de ${MAX_ATTACHMENTS} anexos`),
});

type EmailFormValues = z.infer<typeof emailSchema>;

type EmailPayload = EnviarNfseEmailRequest;

type MutationVariables = {
  prestadorId: string;
  robotClientId: string;
  robotSecret: string;
  payload: EmailPayload;
};

export default function NfseEmailsPage() {
  const { roles, isAuthenticated } = useAuth();
  const hasAccess = useMemo(() => roles.some((role) => allowedRoles.has(role)), [roles]);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [robotClients, setRobotClients] = useState<RobotClientDto[]>([]);
  const [isLoadingRobots, setIsLoadingRobots] = useState(false);

  const form = useForm<EmailFormValues>({
    resolver: zodResolver(emailSchema),
    defaultValues: {
      prestadorId: "",
      robotClientId: "",
      robotClientSecret: "",
      destinatarios: "",
      assunto: "",
      corpoHtml: DEFAULT_EMAIL_HTML,
      anexos: [],
    },
  });

  const prestadoresQuery = useApiQuery<PrestadorDto[]>({
    queryKey: ["prestadores-emails"],
    queryFn: listarPrestadores,
    enabled: hasAccess && isAuthenticated,
  });

  const prestadores = prestadoresQuery.data ?? [];

  const handlePrestadorChange = async (event: ChangeEvent<HTMLSelectElement>) => {
    const value = event.target.value;
    form.setValue("prestadorId", value, { shouldDirty: true, shouldTouch: true, shouldValidate: true });
    form.setValue("robotClientId", "", { shouldDirty: true, shouldTouch: true, shouldValidate: true });
    form.setValue("robotClientSecret", "", { shouldDirty: true, shouldTouch: true, shouldValidate: true });
    setRobotClients([]);

    if (!value) {
      return;
    }

    try {
      setIsLoadingRobots(true);
      const robots = await listarRobotClients(value, false);
      const ativosComEmail = robots.filter((robot) => robot.ativo && robot.scopes.some((scope) => scope.toLowerCase() === "nfse.email"));
      setRobotClients(ativosComEmail);

      if (ativosComEmail.length === 0) {
        toast.error("Nenhum cliente robótico com escopo nfse.email encontrado para este prestador.");
      }
    } catch (error) {
      toast.error("Não foi possível carregar os clientes robóticos.");
    } finally {
      setIsLoadingRobots(false);
    }
  };

  const anexos = form.watch("anexos");

  const mutation = useApiMutation<void, unknown, MutationVariables>(
    async ({ prestadorId, robotClientId, robotSecret, payload }) => {
      const robot = robotClients.find((item) => item.id === robotClientId);
      if (!robot) {
        throw new Error("Cliente robótico inválido.");
      }

      let token: RobotAuthResponse | null = null;
      try {
        token = await obterTokenRobo({
          clientId: robot.clientId,
          clientSecret: robotSecret,
          scope: "nfse.email",
        });
      } catch (error) {
        throw new Error("Não foi possível obter o token do robô. Verifique as credenciais fornecidas.");
      }

      await enviarNfseEmail(payload, token.accessToken);
    },
    {
      successMessage: "E-mail enviado.",
      onSuccess: () => {
        form.reset();
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
        setRobotClients([]);
      },
    }
  );

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) {
      return;
    }

    const currentAttachments = form.getValues("anexos");

    if (currentAttachments.length + files.length > MAX_ATTACHMENTS) {
      toast.error(`Selecione no máximo ${MAX_ATTACHMENTS} arquivos.`);
      event.target.value = "";
      return;
    }

    try {
      const converted = await Promise.all(
        Array.from(files).map(async (file) => ({
          fileName: file.name,
          contentType: file.type || "application/octet-stream",
          contentBase64: await fileToBase64(file),
          size: file.size,
        }))
      );

      form.setValue("anexos", [...currentAttachments, ...converted], {
        shouldDirty: true,
        shouldTouch: true,
        shouldValidate: true,
      });
    } catch (error) {
      toast.error("Não foi possível processar os anexos selecionados.");
    } finally {
      event.target.value = "";
    }
  };

  const removeAttachment = (index: number) => {
    const next = form.getValues("anexos").filter((_, idx) => idx !== index);
    form.setValue("anexos", next, {
      shouldDirty: true,
      shouldTouch: true,
      shouldValidate: true,
    });
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleClear = () => {
    form.reset();
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    setRobotClients([]);
  };

  const onSubmit = form.handleSubmit(async (values) => {
    const payload: EmailPayload = {
      destinatarios: parseDestinatarios(values.destinatarios),
      assunto: values.assunto,
      corpoHtml: values.corpoHtml,
      anexos:
        values.anexos.length > 0
          ? values.anexos.map(({ fileName, contentBase64, contentType }) => ({
              fileName,
              contentBase64,
              contentType,
            }))
          : undefined,
    };

    await mutation.mutateAsync({
      prestadorId: values.prestadorId,
      robotClientId: values.robotClientId,
      robotSecret: values.robotClientSecret,
      payload,
    });
  });

  if (!isAuthenticated || !hasAccess) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Card className="max-w-md p-8 text-center text-sm text-slate-600">
          Seu perfil não possui acesso a esta funcionalidade.
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold text-slate-900">Teste de Envio de E-mails</h1>
        <p className="text-sm text-slate-500">
          Utilize este formulário para testar o envio de e-mails com os dados SMTP do prestador.
        </p>
      </header>

      <Card className="p-6">
        <form onSubmit={onSubmit} className="space-y-5">
          <div className="space-y-1">
            <label htmlFor="prestador" className="text-sm font-medium text-slate-600">
              Prestador
            </label>
            <Select
              id="prestador"
              value={form.watch("prestadorId")}
              onChange={handlePrestadorChange}
            >
              <option value="">Selecione</option>
              {prestadores.map((prestador) => (
                <option key={prestador.id} value={prestador.id}>
                  {prestador.nomeFantasia} ({prestador.cnpj})
                </option>
              ))}
            </Select>
            {form.formState.errors.prestadorId && (
              <span className="text-xs text-red-600">{form.formState.errors.prestadorId.message}</span>
            )}
          </div>

          <div className="space-y-1">
            <label htmlFor="robotClient" className="text-sm font-medium text-slate-600">
              Cliente robótico
            </label>
            <Select
              id="robotClient"
              value={form.watch("robotClientId")}
              onChange={(event) =>
                form.setValue("robotClientId", event.target.value, {
                  shouldDirty: true,
                  shouldTouch: true,
                  shouldValidate: true,
                })
              }
              disabled={!form.watch("prestadorId") || isLoadingRobots}
            >
              <option value="">{isLoadingRobots ? "Carregando..." : "Selecione"}</option>
              {robotClients.map((client) => (
                <option key={client.id} value={client.id}>
                  {client.nome} — {client.clientId}
                </option>
              ))}
            </Select>
            {form.formState.errors.robotClientId && (
              <span className="text-xs text-red-600">{form.formState.errors.robotClientId.message}</span>
            )}
          </div>

          <div className="space-y-1">
            <label htmlFor="robotClientSecret" className="text-sm font-medium text-slate-600">
              Client secret
            </label>
            <Input
              id="robotClientSecret"
              type="password"
              placeholder="Informe o secret do cliente robótico"
              {...form.register("robotClientSecret")}
              disabled={!form.watch("robotClientId")}
            />
            {form.formState.errors.robotClientSecret && (
              <span className="text-xs text-red-600">{form.formState.errors.robotClientSecret.message}</span>
            )}
          </div>

          <div className="space-y-1">
            <label htmlFor="destinatarios" className="text-sm font-medium text-slate-600">
              Destinatários
            </label>
            <Textarea
              id="destinatarios"
              rows={3}
              placeholder="Ex.: email@dominio.com, outro@dominio.com"
              {...form.register("destinatarios")}
            />
            <p className="text-xs text-slate-400">Separe múltiplos e-mails por vírgula, ponto e vírgula ou quebra de linha.</p>
            {form.formState.errors.destinatarios && (
              <span className="text-xs text-red-600">{form.formState.errors.destinatarios.message as string}</span>
            )}
          </div>

          <div className="space-y-1">
            <label htmlFor="assunto" className="text-sm font-medium text-slate-600">
              Assunto
            </label>
            <Input id="assunto" placeholder="Informe o assunto do e-mail" {...form.register("assunto")} />
            {form.formState.errors.assunto && (
              <span className="text-xs text-red-600">{form.formState.errors.assunto.message}</span>
            )}
          </div>

          <div className="space-y-1">
            <label htmlFor="corpoHtml" className="text-sm font-medium text-slate-600">
              Corpo do e-mail (HTML)
            </label>
            <Textarea
              id="corpoHtml"
              rows={8}
              placeholder="Insira o conteúdo em HTML que será enviado"
              {...form.register("corpoHtml")}
            />
            {form.formState.errors.corpoHtml && (
              <span className="text-xs text-red-600">{form.formState.errors.corpoHtml.message}</span>
            )}
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label htmlFor="anexos" className="text-sm font-medium text-slate-600">
                Anexos (opcional)
              </label>
              <span className="text-xs text-slate-400">Máximo de {MAX_ATTACHMENTS} arquivos</span>
            </div>
            <Input
              ref={fileInputRef}
              id="anexos"
              type="file"
              multiple
              onChange={handleFileChange}
            />
            {form.formState.errors.anexos && (
              <span className="text-xs text-red-600">{form.formState.errors.anexos.message as string}</span>
            )}

            {anexos.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {anexos.map((anexo, index) => (
                  <Badge key={`${anexo.fileName}-${index}`} className="flex items-center gap-2 bg-slate-100">
                    <span className="text-xs font-medium text-slate-700">{anexo.fileName}</span>
                    <span className="text-[10px] text-slate-500">{formatFileSize(anexo.size)}</span>
                    <button
                      type="button"
                      className="text-xs text-red-600 hover:underline"
                      onClick={() => removeAttachment(index)}
                    >
                      Remover
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={handleClear} disabled={mutation.isPending}>
              Limpar
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? "Enviando..." : "Enviar e-mail"}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}

const EMAIL_REGEX = /^[\w.!#$%&'*+/=?^`{|}~-]+@[\w-]+(?:\.[\w-]+)+$/i;

async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;
      if (typeof result === "string") {
        const base64 = result.split(",")[1] ?? "";
        resolve(base64);
      } else {
        reject(new Error("Não foi possível ler o arquivo."));
      }
    };
    reader.onerror = () => reject(reader.error ?? new Error("Não foi possível ler o arquivo."));
    reader.readAsDataURL(file);
  });
}

function parseDestinatarios(value: string): string[] {
  return value
    .split(/[;,\n]+/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function formatFileSize(size?: number) {
  if (!size) {
    return "--";
  }

  const units = ["B", "KB", "MB", "GB"] as const;
  let value = size;
  let unitIndex = 0;

  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex += 1;
  }

  return `${value.toFixed(value < 10 && unitIndex > 0 ? 1 : 0)} ${units[unitIndex]}`;
}
