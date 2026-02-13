"use client";

import { Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "@/contexts/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { handleApiError, handleSuccess } from "@/utils/toast";

const schema = z
  .object({
    senha: z.string().min(6, "A nova senha deve conter pelo menos 6 caracteres."),
    confirmarSenha: z.string(),
  })
  .refine((data) => data.senha === data.confirmarSenha, {
    message: "As senhas não coincidem.",
    path: ["confirmarSenha"],
  });

type FormValues = z.infer<typeof schema>;

function ResetPasswordContent() {
  const params = useSearchParams();
  const router = useRouter();
  const token = params.get("token") ?? "";
  const { resetPassword, isLoading } = useAuth();

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      senha: "",
      confirmarSenha: "",
    },
  });

  const onSubmit = form.handleSubmit(async (values) => {
    if (!token) {
      handleApiError(new Error("Token inválido."));
      return;
    }

    try {
      await resetPassword({ token, novaSenha: values.senha });
      handleSuccess("Senha redefinida com sucesso. Faça login novamente.");
      router.push("/login");
    } catch (error) {
      handleApiError(error, "Falha ao redefinir senha.");
    }
  });

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Definir nova senha</CardTitle>
          <CardDescription>
            Crie uma nova senha segura para acessar o NFSe Hub.
          </CardDescription>
        </CardHeader>
        <form onSubmit={onSubmit} className="space-y-6 p-6 pt-0">
          <fieldset className="space-y-1">
            <label htmlFor="senha" className="text-sm font-medium text-slate-600">
              Nova senha
            </label>
            <Input
              id="senha"
              type="password"
              placeholder="••••••••"
              {...form.register("senha")}
              disabled={isLoading}
            />
            {form.formState.errors.senha && (
              <span className="text-sm text-red-600">
                {form.formState.errors.senha.message}
              </span>
            )}
          </fieldset>
          <fieldset className="space-y-1">
            <label
              htmlFor="confirmarSenha"
              className="text-sm font-medium text-slate-600"
            >
              Confirmar senha
            </label>
            <Input
              id="confirmarSenha"
              type="password"
              placeholder="••••••••"
              {...form.register("confirmarSenha")}
              disabled={isLoading}
            />
            {form.formState.errors.confirmarSenha && (
              <span className="text-sm text-red-600">
                {form.formState.errors.confirmarSenha.message}
              </span>
            )}
          </fieldset>
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? "Redefinindo..." : "Redefinir senha"}
          </Button>
        </form>
      </Card>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Carregando redefinição</CardTitle>
              <CardDescription>
                Aguarde enquanto preparamos o formulário de redefinição de senha.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      }
    >
      <ResetPasswordContent />
    </Suspense>
  );
}
