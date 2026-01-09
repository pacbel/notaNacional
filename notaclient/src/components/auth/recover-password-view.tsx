"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Loader2, ShieldCheck, Mail, Lock, ArrowLeft } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

const requestSchema = z.object({
  email: z.string().email("Informe um e-mail válido"),
});

type RequestFormValues = z.infer<typeof requestSchema>;

const resetSchema = z
  .object({
    token: z.string().min(1, "Informe o token recebido"),
    code: z.string().min(1, "Informe o código recebido"),
    newPassword: z.string().min(8, "A nova senha precisa ter pelo menos 8 caracteres"),
    confirmPassword: z.string().min(8, "Confirme a nova senha"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    path: ["confirmPassword"],
    message: "As senhas não conferem",
  });

type ResetFormValues = z.infer<typeof resetSchema>;

type ViewMode = "request" | "sent" | "reset" | "success";

export default function RecoverPasswordView() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tokenFromUrl = searchParams.get("token") ?? "";

  const [viewMode, setViewMode] = useState<ViewMode>(tokenFromUrl ? "reset" : "request");
  const [isPending, startTransition] = useTransition();

  const requestForm = useForm<RequestFormValues>({
    resolver: zodResolver(requestSchema),
    defaultValues: {
      email: "",
    },
  });

  const resetForm = useForm<ResetFormValues>({
    resolver: zodResolver(resetSchema),
    defaultValues: {
      token: tokenFromUrl,
      code: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  useEffect(() => {
    if (tokenFromUrl) {
      resetForm.setValue("token", tokenFromUrl);
      setViewMode("reset");
    }
  }, [tokenFromUrl, resetForm]);

  function handleRequest(values: RequestFormValues) {
    startTransition(async () => {
      try {
        const response = await fetch("/api/auth/password/forgot", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(values),
        });

        if (!response.ok) {
          const data = await response.json().catch(() => null);
          throw new Error(data?.message ?? "Não foi possível enviar o e-mail");
        }

        toast.success("Se o e-mail estiver cadastrado, você receberá instruções em instantes.");
        setViewMode("sent");
      } catch (error) {
        const message = error instanceof Error ? error.message : "Erro inesperado";
        toast.error(message);
      }
    });
  }

  function handleReset(values: ResetFormValues) {
    startTransition(async () => {
      try {
        const response = await fetch("/api/auth/password/reset", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(values),
        });

        if (!response.ok) {
          const data = await response.json().catch(() => null);
          throw new Error(data?.message ?? "Não foi possível redefinir a senha");
        }

        toast.success("Senha redefinida com sucesso!");
        setViewMode("success");
        requestForm.reset();
        resetForm.reset({
          token: tokenFromUrl,
          code: "",
          newPassword: "",
          confirmPassword: "",
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : "Erro inesperado";
        toast.error(message);
      }
    });
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-linear-to-br from-background via-muted to-background px-4 py-12">
      <Card className="w-full max-w-xl shadow-xl">
        <CardHeader className="space-y-1">
          <div className="flex items-center gap-3 text-primary">
            <ShieldCheck className="h-8 w-8" />
            <div>
              <CardTitle className="text-2xl">Recuperação de senha</CardTitle>
              <CardDescription>Receba um código por e-mail e redefina com segurança.</CardDescription>
            </div>
          </div>
        </CardHeader>

        <Separator className="my-2" />

        <CardContent>
          {viewMode === "request" && (
            <Form {...requestForm}>
              <form
                className="space-y-6"
                onSubmit={requestForm.handleSubmit(handleRequest)}
              >
                <FormField
                  control={requestForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>E-mail cadastrado</FormLabel>
                      <FormControl>
                        <Input
                          type="email"
                          placeholder="seu.email@empresa.com"
                          autoComplete="email"
                          disabled={isPending}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button type="submit" className="w-full" disabled={isPending}>
                  {isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Enviando...
                    </>
                  ) : (
                    <>
                      <Mail className="mr-2 h-4 w-4" /> Enviar código
                    </>
                  )}
                </Button>
              </form>
            </Form>
          )}

          {viewMode === "sent" && (
            <div className="space-y-4 text-sm text-muted-foreground">
              <p>Se o e-mail informado estiver cadastrado, você receberá uma mensagem com um código de verificação.</p>
              <p>O código expira em poucos minutos. Caso não encontre o e-mail, verifique a caixa de spam ou tente novamente.</p>
              <Button
                variant="ghost"
                className="gap-2"
                onClick={() => setViewMode("request")}
              >
                <ArrowLeft className="h-4 w-4" /> Inserir outro e-mail
              </Button>
            </div>
          )}

          {viewMode === "reset" && (
            <Form {...resetForm}>
              <form
                className="space-y-6"
                onSubmit={resetForm.handleSubmit(handleReset)}
              >
                <FormField
                  control={resetForm.control}
                  name="token"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Token</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Cole o token do link recebido"
                          disabled={isPending || Boolean(tokenFromUrl)}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={resetForm.control}
                  name="code"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Código</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="000000"
                          inputMode="numeric"
                          disabled={isPending}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={resetForm.control}
                  name="newPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nova senha</FormLabel>
                      <FormControl>
                        <Input
                          type="password"
                          placeholder="••••••••"
                          autoComplete="new-password"
                          disabled={isPending}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={resetForm.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Confirmar nova senha</FormLabel>
                      <FormControl>
                        <Input
                          type="password"
                          placeholder="••••••••"
                          autoComplete="new-password"
                          disabled={isPending}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button type="submit" className="w-full" disabled={isPending}>
                  {isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Redefinindo...
                    </>
                  ) : (
                    <>
                      <Lock className="mr-2 h-4 w-4" /> Redefinir senha
                    </>
                  )}
                </Button>
              </form>
            </Form>
          )}

          {viewMode === "success" && (
            <div className="space-y-4 text-sm text-muted-foreground">
              <p>Sua senha foi atualizada com sucesso. Faça login novamente para continuar utilizando o sistema.</p>
              <Button
                className="w-full"
                onClick={() => {
                  router.replace("/");
                  router.refresh();
                }}
              >
                Voltar para o login
              </Button>
            </div>
          )}
        </CardContent>

        <CardFooter className="flex flex-col gap-3 text-center text-xs text-muted-foreground">
          <p>Se surgir alguma dúvida, contate o suporte via suporte@notaclient.com.br</p>
        </CardFooter>
      </Card>
    </div>
  );
}
