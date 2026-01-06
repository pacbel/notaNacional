"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuth } from "@/contexts/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { handleApiError } from "@/utils/toast";
import { Eye, EyeOff } from "lucide-react";

const loginSchema = z.object({
  email: z.string().email("Informe um e-mail válido"),
  senha: z.string().min(6, "Informe sua senha"),
});

const mfaSchema = z.object({
  email: z.string().email(),
  codigo: z.string().min(4, "Informe o código recebido"),
});

type LoginFormValues = z.infer<typeof loginSchema>;
type MfaFormValues = z.infer<typeof mfaSchema>;

export default function LoginPage() {
  const { login, confirmMfa, mfaChallenge, isLoading } = useAuth();
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  const loginForm = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      senha: "",
    },
  });

  const mfaForm = useForm<MfaFormValues>({
    resolver: zodResolver(mfaSchema),
    defaultValues: {
      email: mfaChallenge?.email ?? "",
      codigo: "",
    },
  });

  useEffect(() => {
    if (mfaChallenge?.email) {
      mfaForm.setValue("email", mfaChallenge.email);
    }
  }, [mfaChallenge, mfaForm]);

  const handleLogin = loginForm.handleSubmit(async (values) => {
    try {
      await login(values);
    } catch (error) {
      handleApiError(error, "Não foi possível iniciar o login.");
    }
  });

  const handleConfirmMfa = mfaForm.handleSubmit(async (values) => {
    try {
      await confirmMfa(values);
    } catch (error) {
      handleApiError(error, "Não foi possível confirmar o código.");
    }
  });

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>{mfaChallenge ? "Confirme sua identidade" : "Acesso ao NFSe Hub"}</CardTitle>
          <CardDescription>
            {mfaChallenge
              ? "Informe o código enviado para continuar."
              : "Entre com suas credenciais para acessar a plataforma."}
          </CardDescription>
        </CardHeader>
        <div className="space-y-6 p-6 pt-0">
          {!mfaChallenge ? (
            <form onSubmit={handleLogin} className="space-y-4">
              <fieldset className="space-y-1">
                <label htmlFor="email" className="text-sm font-medium text-slate-600">
                  E-mail
                </label>
                <Input
                  id="email"
                  type="email"
                  placeholder="seu.email@empresa.com"
                  {...loginForm.register("email")}
                  disabled={isLoading}
                />
                {loginForm.formState.errors.email && (
                  <span className="text-sm text-red-600">
                    {loginForm.formState.errors.email.message}
                  </span>
                )}
              </fieldset>
              <fieldset className="space-y-1">
                <label htmlFor="senha" className="text-sm font-medium text-slate-600">
                  Senha
                </label>
                <div className="relative">
                  <Input
                    id="senha"
                    type={isPasswordVisible ? "text" : "password"}
                    placeholder="••••••••"
                    className="pr-10"
                    {...loginForm.register("senha")}
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 flex items-center px-3 text-slate-500 hover:text-slate-700 focus-visible:outline-none disabled:cursor-not-allowed disabled:text-slate-300"
                    onClick={() => setIsPasswordVisible((visible) => !visible)}
                    aria-label={isPasswordVisible ? "Ocultar senha" : "Mostrar senha"}
                    disabled={isLoading}
                  >
                    {isPasswordVisible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {loginForm.formState.errors.senha && (
                  <span className="text-sm text-red-600">
                    {loginForm.formState.errors.senha.message}
                  </span>
                )}
              </fieldset>
              <div className="flex items-center justify-between">
                <Link
                  href="/forgot-password"
                  className="text-sm font-medium text-slate-600 hover:text-slate-900"
                >
                  Esqueci minha senha
                </Link>
              </div>
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Enviando..." : "Entrar"}
              </Button>
            </form>
          ) : (
            <form onSubmit={handleConfirmMfa} className="space-y-4">
              <fieldset className="space-y-1">
                <label htmlFor="email" className="text-sm font-medium text-slate-600">
                  E-mail
                </label>
                <Input
                  id="email"
                  type="email"
                  disabled
                  {...mfaForm.register("email")}
                />
              </fieldset>
              <fieldset className="space-y-1">
                <label htmlFor="codigo" className="text-sm font-medium text-slate-600">
                  Código MFA
                </label>
                <Input
                  id="codigo"
                  placeholder="Informe o código recebido"
                  {...mfaForm.register("codigo")}
                  disabled={isLoading}
                />
                {mfaForm.formState.errors.codigo && (
                  <span className="text-sm text-red-600">
                    {mfaForm.formState.errors.codigo.message}
                  </span>
                )}
              </fieldset>
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Confirmando..." : "Confirmar código"}
              </Button>
              <button
                type="button"
                className="w-full text-center text-sm font-medium text-slate-500 hover:text-slate-900"
                onClick={() => window.location.reload()}
              >
                Tentar novamente
              </button>
            </form>
          )}
        </div>
      </Card>
    </div>
  );
}
