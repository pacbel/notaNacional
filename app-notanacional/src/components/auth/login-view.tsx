"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Loader2, Mail, ShieldCheck, Lock, Eye, EyeOff, Building2 } from "lucide-react";

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
import { Label } from "@/components/ui/label";
import { fetchWithAuth } from "@/lib/fetch-with-auth";

const credentialsSchema = z.object({
  email: z.string().email("Informe um e-mail válido"),
  senha: z.string().min(1, "Informe a senha"),
});

type CredentialsFormValues = z.infer<typeof credentialsSchema>;

const mfaSchema = z.object({
  code: z
    .string()
    .min(1, "Informe o código recebido")
    .max(6, "Código inválido"),
});

type MfaFormValues = z.infer<typeof mfaSchema>;

type Step = "credentials" | "mfa";

export default function LoginView() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("credentials");
  const [challengeToken, setChallengeToken] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [isCredentialsPending, setIsCredentialsPending] = useState(false);
  const [isMfaPending, setIsMfaPending] = useState(false);
  const [mfaCode, setMfaCode] = useState("");
  const [mfaError, setMfaError] = useState<string | null>(null);

  const [userEmail, setUserEmail] = useState<string>("");

  const credentialsForm = useForm<CredentialsFormValues>({
    resolver: zodResolver(credentialsSchema),
    defaultValues: {
      email: "",
      senha: "",
    },
  });

  useEffect(() => {
    if (step === "mfa") {
      setMfaCode("");
      setMfaError(null);
      const id = "mfa-code-input";
      window.requestAnimationFrame(() => {
        const input = document.getElementById(id) as HTMLInputElement | null;
        input?.focus();
      });
    }
  }, [step]);

  function handleCredentialsSubmit(values: CredentialsFormValues) {
    setIsCredentialsPending(true);
    setUserEmail(values.email);

    fetchWithAuth("/api/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(values),
    })
      .then(async (response) => {
        if (!response.ok) {
          const data = await response.json().catch(() => null);
          toast.error("Dados incorretos. Tente novamente.");
          throw new Error(data?.message ?? "Não foi possível autenticar");
        }

        const data = await response.json();
        setChallengeToken(data.challengeToken || "mfa-required");
        setStep("mfa");
        toast.success("Código enviado para seu e-mail");
      })
      .catch((error) => {
        const message = error instanceof Error ? error.message : "Erro inesperado";
        toast.error(message);
      })
      .finally(() => {
        setIsCredentialsPending(false);
      });
  }

  function handleMfaSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!userEmail) {
      toast.error("E-mail não encontrado. Tente novamente.");
      setStep("credentials");
      return;
    }

    if (!mfaCode.trim()) {
      setMfaError("Informe o código recebido");
      return;
    }

    setIsMfaPending(true);

    fetchWithAuth("/api/auth/mfa/verify", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email: userEmail, codigo: mfaCode }),
    })
      .then(async (response) => {
        if (!response.ok) {
          const data = await response.json().catch(() => null);
          throw new Error(data?.message ?? "Código inválido");
        }

        setMfaError(null);
        toast.success("Autenticado com sucesso!");
        router.replace("/dashboard");
        router.refresh();
      })
      .catch((error) => {
        const message = error instanceof Error ? error.message : "Erro inesperado";
        toast.error(message);
        setMfaError(message);
      })
      .finally(() => {
        setIsMfaPending(false);
      });
  }

  const isCredentialsStep = step === "credentials";

  return (
    <div className="flex min-h-screen items-center justify-center bg-linear-to-br from-background via-muted to-background px-4 py-12">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="space-y-1">
          <div className="flex items-center gap-3 text-primary">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#1351b4]">
              <Building2 className="h-5 w-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-2xl">Nota Nacional</CardTitle>
              <CardDescription>Emissão de documentos fiscais.</CardDescription>
            </div>
          </div>
        </CardHeader>

        <Separator className="my-2" />

        <CardContent>
          {isCredentialsStep ? (
            <Form {...credentialsForm}>
              <form
                className="space-y-6"
                onSubmit={credentialsForm.handleSubmit(handleCredentialsSubmit)}
              >
                <FormField
                  control={credentialsForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>E-mail</FormLabel>
                      <FormControl>
                        <Input
                          type="email"
                          placeholder="seu.email@empresa.com"
                          autoComplete="email"
                          disabled={isCredentialsPending}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={credentialsForm.control}
                  name="senha"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Senha</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            type={showPassword ? "text" : "password"}
                            placeholder="••••••••"
                            autoComplete="current-password"
                            disabled={isCredentialsPending}
                            {...field}
                          />
                          <button
                            type="button"
                            className="absolute inset-y-0 right-3 flex items-center text-muted-foreground transition hover:text-foreground"
                            onClick={() => setShowPassword((prev) => !prev)}
                            aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                          >
                            {showPassword ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button type="submit" className="w-full bg-blue-800 text-white hover:bg-blue-900" disabled={isCredentialsPending}>
                  {isCredentialsPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Autenticando...
                    </>
                  ) : (
                    <>
                      <Lock className="mr-2 h-4 w-4" /> Entrar</>
                  )}
                </Button>

                <Button variant="link" type="button" className="w-full text-red-600 hover:text-red-800" asChild>
                  <Link href="/recuperar-senha">Esqueci minha senha</Link>
                </Button>
                
              </form>
            </Form>
          ) : (
            <form className="space-y-6" onSubmit={handleMfaSubmit}>
              <div className="space-y-2 text-sm text-muted-foreground">
                <p>
                  Enviamos um código de verificação para o e-mail <b>{userEmail}</b>. <br/>Digite-o abaixo para acessar o sistema.
                </p>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="mfa-code-input">Código MFA</Label>
                <Input
                  id="mfa-code-input"
                  type="text"
                  inputMode="numeric"
                  placeholder="000000"
                  autoComplete="one-time-code"
                  maxLength={6}
                  value={mfaCode}
                  onChange={(event) => {
                    const sanitized = event.target.value.replace(/[^0-9]/g, "").slice(0, 6);
                    setMfaCode(sanitized);
                    setMfaError(null);
                  }}
                  disabled={isMfaPending}
                />
                {mfaError ? (
                  <p className="text-sm text-destructive">{mfaError}</p>
                ) : null}
              </div>

              <Button
                type="submit"
                className="w-full bg-blue-800 text-white hover:bg-blue-900"
                disabled={isMfaPending || mfaCode.length === 0}
              >
                {isMfaPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Validando código...
                  </>
                ) : (
                  <>
                    <Mail className="mr-2 h-4 w-4" /> Confirmar e acessar
                  </>
                )}
              </Button>

              <Button
                type="button"
                variant="link"
                className="w-full text-red-600 hover:text-red-800"
                disabled={isMfaPending}
                onClick={() => {
                  setIsMfaPending(false);
                  setStep("credentials");
                  setChallengeToken(null);
                  setMfaCode("");
                  setMfaError(null);
                }}
              >
                Voltar e trocar e-mail
              </Button>
            </form>
          )}
        </CardContent>

        <CardFooter className="flex flex-col gap-3 text-center text-xs text-muted-foreground">
          {/* <p>Autenticação multifator obrigatória para garantir a segurança das NFSe.</p>
          <p>Suporte: suporte@notaclient.com.br</p> */}
        </CardFooter>
      </Card>
    </div>
  );
}
