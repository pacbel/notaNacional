"use client";

import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { StepIndicator } from "./components/step-indicator";
import { useOnboardingStore } from "./store";
import { prestadorSchema, PrestadorFormValues } from "@/schemas/prestador";
import {
  gestorCredentialsSchema,
  GestorCredentialsFormValues,
  gestorCodigoSchema,
  GestorCodigoFormValues,
} from "@/schemas/gestor";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { CheckCircle2 } from "lucide-react";
import { onlyDigits, formatInscricaoEstadual, formatInscricaoMunicipal, formatTelefone } from "@/utils/masks";
import { listarUfs, listarMunicipiosPorUf, IbgeUf, IbgeMunicipio } from "@/services/ibge";
import {
  criarPrestadorOnboarding,
  criarRobotClientOnboarding,
  criarUsuarioGestorOnboarding,
  copiarConfiguracaoPadraoParaPrestador,
} from "@/services/onboarding-prestador";
import type { CreatePrestadorDto } from "@/types/prestadores";
import type { CreateRobotClientDto } from "@/types/robot-clients";
import type { CreateUsuarioDto } from "@/types/usuarios";
import { useApiMutation } from "@/hooks/use-api-mutation";
import { sendGestorMfa, confirmGestorMfa } from "@/services/onboarding";
import { useAuth } from "@/contexts/auth-context";
import { handleApiError } from "@/utils/toast";
import { useRouter } from "next/navigation";

interface ViaCepResponse {
  cep?: string;
  logradouro?: string;
  complemento?: string;
  bairro?: string;
  localidade?: string;
  uf?: string;
  ibge?: string;
  erro?: boolean;
}

function mapPrestadorFormToPayload(values: PrestadorFormValues): CreatePrestadorDto {
  return {
    ...values,
    inscricaoMunicipal: values.inscricaoMunicipal || "",
    inscricaoEstadual: values.inscricaoEstadual || null,
    telefone: values.telefone || null,
    email: values.email || null,
    website: values.website || null,
    endereco: {
      ...values.endereco,
      complemento: values.endereco.complemento || null,
      cidade: values.endereco.cidade || null,
      uf: values.endereco.uf || null,
      cep: values.endereco.cep || null,
    },
  } satisfies CreatePrestadorDto;
}

function buildRobotClientPayload(values: PrestadorFormValues): CreateRobotClientDto {
  return {
    nome: `${values.nomeFantasia} - Robô integrador`,
    scopes: [...ROBO_SCOPES],
    ativo: true,
    gerarClientIdAutomatico: true,
    gerarSecretAutomatico: true,
  } satisfies CreateRobotClientDto;
}

function GestorStep() {
  const { isLoading: isAuthLoading } = useAuth();
  const { gestor, saveGestor, setStep, prestador, prestadorId } = useOnboardingStore((state) => ({
    gestor: state.gestor,
    saveGestor: state.saveGestor,
    setStep: state.setStep,
    prestador: state.prestador,
    prestadorId: state.prestadorId,
  }));

  useEffect(() => {
    if (!prestador) {
      setStep("prestador");
    }
  }, [prestador, setStep]);

  const [mfaToken, setMfaToken] = useState<string | undefined>(gestor?.mfaToken);
  const [emailBloqueado, setEmailBloqueado] = useState<boolean>(Boolean(gestor?.email));

  const credenciaisForm = useForm<GestorCredentialsFormValues>({
    resolver: zodResolver(gestorCredentialsSchema),
    defaultValues:
      gestor?.codigoMfa
        ? {
            nome: gestor.nome,
            email: gestor.email,
            senha: "",
            confirmarSenha: "",
          }
        : gestor ?? DEFAULT_GESTOR_VALUES,
    mode: "onChange",
  });

  const codigoForm = useForm<GestorCodigoFormValues>({
    resolver: zodResolver(gestorCodigoSchema),
    defaultValues: gestor?.codigoMfa ? { codigo: gestor.codigoMfa } : DEFAULT_GESTOR_CODIGO_VALUES,
    mode: "onChange",
  });

  useEffect(() => {
    if (gestor?.codigoMfa) {
      credenciaisForm.reset({
        nome: gestor.nome,
        email: gestor.email,
        senha: "",
        confirmarSenha: "",
      });
      codigoForm.reset({ codigo: gestor.codigoMfa });
      setMfaToken(gestor.mfaToken);
      setEmailBloqueado(true);
    }
  }, [gestor, credenciaisForm, codigoForm]);

  const enviarMfaMutation = useApiMutation(sendGestorMfa, {
    onSuccess: (response, variables) => {
      setMfaToken(response.token);
      setEmailBloqueado(true);
      codigoForm.reset(DEFAULT_GESTOR_CODIGO_VALUES);
      toast.success("Código enviado. Verifique seu e-mail.");
      saveGestor({
        nome: variables.nome,
        email: variables.email,
        senha: variables.senha,
        codigoMfa: "",
        mfaToken: response.token,
      });
    },
    onError: (error) => {
      handleApiError(error, "Não foi possível enviar o código MFA.");
    },
  });

  const confirmarMfaMutation = useApiMutation(confirmGestorMfa, {
    onSuccess: (response, variables) => {
      if (!response.sucesso) {
        toast.error(response.mensagem ?? "Não foi possível validar o código.");
        return;
      }

      const credenciais = credenciaisForm.getValues();
      const resolvedToken = response.token ?? mfaToken;

      saveGestor({
        nome: credenciais.nome,
        email: credenciais.email,
        senha: credenciais.senha,
        codigoMfa: variables.codigo,
        mfaToken: resolvedToken,
      });

      toast.success("Código validado com sucesso. Revise os dados antes de confirmar o onboarding.");
      setStep("resumo");
    },
    onError: (error) => {
      handleApiError(error, "Não foi possível validar o código MFA.");
    },
  });

  const estaEnviandoMfa = enviarMfaMutation.isPending || isAuthLoading;
  const estaConfirmandoMfa = confirmarMfaMutation.isPending || isAuthLoading;

  const handleEnviarCodigo = credenciaisForm.handleSubmit((values) => {
    enviarMfaMutation.mutate({
      nome: values.nome,
      email: values.email,
      senha: values.senha,
    });
  });

  const handleConfirmarCodigo = codigoForm.handleSubmit((values) => {
    if (!emailBloqueado) {
      toast.error("Envie o código antes de confirmar.");
      return;
    }

    const credenciais = credenciaisForm.getValues();
    confirmarMfaMutation.mutate({
      email: credenciais.email,
      codigo: values.codigo,
      token: mfaToken,
    });
  });

  const handleEditarDados = () => {
    setMfaToken(undefined);
    setEmailBloqueado(false);
    codigoForm.reset(DEFAULT_GESTOR_CODIGO_VALUES);
  };

  const podeEnviarCodigo = credenciaisForm.formState.isValid && !emailBloqueado;
  const podeConfirmarCodigo = codigoForm.formState.isValid && emailBloqueado;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Usuário gestor</CardTitle>
        <CardDescription>
          Defina as credenciais do gestor responsável. Um código MFA será enviado para validar o acesso.
        </CardDescription>
      </CardHeader>
      <div className="space-y-8 px-6 pb-6">
        <section className="space-y-4">
          <header className="flex flex-col justify-between gap-3 md:flex-row md:items-center">
            <div>
              <h2 className="text-lg font-semibold text-slate-800">Credenciais do gestor</h2>
              <p className="text-sm text-slate-500">
                Informe os dados do usuário gestor. Após enviar o código, o e-mail será bloqueado para evitar alterações.
              </p>
            </div>
            {emailBloqueado && (
              <Button type="button" variant="ghost" onClick={handleEditarDados} disabled={estaEnviandoMfa || estaConfirmandoMfa}>
                Editar dados
              </Button>
            )}
          </header>

          <form onSubmit={handleEnviarCodigo} className="grid gap-4 md:grid-cols-2">
            <div className="space-y-1 md:col-span-2">
              <label htmlFor="gestor-nome" className="text-sm font-medium text-slate-600">
                Nome completo
              </label>
              <Input id="gestor-nome" disabled={emailBloqueado} {...credenciaisForm.register("nome")}/>
              {credenciaisForm.formState.errors.nome && (
                <p className="text-sm text-red-600">{credenciaisForm.formState.errors.nome.message}</p>
              )}
            </div>

            <div className="space-y-1 md:col-span-2">
              <label htmlFor="gestor-email" className="text-sm font-medium text-slate-600">
                E-mail corporativo
              </label>
              <Input id="gestor-email" type="email" disabled={emailBloqueado} {...credenciaisForm.register("email")}/>
              {credenciaisForm.formState.errors.email && (
                <p className="text-sm text-red-600">{credenciaisForm.formState.errors.email.message}</p>
              )}
            </div>

            <div className="space-y-1">
              <label htmlFor="gestor-senha" className="text-sm font-medium text-slate-600">
                Senha provisória
              </label>
              <Input id="gestor-senha" type="password" disabled={emailBloqueado} {...credenciaisForm.register("senha")}/>
              {credenciaisForm.formState.errors.senha && (
                <p className="text-sm text-red-600">{credenciaisForm.formState.errors.senha.message}</p>
              )}
            </div>

            <div className="space-y-1">
              <label htmlFor="gestor-confirmar-senha" className="text-sm font-medium text-slate-600">
                Confirmar senha
              </label>
              <Input
                id="gestor-confirmar-senha"
                type="password"
                disabled={emailBloqueado}
                {...credenciaisForm.register("confirmarSenha")}
              />
              {credenciaisForm.formState.errors.confirmarSenha && (
                <p className="text-sm text-red-600">{credenciaisForm.formState.errors.confirmarSenha.message}</p>
              )}
            </div>

            <div className="md:col-span-2 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
              <p className="text-sm text-slate-500">
                A senha deve atender aos requisitos de complexidade e será utilizada apenas no primeiro acesso.
              </p>
              <Button type="submit" disabled={!podeEnviarCodigo || estaEnviandoMfa}>
                {estaEnviandoMfa ? "Enviando código..." : emailBloqueado ? "Código enviado" : "Enviar código MFA"}
              </Button>
            </div>
          </form>
        </section>

        <section className="space-y-4">
          <header className="flex flex-col gap-2">
            <h2 className="text-lg font-semibold text-slate-800">Confirmação MFA</h2>
            <p className="text-sm text-slate-500">
              Após receber o código por e-mail, informe-o abaixo para validar o usuário gestor e avançar.
            </p>
          </header>

          <form onSubmit={handleConfirmarCodigo} className="space-y-4">
            <div className="space-y-1">
              <label htmlFor="gestor-codigo" className="text-sm font-medium text-slate-600">
                Código MFA
              </label>
              <Input
                id="gestor-codigo"
                inputMode="numeric"
                placeholder="Informe o código recebido"
                disabled={!emailBloqueado}
                {...codigoForm.register("codigo")}
              />
              {codigoForm.formState.errors.codigo && (
                <p className="text-sm text-red-600">{codigoForm.formState.errors.codigo.message}</p>
              )}
            </div>

            <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
              <p className="text-sm text-slate-500">
                Caso não tenha recebido, reenvie o código após revisar o e-mail informado.
              </p>
              <Button type="submit" disabled={!podeConfirmarCodigo || estaConfirmandoMfa}>
                {estaConfirmandoMfa ? "Validando..." : "Validar código e avançar"}
              </Button>
            </div>
          </form>
        </section>
      </div>
    </Card>
  );
}

function ResumoStep() {
  const router = useRouter();
  const {
    prestador,
    prestadorPayload,
    robotPayload,
    prestadorId,
    gestor,
    robot,
    setStep,
    savePrestador,
    saveGestor,
    setRobot,
  } = useOnboardingStore((state) => ({
    prestador: state.prestador,
    prestadorPayload: state.prestadorPayload,
    robotPayload: state.robotPayload,
    prestadorId: state.prestadorId,
    gestor: state.gestor,
    robot: state.robot,
    setStep: state.setStep,
    savePrestador: state.savePrestador,
    saveGestor: state.saveGestor,
    setRobot: state.setRobot,
  }));
  const [secondsRemaining, setSecondsRemaining] = useState(30);
  const [hasNavigated, setHasNavigated] = useState(false);
  const systemUrl = process.env.NEXT_PUBLIC_SYSTEM_URL;
  const redirectUrl = systemUrl && systemUrl.trim().length > 0 ? systemUrl.trim() : "/dashboard";
  const hasRedirectUrl = true;

  const criarPrestadorMutation = useApiMutation(
    ({ data, token }: { data: CreatePrestadorDto; token?: string }) => criarPrestadorOnboarding(data, token),
    {
      successMessage: "Prestador cadastrado com sucesso.",
    }
  );

  const copiarConfiguracaoMutation = useApiMutation(
    (id: string) => copiarConfiguracaoPadraoParaPrestador(id),
    {
      successMessage: "Configuração inicial aplicada automaticamente.",
    }
  );

  const criarRobotMutation = useApiMutation(
    ({ prestadorId: id, dados, token }: { prestadorId: string; dados: CreateRobotClientDto; token?: string }) =>
      criarRobotClientOnboarding(id, dados, token),
    {
      successMessage: "Robô integrador provisionado automaticamente.",
      onSuccess: (robotData) => {
        setRobot({
          id: robotData.id,
          nome: robotData.nome,
          clientId: robotData.clientId,
          secret: robotData.clientSecret ?? robotData.secretGerado ?? null,
          scopes: robotData.scopes,
        });
      },
      onError: () => {
        setRobot(undefined);
      },
    }
  );

  const criarUsuarioGestorMutation = useApiMutation(
    (payload: CreateUsuarioDto) => criarUsuarioGestorOnboarding(payload),
    {
      successMessage: "Usuário gestor criado automaticamente.",
    }
  );

  const isProvisioning =
    criarPrestadorMutation.isPending ||
    copiarConfiguracaoMutation.isPending ||
    criarRobotMutation.isPending ||
    criarUsuarioGestorMutation.isPending;

  const handleNavigate = useCallback(() => {
    if (hasNavigated) {
      return;
    }

    setHasNavigated(true);
    console.info("[Onboarding][Resumo] Redirecionando usuário após onboarding", {
      timestamp: new Date().toISOString(),
      redirectUrl,
    });

    router.push(redirectUrl);
  }, [router, redirectUrl, hasNavigated]);

  const handleConfirmarOnboarding = useCallback(async () => {
    console.info("[Onboarding][Resumo] Iniciando confirmação do onboarding", {
      prestadorIdSalvo: prestadorId,
      possuiPrestador: Boolean(prestador),
      possuiGestor: Boolean(gestor),
      possuiPayload: Boolean(prestadorPayload),
      possuiRobotPayload: Boolean(robotPayload),
      timestamp: new Date().toISOString(),
    });

    if (!prestador || !prestadorPayload) {
      toast.error("Dados do prestador não encontrados. Volte e preencha novamente.");
      console.warn("[Onboarding][Resumo] Dados do prestador ausentes ao confirmar", {
        possuiPrestador: Boolean(prestador),
        possuiPayload: Boolean(prestadorPayload),
        timestamp: new Date().toISOString(),
      });
      setStep("prestador");
      return;
    }

    if (!gestor) {
      toast.error("Dados do gestor não encontrados. Volte e preencha novamente.");
      console.warn("[Onboarding][Resumo] Dados do gestor ausentes ao confirmar", {
        possuiGestor: Boolean(gestor),
        timestamp: new Date().toISOString(),
      });
      setStep("gestor");
      return;
    }

    try {
      console.info("[Onboarding][Resumo] Criando prestador", {
        timestamp: new Date().toISOString(),
        payload: prestadorPayload,
      });
      const prestadorCriado = await criarPrestadorMutation.mutateAsync({ data: prestadorPayload });

      savePrestador(prestador, { id: prestadorCriado.id, payload: prestadorPayload, robotPayload });
      console.info("[Onboarding][Resumo] Prestador criado e salvo na store", {
        timestamp: new Date().toISOString(),
        prestadorId: prestadorCriado.id,
      });

      console.info("[Onboarding][Resumo] Aplicando configuração padrão", {
        timestamp: new Date().toISOString(),
        prestadorId: prestadorCriado.id,
      });
      await copiarConfiguracaoMutation.mutateAsync(prestadorCriado.id);

      if (robotPayload) {
        console.info("[Onboarding][Resumo] Provisionando robô", {
          timestamp: new Date().toISOString(),
          prestadorId: prestadorCriado.id,
          payload: robotPayload,
        });
        await criarRobotMutation.mutateAsync({ prestadorId: prestadorCriado.id, dados: robotPayload });
      } else {
        console.info("[Onboarding][Resumo] Robô não será provisionado (payload ausente)", {
          timestamp: new Date().toISOString(),
          prestadorId: prestadorCriado.id,
        });
        setRobot(undefined);
      }

      console.info("[Onboarding][Resumo] Criando usuário gestor", {
        timestamp: new Date().toISOString(),
        prestadorId: prestadorCriado.id,
        email: gestor.email,
        payload: {
          nome: gestor.nome,
          email: gestor.email,
          possuiSenha: Boolean(gestor.senha),
        },
      });
      const usuario = await criarUsuarioGestorMutation.mutateAsync({
        nome: gestor.nome,
        email: gestor.email,
        senha: gestor.senha,
        prestadorId: prestadorCriado.id,
        role: "Gestao",
      } satisfies CreateUsuarioDto);

      saveGestor({
        nome: gestor.nome,
        email: gestor.email,
        senha: "",
        codigoMfa: gestor.codigoMfa,
        mfaToken: gestor.mfaToken,
        usuarioId: usuario.id,
      });

      toast.success("Onboarding provisionado com sucesso.");
      console.info("[Onboarding][Resumo] Onboarding provisionado com sucesso", {
        timestamp: new Date().toISOString(),
        prestadorId: prestadorCriado.id,
        usuarioId: usuario.id,
        possuiRobot: Boolean(robotPayload),
      });
    } catch (error) {
      console.error("[Onboarding] Falha ao provisionar onboarding completo", error);
      if (!(error instanceof Error)) {
        toast.error("Falha ao concluir o onboarding. Revise os dados e tente novamente.");
      }
      console.error("[Onboarding][Resumo] Erro durante confirmação", {
        timestamp: new Date().toISOString(),
        erro: error,
      });
    }
  }, [
    prestador,
    prestadorPayload,
    gestor,
    robotPayload,
    setStep,
    setRobot,
    savePrestador,
    saveGestor,
    criarPrestadorMutation,
    copiarConfiguracaoMutation,
    criarRobotMutation,
    criarUsuarioGestorMutation,
  ]);

  useEffect(() => {
    if (!prestadorId || !hasRedirectUrl || hasNavigated) {
      return;
    }

    const timerId = window.setInterval(() => {
      setSecondsRemaining((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => window.clearInterval(timerId);
  }, [prestadorId, hasRedirectUrl, hasNavigated]);

  useEffect(() => {
    if (!prestadorId || !hasRedirectUrl || hasNavigated || secondsRemaining > 0) {
      return;
    }

    handleNavigate();
  }, [secondsRemaining, prestadorId, hasRedirectUrl, hasNavigated, handleNavigate]);

  if (!prestador || !gestor) {
    return (
      <Card className="border-dashed">
        <CardHeader>
          <CardTitle>Resumo</CardTitle>
          <CardDescription>Finalize as etapas anteriores para visualizar o resumo do onboarding.</CardDescription>
        </CardHeader>
        <div className="space-y-4 px-6 pb-6">
          <Button type="button" onClick={() => setStep(prestador ? "gestor" : "prestador")}>
            Voltar para {prestador ? "Usuário gestor" : "Prestador"}
          </Button>
        </div>
      </Card>
    );
  }

  if (!prestadorId) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Revise os dados antes de confirmar</CardTitle>
          <CardDescription>Confira os dados cadastrados. Você poderá voltar para ajustar caso necessário.</CardDescription>
        </CardHeader>
        <div className="space-y-6 px-6 pb-6">
          <section className="space-y-3">
            <header>
              <h3 className="text-base font-semibold text-slate-800">Prestador</h3>
            </header>
            <dl className="grid gap-3 md:grid-cols-2">
              <ResumoItem rotulo="CNPJ" valor={prestador.cnpj} />
              <ResumoItem rotulo="Razão social" valor={prestador.razaoSocial} />
              <ResumoItem rotulo="Nome fantasia" valor={prestador.nomeFantasia} />
              <ResumoItem rotulo="Inscrição municipal" valor={prestador.inscricaoMunicipal} />
              <ResumoItem rotulo="Inscrição estadual" valor={prestador.inscricaoEstadual} />
              <ResumoItem rotulo="Telefone" valor={prestador.telefone} />
              <ResumoItem rotulo="E-mail" valor={prestador.email} />
              <ResumoItem rotulo="Endereço" valor={`${prestador.endereco.logradouro}, ${prestador.endereco.numero}`} />
              <ResumoItem rotulo="Bairro" valor={prestador.endereco.bairro} />
              <ResumoItem
                rotulo="Cidade/UF"
                valor={`${prestador.endereco.cidade} - ${prestador.endereco.uf}`}
              />
              <ResumoItem rotulo="CEP" valor={prestador.endereco.cep} />
            </dl>
          </section>

          <section className="space-y-3">
            <header>
              <h3 className="text-base font-semibold text-slate-800">Usuário gestor</h3>
            </header>
            <dl className="grid gap-3 md:grid-cols-2">
              <ResumoItem rotulo="Nome" valor={gestor.nome} />
              <ResumoItem rotulo="E-mail" valor={gestor.email} />
            </dl>
          </section>

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 pt-6">
            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="outline" onClick={() => setStep("gestor")} disabled={isProvisioning}>
                Voltar para usuário gestor
              </Button>
              <Button type="button" variant="ghost" onClick={() => setStep("prestador")} disabled={isProvisioning}>
                Revisar dados do prestador
              </Button>
            </div>
            <Button type="button" onClick={handleConfirmarOnboarding} disabled={isProvisioning}>
              {isProvisioning ? "Provisionando..." : "Confirmar e provisionar"}
            </Button>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Onboarding concluído</CardTitle>
      </CardHeader>
      <div className="space-y-6 px-6 pb-6">
        <section className="rounded-2xl border border-emerald-200 bg-emerald-50 px-6 py-6 text-center text-emerald-700">
          <div className="mx-auto flex max-w-md flex-col items-center gap-3">
            <CheckCircle2 className="h-10 w-10" />
            <h3 className="text-lg font-semibold">Tudo certo! Fluxo automatizado finalizado.</h3>
            {robot && robot.scopes.length > 0 && (
              <p className="text-sm text-emerald-700/70">
                Escopos atribuídos ao robô: <span className="font-medium">{robot.scopes.join(", ")}</span>.
              </p>
            )}
          </div>
        </section>

        <section className="space-y-3">
          <header className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-semibold text-slate-800">Prestador</h3>
            </div>
          </header>
          <dl className="grid gap-3 md:grid-cols-2">
            <ResumoItem rotulo="CNPJ" valor={prestador.cnpj} />
            <ResumoItem rotulo="Razão social" valor={prestador.razaoSocial} />
            <ResumoItem rotulo="Nome fantasia" valor={prestador.nomeFantasia} />
            <ResumoItem rotulo="Inscrição municipal" valor={prestador.inscricaoMunicipal} />
            <ResumoItem rotulo="Inscrição estadual" valor={prestador.inscricaoEstadual} />
            <ResumoItem rotulo="Telefone" valor={prestador.telefone} />
            <ResumoItem rotulo="E-mail" valor={prestador.email} />
            <ResumoItem rotulo="Endereço" valor={`${prestador.endereco.logradouro}, ${prestador.endereco.numero}`} />
            <ResumoItem rotulo="Bairro" valor={prestador.endereco.bairro} />
            <ResumoItem
              rotulo="Cidade/UF"
              valor={`${prestador.endereco.cidade} - ${prestador.endereco.uf}`}
            />
            <ResumoItem rotulo="CEP" valor={prestador.endereco.cep} />
          </dl>
        </section>

        <section className="space-y-3">
          <header className="flex items-center justify_between">
            <div>
              <h3 className="text-base font-semibold text-slate-800">Usuário gestor</h3>
            </div>
          </header>
          <dl className="grid gap-3 md:grid-cols-2">
            <ResumoItem rotulo="Nome" valor={gestor.nome} />
            <ResumoItem rotulo="E-mail" valor={gestor.email} />
          </dl>
        </section>

        <div className="flex flex_wrap items-center justify-between gap-3 border-t border-slate-200 pt-6">
          <p className="text-sm text-slate-500">
            Compartilhe as credenciais com o gestor e acompanhe a ativação do robô na central administrativa.
          </p>
          {hasRedirectUrl && (
            <Button type="button" onClick={handleNavigate} disabled={hasNavigated}>
              {hasNavigated ? "Redirecionando..." : `Acessar sistema (${secondsRemaining}s)`}
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
}

interface ResumoItemProps {
  rotulo: string;
  valor?: string | null;
}

function ResumoItem({ rotulo, valor }: ResumoItemProps) {
  if (!valor) {
    return null;
  }

  return (
    <div className="rounded-lg border border-slate-200 bg-white px-4 py-3 shadow-sm">
      <dt className="text-xs font-semibold uppercase tracking-wide text-slate-400">{rotulo}</dt>
      <dd className="mt-1 text-sm font-medium text-slate-700">{valor}</dd>
    </div>
  );
}

interface MunicipioOption {
  label: string;
  value: string;
  ibge: string;
}

const DEFAULT_VALUES: PrestadorFormValues = {
  cnpj: "",
  razaoSocial: "",
  nomeFantasia: "",
  inscricaoMunicipal: "",
  inscricaoEstadual: "",
  telefone: "",
  email: "",
  website: "",
  endereco: {
    logradouro: "",
    numero: "",
    complemento: "",
    bairro: "",
    cidade: "",
    codigoMunicipioIbge: "",
    uf: "",
    cep: "",
  },
};

const DEFAULT_GESTOR_VALUES: GestorCredentialsFormValues = {
  nome: "",
  email: "",
  senha: "",
  confirmarSenha: "",
};

const DEFAULT_GESTOR_CODIGO_VALUES: GestorCodigoFormValues = {
  codigo: "",
};

const DEFAULT_ROBO_SCOPES = [
  "nfse.cancelar",
  "nfse.certificados",
  "nfse.danfse",
  "nfse.emitir",
  "nfse.email",
  "nfse.robot",
] as const;

function extractScopesFromEnv(value?: string | null): string[] {
  if (!value) {
    return [];
  }

  return value
    .split(/[\s,]+/)
    .map((scope) => scope.trim())
    .filter(Boolean);
}

const primaryEnvScopes = extractScopesFromEnv(process.env.NEXT_PUBLIC_ONBOARDING_ROBOT_SCOPE);
const fallbackEnvScopes = primaryEnvScopes.length > 0
  ? []
  : extractScopesFromEnv(process.env.NEXT_PUBLIC_ONBOARDING_MFA_ROBOT_SCOPE);

const ROBO_SCOPES: string[] = Array.from(
  new Set<string>([...DEFAULT_ROBO_SCOPES, ...primaryEnvScopes, ...fallbackEnvScopes])
);

export default function OnboardingPage() {
  const step = useOnboardingStore((state) => state.step);

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10">
      <div className="mx-auto w-full max-w-5xl space-y-10">
        <header className="text-center">
          <p className="text-sm font-semibold uppercase tracking-wide text-primary">
            Onboarding automático
          </p>
          <h1 className="mt-2 text-3xl font-bold text-slate-900">
            Configure o acesso completo em poucos passos
          </h1>
          <p className="mt-4 text-sm text-slate-600">
            Dados do prestador, usuário gestor com MFA e credenciais do robô integrador serão provisionados em sequência.
          </p>
        </header>

        <StepIndicator currentStep={step} />

        {step === "prestador" && <PrestadorStep />}
        {step === "gestor" && <GestorStep />}
        {step === "resumo" && <ResumoStep />}
      </div>
    </main>
  );
}

function PrestadorStep() {
  const { prestador, savePrestador, setRobot, setStep } = useOnboardingStore((state) => ({
    prestador: state.prestador,
    savePrestador: state.savePrestador,
    setRobot: state.setRobot,
    setStep: state.setStep,
  }));
  const form = useForm<PrestadorFormValues>({
    resolver: zodResolver(prestadorSchema),
    defaultValues: prestador ?? DEFAULT_VALUES,
    mode: "onChange",
  });
  const [ufs, setUfs] = useState<IbgeUf[]>([]);
  const [municipioOptions, setMunicipioOptions] = useState<MunicipioOption[]>([]);
  const [isLoadingUfs, setIsLoadingUfs] = useState(false);
  const [isLoadingMunicipios, setIsLoadingMunicipios] = useState(false);
  const [isViaCepLoading, setIsViaCepLoading] = useState(false);
  const municipiosCacheRef = useRef<Map<number, MunicipioOption[]>>(new Map());
  const lastConsultedCepRef = useRef<string | null>(null);

  useEffect(() => {
    let active = true;
    setIsLoadingUfs(true);
    listarUfs()
      .then((data) => {
        if (active) {
          setUfs(data);
        }
      })
      .catch((error) => {
        console.error("[Onboarding] Falha ao carregar UFs", error);
        toast.error("Não foi possível carregar a lista de estados.");
      })
      .finally(() => {
        if (active) {
          setIsLoadingUfs(false);
        }
      });

    return () => {
      active = false;
    };
  }, []);

  const ufWatcher = form.watch("endereco.uf");

  useEffect(() => {
    const selectedUf = ufs.find((uf) => uf.sigla === ufWatcher);
    if (!selectedUf) {
      setMunicipioOptions([]);
      return;
    }

    const cached = municipiosCacheRef.current.get(selectedUf.id);
    if (cached) {
      setMunicipioOptions(cached);
      return;
    }

    setIsLoadingMunicipios(true);
    listarMunicipiosPorUf(selectedUf.id)
      .then((municipios) => {
        const options = municipios.map<MunicipioOption>((municipio: IbgeMunicipio) => ({
          label: municipio.nome,
          value: municipio.nome,
          ibge: String(municipio.id).padStart(7, "0"),
        }));
        municipiosCacheRef.current.set(selectedUf.id, options);
        setMunicipioOptions(options);
      })
      .catch((error) => {
        console.error("[Onboarding] Falha ao carregar municípios", error);
        toast.error("Não foi possível carregar os municípios do estado selecionado.");
      })
      .finally(() => {
        setIsLoadingMunicipios(false);
      });
  }, [ufs, ufWatcher]);

  const handleConsultarCep = async () => {
    const cepDigits = onlyDigits(form.getValues("endereco.cep") ?? "");
    if (cepDigits.length !== 8) {
      toast.error("Informe um CEP com 8 dígitos antes de consultar.");
      return;
    }

    if (lastConsultedCepRef.current === cepDigits && form.getValues("endereco.logradouro")) {
      return;
    }

    setIsViaCepLoading(true);
    try {
      const response = await fetch(`https://viacep.com.br/ws/${cepDigits}/json/`);
      if (!response.ok) {
        throw new Error(`Erro ao consultar CEP ${cepDigits}`);
      }

      const data = (await response.json()) as ViaCepResponse;
      if (data.erro) {
        toast.error("CEP não encontrado.");
        lastConsultedCepRef.current = null;
        return;
      }

      form.setValue("endereco.cep", cepDigits, { shouldValidate: true });
      if (data.logradouro) {
        form.setValue("endereco.logradouro", data.logradouro, { shouldValidate: true });
      }
      if (data.complemento) {
        form.setValue("endereco.complemento", data.complemento, { shouldValidate: false });
      }
      if (data.bairro) {
        form.setValue("endereco.bairro", data.bairro, { shouldValidate: true });
      }
      if (data.localidade) {
        form.setValue("endereco.cidade", data.localidade, { shouldValidate: true });
      }
      if (data.uf) {
        form.setValue("endereco.uf", data.uf, { shouldValidate: true });
      }
      if (data.ibge) {
        form.setValue("endereco.codigoMunicipioIbge", data.ibge, { shouldValidate: true });
      }

      if (data.localidade && data.ibge) {
        setMunicipioOptions((options) => {
          const exists = options.some((option) => option.ibge === data.ibge);
          if (exists) {
            return options;
          }
          const novo: MunicipioOption = {
            label: data.localidade!,
            value: data.localidade!,
            ibge: data.ibge!,
          };
          return [novo, ...options];
        });
      }

      lastConsultedCepRef.current = cepDigits;
      toast.success("Endereço preenchido automaticamente pelo CEP.");
    } catch (error) {
      console.error("[Onboarding] Falha ao consultar CEP", error);
      toast.error("Não foi possível consultar o CEP informado.");
    } finally {
      setIsViaCepLoading(false);
    }
  };

  const onSubmit = form.handleSubmit((values) => {
    const prestadorPayload = mapPrestadorFormToPayload(values);
    const robotPayload = buildRobotClientPayload(values);

    savePrestador(values, { payload: prestadorPayload, robotPayload });
    setRobot(undefined);
    toast.success("Dados do prestador armazenados. Continue para o usuário gestor.");
    setStep("gestor");
  });

  const formErrors = form.formState.errors;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Dados gerais do prestador</CardTitle>
        <CardDescription>
          Informe CNPJ, razão social e endereço completo. Usaremos essas informações para provisionar os ambientes nas duas bases.
        </CardDescription>
      </CardHeader>
      <form onSubmit={onSubmit} className="space-y-6 px-6 pb-6">
        <section className="grid gap-4 md:grid-cols-2">
          <div className="space-y-1">
            <label htmlFor="cnpj" className="text-sm font-medium text-slate-600">
              CNPJ
            </label>
            <Controller
              control={form.control}
              name="cnpj"
              render={({ field }) => (
                <Input
                  id="cnpj"
                  inputMode="numeric"
                  maxLength={14}
                  placeholder="Somente números"
                  value={field.value}
                  onChange={(event) => field.onChange(onlyDigits(event.target.value).slice(0, 14))}
                />
              )}
            />
            {formErrors.cnpj && (
              <p className="text-sm text-red-600">{formErrors.cnpj.message}</p>
            )}
          </div>
          <div className="space-y-1">
            <label htmlFor="inscricaoMunicipal" className="text-sm font-medium text-slate-600">
              Inscrição municipal
            </label>
            <Controller
              control={form.control}
              name="inscricaoMunicipal"
              render={({ field }) => (
                <Input
                  id="inscricaoMunicipal"
                  value={field.value}
                  onChange={(event) => field.onChange(formatInscricaoMunicipal(event.target.value))}
                />
              )}
            />
            {formErrors.inscricaoMunicipal && (
              <p className="text-sm text-red-600">{formErrors.inscricaoMunicipal.message}</p>
            )}
          </div>
          <div className="space-y-1">
            <label htmlFor="razaoSocial" className="text-sm font-medium text-slate-600">
              Razão social
            </label>
            <Input id="razaoSocial" {...form.register("razaoSocial")} />
            {formErrors.razaoSocial && (
              <p className="text-sm text-red-600">{formErrors.razaoSocial.message}</p>
            )}
          </div>
          <div className="space-y-1">
            <label htmlFor="nomeFantasia" className="text-sm font-medium text-slate-600">
              Nome fantasia
            </label>
            <Input id="nomeFantasia" {...form.register("nomeFantasia")} />
            {formErrors.nomeFantasia && (
              <p className="text-sm text-red-600">{formErrors.nomeFantasia.message}</p>
            )}
          </div>
          <div className="space-y-1">
            <label htmlFor="inscricaoEstadual" className="text-sm font-medium text-slate-600">
              Inscrição estadual (opcional)
            </label>
            <Controller
              control={form.control}
              name="inscricaoEstadual"
              render={({ field }) => (
                <Input
                  id="inscricaoEstadual"
                  value={field.value ?? ""}
                  onChange={(event) => field.onChange(formatInscricaoEstadual(event.target.value))}
                />
              )}
            />
            {formErrors.inscricaoEstadual && (
              <p className="text-sm text-red-600">{formErrors.inscricaoEstadual.message}</p>
            )}
          </div>
          <div className="space-y-1">
            <label htmlFor="telefone" className="text-sm font-medium text-slate-600">
              Telefone (opcional)
            </label>
            <Controller
              control={form.control}
              name="telefone"
              render={({ field }) => (
                <Input
                  id="telefone"
                  value={field.value ?? ""}
                  onChange={(event) => field.onChange(formatTelefone(event.target.value))}
                />
              )}
            />
            {formErrors.telefone && (
              <p className="text-sm text-red-600">{formErrors.telefone.message}</p>
            )}
          </div>
          <div className="space-y-1">
            <label htmlFor="email" className="text-sm font-medium text-slate-600">
              E-mail (opcional)
            </label>
            <Input id="email" type="email" {...form.register("email")} />
            {formErrors.email && (
              <p className="text-sm text-red-600">{formErrors.email.message}</p>
            )}
          </div>
          <div className="space-y-1">
            <label htmlFor="website" className="text-sm font-medium text-slate-600">
              Website (opcional)
            </label>
            <Input id="website" type="url" placeholder="https://" {...form.register("website")} />
            {formErrors.website && (
              <p className="text-sm text-red-600">{formErrors.website.message}</p>
            )}
          </div>
        </section>

        <section className="space-y-4">
          <p className="text-base font-semibold text-slate-800">Endereço</p>
          <div className="grid gap-4 md:grid-cols-[2fr,auto]">
            <div className="space-y-1">
              <label htmlFor="cep" className="text-sm font-medium text-slate-600">
                CEP
              </label>
              <Controller
                control={form.control}
                name="endereco.cep"
                render={({ field }) => (
                  <Input
                    id="cep"
                    inputMode="numeric"
                    maxLength={8}
                    placeholder="Somente números"
                    value={field.value ?? ""}
                    onChange={(event) => field.onChange(onlyDigits(event.target.value).slice(0, 8))}
                  />
                )}
              />
              {formErrors.endereco?.cep && (
                <p className="text-sm text-red-600">{formErrors.endereco.cep.message}</p>
              )}
            </div>
            <div className="flex items-end">
              <Button type="button" variant="outline" className="w-full md:w-auto" onClick={handleConsultarCep} disabled={isViaCepLoading}>
                {isViaCepLoading ? "Consultando..." : "Consultar CEP"}
              </Button>
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-1 md:col-span-2">
              <label htmlFor="logradouro" className="text-sm font-medium text-slate-600">
                Logradouro
              </label>
              <Input id="logradouro" {...form.register("endereco.logradouro")} />
              {formErrors.endereco?.logradouro && (
                <p className="text-sm text-red-600">{formErrors.endereco.logradouro.message}</p>
              )}
            </div>
            <div className="space-y-1">
              <label htmlFor="numero" className="text-sm font-medium text-slate-600">
                Número
              </label>
              <Input id="numero" {...form.register("endereco.numero")} />
              {formErrors.endereco?.numero && (
                <p className="text-sm text-red-600">{formErrors.endereco.numero.message}</p>
              )}
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-1">
              <label htmlFor="complemento" className="text-sm font-medium text-slate-600">
                Complemento (opcional)
              </label>
              <Input id="complemento" {...form.register("endereco.complemento")} />
            </div>
            <div className="space-y-1">
              <label htmlFor="bairro" className="text-sm font-medium text-slate-600">
                Bairro
              </label>
              <Input id="bairro" {...form.register("endereco.bairro")} />
              {formErrors.endereco?.bairro && (
                <p className="text-sm text-red-600">{formErrors.endereco.bairro.message}</p>
              )}
            </div>
            <div className="space-y-1">
              <label htmlFor="uf" className="text-sm font-medium text-slate-600">
                UF
              </label>
              <Controller
                control={form.control}
                name="endereco.uf"
                render={({ field }) => (
                  <Select id="uf" value={field.value ?? ""} onChange={(event) => field.onChange(event.target.value)}>
                    <option value="" disabled>
                      {isLoadingUfs ? "Carregando..." : "Selecione"}
                    </option>
                    {ufs.map((uf) => (
                      <option key={uf.id} value={uf.sigla}>
                        {uf.sigla} - {uf.nome}
                      </option>
                    ))}
                  </Select>
                )}
              />
              {formErrors.endereco?.uf && (
                <p className="text-sm text-red-600">{formErrors.endereco.uf.message}</p>
              )}
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-1">
              <label htmlFor="cidade" className="text-sm font-medium text-slate-600">
                Cidade
              </label>
              <Controller
                control={form.control}
                name="endereco.codigoMunicipioIbge"
                render={({ field }) => (
                  <Select
                    id="cidade"
                    value={field.value ?? ""}
                    onChange={(event) => {
                      const ibge = event.target.value;
                      const option = municipioOptions.find((item) => item.ibge === ibge);
                      field.onChange(ibge);
                      if (option) {
                        form.setValue("endereco.cidade", option.label, { shouldValidate: true });
                      }
                    }}
                  >
                    <option value="" disabled>
                      {isLoadingMunicipios ? "Carregando..." : "Selecione"}
                    </option>
                    {municipioOptions.map((option) => (
                      <option key={option.ibge} value={option.ibge}>
                        {option.label}
                      </option>
                    ))}
                  </Select>
                )}
              />
              {formErrors.endereco?.codigoMunicipioIbge && (
                <p className="text-sm text-red-600">{formErrors.endereco.codigoMunicipioIbge.message}</p>
              )}
            </div>
            <div className="space-y-1">
              <label htmlFor="cidade-nome" className="text-sm font-medium text-slate-600">
                Código IBGE
              </label>
              <Input id="cidade-nome" value={form.watch("endereco.codigoMunicipioIbge") ?? ""} readOnly />
            </div>
          </div>
          <div className="space-y-1">
            <label htmlFor="cidade-texto" className="text-sm font-medium text-slate-600">
              Cidade selecionada
            </label>
            <Input id="cidade-texto" value={form.watch("endereco.cidade") ?? ""} readOnly />
          </div>
        </section>

        <div className="flex flex-col justify-between gap-3 pt-4 md:flex-row md:items-center">
          <p className="text-sm text-slate-500">
            Todos os campos obrigatórios estão marcados. Utilize o CEP para agilizar o preenchimento.
          </p>
          <div className="flex items-center gap-2">
            <Button
              type="submit"
              disabled={!form.formState.isValid || form.formState.isSubmitting}
            >
              {form.formState.isSubmitting ? "Salvando..." : "Avançar para usuário gestor"}
            </Button>
          </div>
        </div>
      </form>
    </Card>
  );
}

interface MunicipioOption {
  label: string;
  value: string;
  ibge: string;
}
