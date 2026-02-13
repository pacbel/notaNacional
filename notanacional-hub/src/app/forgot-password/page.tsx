"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Link from "next/link";
import { useAuth } from "@/contexts/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { handleApiError, handleSuccess } from "@/utils/toast";

const schema = z.object({
  email: z.string().email("Informe um e-mail válido"),
});

type FormValues = z.infer<typeof schema>;

export default function ForgotPasswordPage() {
  const { forgotPassword, isLoading } = useAuth();
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      email: "",
    },
  });

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      await forgotPassword(values);
      handleSuccess("Se o e-mail existir cadastrado, as instruções foram enviadas.");
    } catch (error) {
      handleApiError(error, "Falha ao solicitar recuperação de senha.");
    }
  });

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Recuperar senha</CardTitle>
          <CardDescription>
            Informe seu e-mail para receber as instruções de redefinição.
          </CardDescription>
        </CardHeader>
        <form onSubmit={onSubmit} className="space-y-6 p-6 pt-0">
          <fieldset className="space-y-1">
            <label htmlFor="email" className="text-sm font-medium text-slate-600">
              E-mail cadastrado
            </label>
            <Input
              id="email"
              type="email"
              placeholder="seu.email@empresa.com"
              {...form.register("email")}
              disabled={isLoading}
            />
            {form.formState.errors.email && (
              <span className="text-sm text-red-600">
                {form.formState.errors.email.message}
              </span>
            )}
          </fieldset>
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? "Enviando..." : "Enviar instruções"}
          </Button>
          <div className="text-center text-sm">
            <Link href="/login" className="font-medium text-slate-600 hover:text-slate-900">
              Voltar para o login
            </Link>
          </div>
        </form>
      </Card>
    </div>
  );
}
