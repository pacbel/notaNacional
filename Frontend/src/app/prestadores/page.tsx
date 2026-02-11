"use client";

import { useMemo, useState, useEffect, useRef, useCallback, ChangeEvent } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Pencil, Trash2, SlidersHorizontal, Search, X, Loader2 } from "lucide-react";

import { useAuth } from "@/contexts/auth-context";
import { useApiQuery } from "@/hooks/use-api-query";
import { useApiMutation } from "@/hooks/use-api-mutation";
import {
  listarPrestadores,
  criarPrestador,
  atualizarPrestador,
  removerPrestador,
  obterConfiguracaoPrestador,
  definirConfiguracaoPrestador,
  listarCertificadosPrestador,
  uploadCertificadoPrestador,
  atualizarCertificadoPrestador,
  atualizarSenhaCertificadoPrestador,
  removerCertificadoPrestador,
} from "@/services/prestadores";
import {
  obterBilhetagemSaldo,
  listarLancamentosBilhetagem,
} from "@/services/bilhetagem";
import {
  listarUfs,
  listarMunicipiosPorUf,
  obterMunicipioPorCodigoIbge,
  type IbgeUf,
} from "@/services/ibge";
import { ApiError } from "@/services/http";
import {
  PrestadorDto,
  CreatePrestadorDto,
  UpdatePrestadorDto,
  PrestadorConfiguracaoDto,
  UpsertPrestadorConfiguracaoDto,
  PrestadorCertificadoDto,
  BilhetagemSaldoDto,
  BilhetagemLancamentoDto,
} from "@/types/prestadores";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Pagination } from "@/components/ui/pagination";
import { toast } from "sonner";
import {
  formatCep,
  formatCnpj,
  formatInscricaoEstadual,
  formatInscricaoMunicipal,
  formatTelefone,
  onlyDigits,
} from "@/utils/masks";

const prestadorSchema = z.object({
  cnpj: z
    .string()
    .min(14, "CNPJ deve conter 14 dígitos")
    .max(14, "CNPJ deve conter 14 dígitos"),
  razaoSocial: z.string().min(3, "Informe a razão social"),
  nomeFantasia: z.string().min(3, "Informe o nome fantasia"),
  inscricaoMunicipal: z.string().min(3, "Informe a inscrição municipal"),
  inscricaoEstadual: z.string().optional().or(z.literal("")),
  telefone: z.string().optional().or(z.literal("")),
  email: z.string().email("Informe um e-mail válido").optional().or(z.literal("")),
  website: z.string().url("Informe uma URL válida").optional().or(z.literal("")),
  endereco: z.object({
    logradouro: z.string().min(3, "Informe o logradouro"),
    numero: z.string().min(1, "Informe o número"),
    complemento: z.string().optional().or(z.literal("")),
    bairro: z.string().min(2, "Informe o bairro"),
    cidade: z.string().optional().or(z.literal("")),
    codigoMunicipioIbge: z
      .string()
      .min(7, "Código IBGE deve conter 7 dígitos")
      .max(7, "Código IBGE deve conter 7 dígitos"),
    uf: z
      .string()
      .max(2, "UF deve conter 2 caracteres")
      .optional()
      .or(z.literal("")),
    cep: z.string().min(8, "CEP deve conter 8 dígitos").max(8).optional().or(z.literal("")),
  }),
});

type PrestadorFormValues = z.infer<typeof prestadorSchema>;

const configuracaoSchema = z.object({
  versaoAplicacao: z.string().min(1, "Informe a versão da aplicação"),
  enviaEmailAutomatico: z.boolean(),
  smtpHost: z.string().min(1, "Informe o host SMTP"),
  smtpPort: z.coerce.number().int().min(1).max(65535),
  smtpSecure: z.boolean(),
  smtpUser: z.string().min(1, "Informe o usuário SMTP"),
  smtpPassword: z.string().optional(),
  smtpFrom: z.string().email("Informe um e-mail válido"),
  smtpFromName: z.string().min(1, "Informe o nome do remetente"),
  bilhetagemHabilitada: z.boolean(),
  creditoMensalPadrao: z.coerce.number().int().min(0).nullable(),
  saldoNotasDisponiveis: z.coerce.number().int().min(0).nullable(),
  competenciaSaldo: z.string().nullable(),
});

type ConfigFormValues = z.infer<typeof configuracaoSchema>;

interface ViaCepResponse {
  cep?: string;
  logradouro?: string;
  complemento?: string;
  bairro?: string;
  localidade?: string;
  uf?: string;
  ibge?: string;
  gia?: string;
  ddd?: string;
  siafi?: string;
  erro?: true;
}

interface MunicipioOption {
  label: string;
  value: string;
  ibge: string;
}

function formatDate(value?: string | null) {
  if (!value) return "—";
  const normalized = /^\d{4}-\d{2}-\d{2}$/.test(value) ? `${value}T00:00:00` : value;
  const date = new Date(normalized);
  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return date.toLocaleDateString("pt-BR");
}

function formatDateLocalInput(value?: string | null) {
  if (!value) return null;

  const normalized = /^\d{4}-\d{2}-\d{2}$/.test(value) ? `${value}T00:00:00` : value;
  const date = new Date(normalized);
  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date.toISOString().slice(0, 10);
}

function formatDateTime(value?: string | null) {
  if (!value) {
    return "—";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return date.toLocaleString("pt-BR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const integerFormatter = new Intl.NumberFormat("pt-BR");

function formatInteger(value?: number | null) {
  if (value === null || value === undefined) {
    return "—";
  }

  return integerFormatter.format(value);
}

function isApiError(error: unknown): error is ApiError<{ mensagem?: string }> {
  return error instanceof ApiError;
}

function isCertificadoVigente(validadeInicio?: string | null, validadeFim?: string | null) {
  if (!validadeInicio || !validadeFim) {
    return false;
  }

  const agora = new Date();
  const inicio = new Date(validadeInicio);
  const fim = new Date(validadeFim);

  if (Number.isNaN(inicio.getTime()) || Number.isNaN(fim.getTime())) {
    return false;
  }

  return inicio <= agora && agora <= fim;
}

export default function PrestadoresPage() {
  const queryClient = useQueryClient();
  const { roles } = useAuth();

  const canCreate = roles.includes("Administrador");
  const canEdit = roles.includes("Administrador") || roles.includes("Gestao");
  const canDelete = roles.includes("Administrador");

  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingPrestador, setEditingPrestador] = useState<PrestadorDto | null>(null);

  const [configPrestador, setConfigPrestador] = useState<PrestadorDto | null>(null);
  const [configData, setConfigData] = useState<PrestadorConfiguracaoDto | null>(null);
  const [configTab, setConfigTab] = useState<"fiscal" | "certificados">("fiscal");
  const [isConfigLoading, setIsConfigLoading] = useState(false);
  const [ufs, setUfs] = useState<IbgeUf[]>([]);
  const [municipioOptions, setMunicipioOptions] = useState<MunicipioOption[]>([]);
  const [isViaCepLoading, setIsViaCepLoading] = useState(false);
  const [isIbgeLoading, setIsIbgeLoading] = useState(false);
  const [certificados, setCertificados] = useState<PrestadorCertificadoDto[]>([]);
  const [isCertificadosLoading, setIsCertificadosLoading] = useState(false);
  const [certificadoSelecionadoId, setCertificadoSelecionadoId] = useState<string | null>(null);
  const [modoEdicao, setModoEdicao] = useState<"criacao" | "edicao">("criacao");
  const [novoCertificadoAlias, setNovoCertificadoAlias] = useState("");
  const [novoCertificadoSenha, setNovoCertificadoSenha] = useState("");
  const [arquivoCertificadoBase64, setArquivoCertificadoBase64] = useState<string | null>(null);
  const [arquivoCertificadoNome, setArquivoCertificadoNome] = useState("");
  const [bilhetagemSaldo, setBilhetagemSaldo] = useState<BilhetagemSaldoDto | null>(null);
  const [bilhetagemLancamentos, setBilhetagemLancamentos] = useState<BilhetagemLancamentoDto[]>([]);
  const [isBilhetagemLoading, setIsBilhetagemLoading] = useState(false);

  const prestadoresQuery = useApiQuery({
    queryKey: ["prestadores"],
    queryFn: listarPrestadores,
  });

  const form = useForm<PrestadorFormValues>({
    resolver: zodResolver(prestadorSchema),
    defaultValues: {
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
    },
  });

  const configForm = useForm<ConfigFormValues>({
    resolver: zodResolver(configuracaoSchema),
    defaultValues: {
      versaoAplicacao: "",
      enviaEmailAutomatico: true,
      smtpHost: "",
      smtpPort: 587,
      smtpSecure: false,
      smtpUser: "",
      smtpPassword: "",
      smtpFrom: "",
      smtpFromName: "",
      bilhetagemHabilitada: false,
      creditoMensalPadrao: null,
      saldoNotasDisponiveis: null,
      competenciaSaldo: null,
    },
  });

  const bilhetagemHabilitadaWatch = useWatch({
    control: configForm.control,
    name: "bilhetagemHabilitada",
  });
  const creditoMensalPadraoWatch = useWatch({
    control: configForm.control,
    name: "creditoMensalPadrao",
  });
  const saldoNotasDisponiveisWatch = useWatch({
    control: configForm.control,
    name: "saldoNotasDisponiveis",
  });
  const competenciaSaldoWatch = useWatch({
    control: configForm.control,
    name: "competenciaSaldo",
  });

  useEffect(() => {
    const derivedBilhetagemHabilitada =
      typeof creditoMensalPadraoWatch === "number" &&
      !Number.isNaN(creditoMensalPadraoWatch) &&
      creditoMensalPadraoWatch > 0;

    if ((bilhetagemHabilitadaWatch ?? false) !== derivedBilhetagemHabilitada) {
      configForm.setValue("bilhetagemHabilitada", derivedBilhetagemHabilitada, {
        shouldDirty: false,
        shouldValidate: false,
      });
    }
  }, [bilhetagemHabilitadaWatch, creditoMensalPadraoWatch, configForm]);

  const resumoBilhetagemHabilitada =
    bilhetagemHabilitadaWatch ?? bilhetagemSaldo?.bilhetagemHabilitada ?? false;
  const resumoCreditoMensal =
    creditoMensalPadraoWatch ?? bilhetagemSaldo?.creditoMensalPadrao ?? null;
  const resumoSaldoDisponivel =
    saldoNotasDisponiveisWatch ?? bilhetagemSaldo?.saldoNotasDisponiveis ?? null;
  const resumoCompetencia = competenciaSaldoWatch
    ? formatDate(competenciaSaldoWatch)
    : formatDate(bilhetagemSaldo?.competenciaSaldo);

  const filteredPrestadores = useMemo(() => {
    const data = prestadoresQuery.data ?? [];
    if (!searchTerm) return data;
    const normalized = searchTerm.toLowerCase();
    return data.filter((prestador) =>
      [prestador.nomeFantasia, prestador.cnpj, prestador.razaoSocial]
        .filter(Boolean)
        .some((value) => value?.toLowerCase().includes(normalized))
    );
  }, [prestadoresQuery.data, searchTerm]);

  const totalItems = filteredPrestadores.length;
  const totalPages = Math.max(Math.ceil(totalItems / pageSize), 1);
  const currentPage = Math.min(page, totalPages);

  const paginatedPrestadores = filteredPrestadores.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const createMutation = useApiMutation((payload: CreatePrestadorDto) => criarPrestador(payload), {
    successMessage: "Prestador criado com sucesso.",
    onSuccess: () => {
      setIsFormOpen(false);
      setEditingPrestador(null);
      form.reset();
      queryClient.invalidateQueries({ queryKey: ["prestadores"] });
    },
  });

  const updateMutation = useApiMutation(
    ({ id, payload }: { id: string; payload: UpdatePrestadorDto }) =>
      atualizarPrestador(id, payload),
    {
      successMessage: "Prestador atualizado.",
      onSuccess: () => {
        setIsFormOpen(false);
        setEditingPrestador(null);
        form.reset();
        queryClient.invalidateQueries({ queryKey: ["prestadores"] });
      },
    }
  );

  const deleteMutation = useApiMutation((id: string) => removerPrestador(id), {
    successMessage: "Prestador removido.",
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["prestadores"] });
    },
  });

  const configMutation = useApiMutation(
    ({ prestadorId, payload }: { prestadorId: string; payload: UpsertPrestadorConfiguracaoDto }) =>
      definirConfiguracaoPrestador(prestadorId, payload),
    {
      successMessage: "Configuração atualizada.",
      onSuccess: () => {
        setConfigPrestador(null);
        setConfigData(null);
      },
    }
  );

  const lastConsultedCepRef = useRef<string | null>(null);
  const certificadoFileInputRef = useRef<HTMLInputElement | null>(null);

  const loadCertificados = useCallback(
    async (prestadorId: string, destaqueCertificadoId?: string) => {
      setIsCertificadosLoading(true);
      try {
        const data = await listarCertificadosPrestador(prestadorId);
        const normalizados = data.map((certificado) => {
          const validadeInicio = certificado.validadeInicio ?? certificado.notBefore ?? null;
          const validadeFim = certificado.validadeFim ?? certificado.notAfter ?? null;

          return {
            ...certificado,
            validadeInicio,
            validadeFim,
          };
        });
        setCertificados(normalizados);
        setCertificadoSelecionadoId((current) => {
          if (destaqueCertificadoId && normalizados.some((item) => item.id === destaqueCertificadoId)) {
            return destaqueCertificadoId;
          }
          if (current && normalizados.some((item) => item.id === current)) {
            return current;
          }

          return null;
        });
      } catch (error) {
        console.error(error);
        toast.error("Não foi possível carregar os certificados do prestador.");
      } finally {
        setIsCertificadosLoading(false);
      }
    },
    []
  );

  const loadBilhetagem = useCallback(
    async (prestadorId: string) => {
      console.info("[Bilhetagem] Iniciando carregamento", { prestadorId });
      setIsBilhetagemLoading(true);
      try {
        const [saldo, lancamentos] = await Promise.all([
          obterBilhetagemSaldo(prestadorId),
          listarLancamentosBilhetagem(prestadorId, 10),
        ]);

        console.info("[Bilhetagem] Dados carregados com sucesso", {
          prestadorId,
          saldo,
          quantidadeLancamentos: lancamentos.length,
        });

        setBilhetagemSaldo(saldo);
        setBilhetagemLancamentos(lancamentos);

        if (!configForm.formState.isDirty) {
          configForm.setValue("bilhetagemHabilitada", saldo.bilhetagemHabilitada ?? false, {
            shouldDirty: false,
            shouldValidate: false,
          });
          configForm.setValue("creditoMensalPadrao", saldo.creditoMensalPadrao ?? null, {
            shouldDirty: false,
            shouldValidate: false,
          });
          configForm.setValue("saldoNotasDisponiveis", saldo.saldoNotasDisponiveis ?? null, {
            shouldDirty: false,
            shouldValidate: false,
          });
          configForm.setValue("competenciaSaldo", formatDateLocalInput(saldo.competenciaSaldo), {
            shouldDirty: false,
            shouldValidate: false,
          });
        }
      } catch (error: unknown) {
        const detalhesErro = isApiError(error)
          ? { status: error.status, payload: error.payload }
          : { tipo: error instanceof Error ? error.name : typeof error };
        console.error("[Bilhetagem] Falha ao carregar dados", {
          prestadorId,
          erro: detalhesErro,
        });
        toast.error("Não foi possível carregar os dados de bilhetagem do prestador.");
      } finally {
        setIsBilhetagemLoading(false);
      }
    },
    [configForm]
  );

  const uploadCertificadoMutation = useApiMutation(
    ({ prestadorId, payload }: { prestadorId: string; payload: { alias?: string; conteudo: string; senha: string } }) =>
      uploadCertificadoPrestador(prestadorId, payload),
    {
      successMessage: "Certificado enviado com sucesso.",
      onSuccess: (data, variables) => {
        setArquivoCertificadoBase64(null);
        setArquivoCertificadoNome("");
        setNovoCertificadoAlias("");
        setNovoCertificadoSenha("");
        if (certificadoFileInputRef.current) {
          certificadoFileInputRef.current.value = "";
        }
        void loadCertificados(variables.prestadorId, data.id);
      },
    }
  );

  const atualizarAliasCertificadoMutation = useApiMutation(
    ({ prestadorId, certificadoId, alias }: { prestadorId: string; certificadoId: string; alias: string | null }) =>
      atualizarCertificadoPrestador(prestadorId, certificadoId, { alias }),
    {
      successMessage: "Alias atualizado.",
      onSuccess: (_data, variables) => {
        void loadCertificados(variables.prestadorId);
      },
    }
  );

  const atualizarSenhaCertificadoMutation = useApiMutation(
    ({ prestadorId, certificadoId, senha }: { prestadorId: string; certificadoId: string; senha: string }) =>
      atualizarSenhaCertificadoPrestador(prestadorId, certificadoId, { senha }),
    {
      successMessage: "Senha do certificado atualizada.",
      onSuccess: (_data, variables) => {
        void loadCertificados(variables.prestadorId);
      },
    }
  );

  const removerCertificadoMutation = useApiMutation(
    ({ prestadorId, certificadoId }: { prestadorId: string; certificadoId: string }) =>
      removerCertificadoPrestador(prestadorId, certificadoId),
    {
      successMessage: "Certificado removido.",
      onSuccess: (_data, variables) => {
        void loadCertificados(variables.prestadorId);
      },
    }
  );

  const handleCertificadoFileChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) {
        setArquivoCertificadoBase64(null);
        setArquivoCertificadoNome("");
        return;
      }

      const allowedExtensions = [".pfx", ".p12"];
      const hasValidExtension = allowedExtensions.some((extension) => file.name.toLowerCase().endsWith(extension));
      if (!hasValidExtension) {
        toast.error("Selecione um arquivo .pfx ou .p12 válido.");
        setArquivoCertificadoBase64(null);
        setArquivoCertificadoNome("");
        if (certificadoFileInputRef.current) {
          certificadoFileInputRef.current.value = "";
        }
        return;
      }

      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result;
        if (typeof result === "string") {
          const [, base64] = result.split(",");
          setArquivoCertificadoBase64(base64 ?? null);
          setArquivoCertificadoNome(file.name);
        } else {
          toast.error("Não foi possível processar o arquivo selecionado.");
          setArquivoCertificadoBase64(null);
          setArquivoCertificadoNome("");
        }
      };
      reader.onerror = () => {
        toast.error("Falha ao ler o arquivo do certificado.");
        setArquivoCertificadoBase64(null);
        setArquivoCertificadoNome("");
      };
      reader.readAsDataURL(file);
    },
    []
  );

  const handleUploadCertificado = useCallback(async () => {
    if (!configPrestador) {
      toast.error("Selecione um prestador para enviar o certificado.");
      return;
    }

    if (!arquivoCertificadoBase64) {
      toast.error("Escolha o arquivo do certificado (.pfx).");
      return;
    }

    if (!novoCertificadoSenha.trim()) {
      toast.error("Informe a senha do certificado.");
      return;
    }

    await uploadCertificadoMutation.mutateAsync({
      prestadorId: configPrestador.id,
      payload: {
        alias: novoCertificadoAlias.trim() ? novoCertificadoAlias.trim() : undefined,
        conteudo: arquivoCertificadoBase64,
        senha: novoCertificadoSenha,
      },
    });
  }, [
    arquivoCertificadoBase64,
    configPrestador,
    novoCertificadoAlias,
    novoCertificadoSenha,
    uploadCertificadoMutation,
  ]);

  const handleCertificadoSelecionado = useCallback(
    (certificadoId: string) => {
      setCertificadoSelecionadoId(certificadoId);
      const selecionado = certificados.find((item) => item.id === certificadoId);
      if (!selecionado) {
        return;
      }

      setModoEdicao("edicao");
      setNovoCertificadoAlias(selecionado.alias ?? "");
      setNovoCertificadoSenha("");
      setArquivoCertificadoBase64(null);
      setArquivoCertificadoNome("");
      if (certificadoFileInputRef.current) {
        certificadoFileInputRef.current.value = "";
      }
    },
    [certificados]
  );

  const handleSalvarEdicao = useCallback(
    async () => {
      if (!configPrestador || !certificadoSelecionadoId) {
        toast.error("Selecione um certificado para editar.");
        return;
      }

      const selecionado = certificados.find((item) => item.id === certificadoSelecionadoId);
      if (!selecionado) {
        toast.error("Certificado selecionado não encontrado.");
        return;
      }

      const aliasNormalizado = novoCertificadoAlias.trim();
      const senhaNormalizada = novoCertificadoSenha.trim();

      const updates: Promise<unknown>[] = [];

      if ((selecionado.alias ?? "") !== aliasNormalizado) {
        updates.push(
          atualizarAliasCertificadoMutation.mutateAsync({
            prestadorId: configPrestador.id,
            certificadoId: selecionado.id,
            alias: aliasNormalizado.length > 0 ? aliasNormalizado : null,
          })
        );
      }

      if (senhaNormalizada.length > 0) {
        updates.push(
          atualizarSenhaCertificadoMutation.mutateAsync({
            prestadorId: configPrestador.id,
            certificadoId: selecionado.id,
            senha: senhaNormalizada,
          })
        );
      }

      if (updates.length === 0) {
        toast.message("Nenhuma alteração para salvar.");
        return;
      }

      await Promise.all(updates);

      setModoEdicao("criacao");
      setCertificadoSelecionadoId(null);
      setNovoCertificadoAlias("");
      setNovoCertificadoSenha("");
    },
    [
      atualizarAliasCertificadoMutation,
      atualizarSenhaCertificadoMutation,
      certificadoSelecionadoId,
      certificados,
      configPrestador,
      novoCertificadoAlias,
      novoCertificadoSenha,
    ]
  );

  const handleRemoverCertificado = useCallback(
    async (certificado: PrestadorCertificadoDto) => {
      if (!configPrestador) {
        toast.error("Selecione um prestador.");
        return;
      }

      const confirmed = window.confirm(
        `Confirma a exclusão do certificado ${certificado.alias ?? certificado.cnpj}? Essa ação é irreversível.`
      );
      if (!confirmed) {
        return;
      }

      await removerCertificadoMutation.mutateAsync({
        prestadorId: configPrestador.id,
        certificadoId: certificado.id,
      });
    },
    [configPrestador, removerCertificadoMutation]
  );

  const cidadeWatch = useWatch({ control: form.control, name: "endereco.cidade" });
  const ufWatch = useWatch({ control: form.control, name: "endereco.uf" });
  const codigoMunicipioIbgeWatch = useWatch({
    control: form.control,
    name: "endereco.codigoMunicipioIbge",
  });
  const carregarMunicipioPorCodigo = useCallback(
    async (codigo?: string | null) => {
      const normalized = codigo?.trim();
      if (!normalized || normalized.length !== 7) {
        return;
      }

      try {
        setIsIbgeLoading(true);
        const municipio = await obterMunicipioPorCodigoIbge(normalized);
        const ibgeCodigo = String(municipio.id).padStart(7, "0");
        const cidadeNome = municipio.nome;
        const ufSigla = municipio.microrregiao?.mesorregiao?.UF?.sigla ?? "";

        setMunicipioOptions((options) => {
          const newOption: MunicipioOption = {
            label: cidadeNome,
            value: cidadeNome,
            ibge: ibgeCodigo,
          };

          const exists = options.some((option) => option.ibge === ibgeCodigo);
          if (exists) {
            return options.map((option) => (option.ibge === ibgeCodigo ? newOption : option));
          }

          return [newOption, ...options];
        });

        form.setValue("endereco.cidade", cidadeNome, {
          shouldDirty: false,
          shouldValidate: true,
        });
        form.setValue("endereco.codigoMunicipioIbge", ibgeCodigo, {
          shouldDirty: false,
          shouldValidate: true,
        });
        if (ufSigla) {
          form.setValue("endereco.uf", ufSigla, {
            shouldDirty: false,
            shouldValidate: true,
          });
        }
      } catch (error) {
        console.error(error);
        toast.error("Não foi possível carregar o município pelo código IBGE.");
      } finally {
        setIsIbgeLoading(false);
      }
    },
    [form, obterMunicipioPorCodigoIbge]
  );

  const consultarCep = useCallback(
    async (value: string) => {
      const cepDigits = onlyDigits(value);
      if (cepDigits.length !== 8) {
        toast.error("Informe um CEP com 8 dígitos.");
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
          form.setValue("endereco.logradouro", data.logradouro, {
            shouldDirty: true,
            shouldValidate: true,
          });
        }

        if (data.bairro) {
          form.setValue("endereco.bairro", data.bairro, {
            shouldDirty: true,
            shouldValidate: true,
          });
        }

        if (data.localidade) {
          form.setValue("endereco.cidade", data.localidade, {
            shouldDirty: true,
            shouldValidate: true,
          });
        }

        if (data.uf) {
          form.setValue("endereco.uf", data.uf, {
            shouldDirty: true,
            shouldValidate: true,
          });
        }

        if (data.ibge) {
          form.setValue("endereco.codigoMunicipioIbge", data.ibge, {
            shouldDirty: true,
            shouldValidate: true,
          });
        }

        if (data.localidade) {
          setMunicipioOptions((options) => {
            const newOption: MunicipioOption = {
              label: data.localidade!,
              value: data.localidade!,
              ibge: data.ibge ?? "",
            };

            const exists = options.some((option) => option.value === newOption.value);
            if (exists) {
              return options.map((option) => (option.value === newOption.value ? newOption : option));
            }

            return [newOption, ...options];
          });
        }

        toast.success("Endereço preenchido automaticamente.");
        lastConsultedCepRef.current = cepDigits;
      } catch (error) {
        console.error(error);
        toast.error("Não foi possível consultar o CEP.");
        lastConsultedCepRef.current = null;
      } finally {
        setIsViaCepLoading(false);
      }
    },
    [form]
  );

  const handleCepBlur = useCallback(async () => {
    const cepValue = form.getValues("endereco.cep");
    if (!cepValue) {
      return;
    }

    if (onlyDigits(cepValue).length !== 8) {
      return;
    }

    await consultarCep(cepValue);
  }, [consultarCep, form]);

  useEffect(() => {
    (async () => {
      try {
        setIsIbgeLoading(true);
        const data = await listarUfs();
        setUfs(data);
      } catch (error) {
        console.error(error);
        toast.error("Não foi possível carregar as UFs do IBGE.");
      } finally {
        setIsIbgeLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    const normalizedCity = cidadeWatch?.trim();
    if (!normalizedCity) {
      return;
    }

    setMunicipioOptions((options) => {
      const newOption: MunicipioOption = {
        label: normalizedCity,
        value: normalizedCity,
        ibge: codigoMunicipioIbgeWatch ?? "",
      };

      const exists = options.some((option) => option.value === newOption.value);
      if (exists) {
        return options.map((option) => (option.value === newOption.value ? newOption : option));
      }

      return [newOption, ...options];
    });
  }, [cidadeWatch, codigoMunicipioIbgeWatch]);

  useEffect(() => {
    const loadMunicipios = async () => {
      const ufSigla = ufWatch?.trim().toUpperCase();
      if (!ufSigla) {
        setMunicipioOptions([]);
        return;
      }

      const uf = ufs.find((item) => item.sigla === ufSigla);
      if (!uf) {
        setMunicipioOptions([]);
        return;
      }

      try {
        setIsIbgeLoading(true);
        const municipios = await listarMunicipiosPorUf(uf.id);
        const mapped = municipios.map((municipio) => ({
          label: municipio.nome,
          value: municipio.nome,
          ibge: String(municipio.id).padStart(7, "0"),
        }));

        setMunicipioOptions(mapped);

        const codigoAtual = form.getValues("endereco.codigoMunicipioIbge");
        if (codigoAtual) {
          const match = mapped.find((municipio) => municipio.ibge === codigoAtual);
          if (match) {
            form.setValue("endereco.cidade", match.value, {
              shouldDirty: false,
              shouldValidate: true,
            });
          }
        }
      } catch (error) {
        console.error(error);
        toast.error("Não foi possível carregar os municípios do IBGE.");
        setMunicipioOptions([]);
      } finally {
        setIsIbgeLoading(false);
      }
    };

    void loadMunicipios();
  }, [ufWatch, ufs, form]);

  useEffect(() => {
    const codigoAtual = codigoMunicipioIbgeWatch?.trim();
    if (!codigoAtual) {
      return;
    }

    const match = municipioOptions.find((municipio) => municipio.ibge === codigoAtual);
    if (match) {
      if (form.getValues("endereco.cidade") !== match.value) {
        form.setValue("endereco.cidade", match.value, {
          shouldDirty: false,
          shouldValidate: true,
        });
      }
      return;
    }

    void carregarMunicipioPorCodigo(codigoAtual);
  }, [codigoMunicipioIbgeWatch, municipioOptions, form, carregarMunicipioPorCodigo]);

  useEffect(() => {
    const enderecoCodigo = codigoMunicipioIbgeWatch?.trim();
    if (!enderecoCodigo) {
      return;
    }

    if (form.getValues("endereco.codigoMunicipioIbge") !== enderecoCodigo) {
      form.setValue("endereco.codigoMunicipioIbge", enderecoCodigo, {
        shouldDirty: false,
        shouldValidate: true,
      });
    }
  }, [codigoMunicipioIbgeWatch, form]);

  const handleCidadeChange = useCallback(
    (cidade: string) => {
      const trimmed = cidade.trim();
      if (!trimmed) {
        return;
      }

      const match = municipioOptions.find((municipio) => municipio.value === trimmed);
      if (match) {
        form.setValue("endereco.codigoMunicipioIbge", match.ibge, {
          shouldDirty: true,
          shouldValidate: true,
        });
      }
    },
    [form, municipioOptions]
  );

  const openCreateModal = () => {
    form.reset({
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
    });
    setEditingPrestador(null);
    setMunicipioOptions([]);
    lastConsultedCepRef.current = null;
    setIsFormOpen(true);
  };

  const openEditModal = (prestador: PrestadorDto) => {
    form.reset({
      cnpj: onlyDigits(prestador.cnpj),
      razaoSocial: prestador.razaoSocial,
      nomeFantasia: prestador.nomeFantasia,
      inscricaoMunicipal: prestador.inscricaoMunicipal,
      inscricaoEstadual: prestador.inscricaoEstadual ?? "",
      telefone: prestador.telefone ? onlyDigits(prestador.telefone).slice(0, 11) : "",
      email: prestador.email ?? "",
      website: prestador.website ?? "",
      endereco: {
        logradouro: prestador.endereco.logradouro,
        numero: prestador.endereco.numero,
        complemento: prestador.endereco.complemento ?? "",
        bairro: prestador.endereco.bairro,
        cidade: prestador.endereco.cidade ?? "",
        codigoMunicipioIbge: prestador.endereco.codigoMunicipioIbge,
        uf: prestador.endereco.uf ?? "",
        cep: prestador.endereco.cep ?? "",
      },
    });
    setEditingPrestador(prestador);
    setMunicipioOptions(
      prestador.endereco.cidade
        ? [
            {
              label: prestador.endereco.cidade,
              value: prestador.endereco.cidade,
              ibge: prestador.endereco.codigoMunicipioIbge,
            },
          ]
        : []
    );
    lastConsultedCepRef.current = prestador.endereco.cep ?? null;
    setIsFormOpen(true);
    void carregarMunicipioPorCodigo(prestador.endereco.codigoMunicipioIbge);
  };

  const closeFormModal = () => {
    setIsFormOpen(false);
    setEditingPrestador(null);
    setMunicipioOptions([]);
    lastConsultedCepRef.current = null;
  };

  const onSubmitForm = form.handleSubmit(async (values) => {
    const inscricaoEstadual = values.inscricaoEstadual?.trim() ?? "";

    const payload: CreatePrestadorDto = {
      cnpj: values.cnpj,
      razaoSocial: values.razaoSocial,
      nomeFantasia: values.nomeFantasia,
      inscricaoMunicipal: values.inscricaoMunicipal,
      inscricaoEstadual,
      telefone: values.telefone || undefined,
      email: values.email || undefined,
      website: values.website || undefined,
      endereco: {
        logradouro: values.endereco.logradouro,
        numero: values.endereco.numero,
        complemento: values.endereco.complemento || undefined,
        bairro: values.endereco.bairro,
        codigoMunicipioIbge: values.endereco.codigoMunicipioIbge,
        uf: values.endereco.uf || undefined,
        cep: values.endereco.cep || undefined,
      },
    };

    if (editingPrestador) {
      const updatePayload: UpdatePrestadorDto = {
        cnpj: values.cnpj,
        razaoSocial: values.razaoSocial,
        nomeFantasia: values.nomeFantasia,
        inscricaoMunicipal: values.inscricaoMunicipal,
        inscricaoEstadual,
        telefone: values.telefone || undefined,
        email: values.email || undefined,
        website: values.website || undefined,
        endereco: {
          logradouro: values.endereco.logradouro,
          numero: values.endereco.numero,
          complemento: values.endereco.complemento || undefined,
          bairro: values.endereco.bairro,
          codigoMunicipioIbge: values.endereco.codigoMunicipioIbge,
          uf: values.endereco.uf || undefined,
          cep: values.endereco.cep || undefined,
        },
      };
      await updateMutation.mutateAsync({ id: editingPrestador.id, payload: updatePayload });
    } else {
      await createMutation.mutateAsync(payload);
      setPage(1);
    }
  });

  const openConfigModal = async (prestador: PrestadorDto) => {
    setConfigPrestador(prestador);
    setConfigData(null);
    setConfigTab("fiscal");
    setIsConfigLoading(true);
    setCertificados([]);
    setCertificadoSelecionadoId(null);
    setArquivoCertificadoBase64(null);
    setArquivoCertificadoNome("");
    setNovoCertificadoAlias("");
    setNovoCertificadoSenha("");
    setModoEdicao("criacao");
    if (certificadoFileInputRef.current) {
      certificadoFileInputRef.current.value = "";
    }
    try {
      const data = await obterConfiguracaoPrestador(prestador.id);
      setConfigData(data);
      configForm.reset({
        versaoAplicacao: data.versaoAplicacao ?? "",
        enviaEmailAutomatico: data.enviaEmailAutomatico ?? false,
        smtpHost: data.smtpHost ?? "",
        smtpPort: data.smtpPort ?? 587,
        smtpSecure: data.smtpSecure ?? false,
        smtpUser: data.smtpUser ?? "",
        smtpPassword: "",
        smtpFrom: data.smtpFrom ?? "",
        smtpFromName: data.smtpFromName ?? "",
        bilhetagemHabilitada: data.bilhetagemHabilitada ?? false,
        creditoMensalPadrao: data.creditoMensalPadrao ?? null,
        saldoNotasDisponiveis: data.saldoNotasDisponiveis ?? null,
        competenciaSaldo: formatDateLocalInput(data.competenciaSaldo),
      });
    } catch (error: unknown) {
      console.error("[Configuração] Falha ao carregar configuração do prestador", {
        prestadorId: prestador.id,
        erro: isApiError(error)
          ? { status: error.status, payload: error.payload }
          : { tipo: error instanceof Error ? error.name : typeof error },
      });
      const mensagem = isApiError(error)
        ? error.payload?.mensagem ?? error.message
        : "Não foi possível carregar a configuração do prestador.";
      toast.error(mensagem);

      configForm.reset({
        versaoAplicacao: "",
        enviaEmailAutomatico: true,
        smtpHost: "",
        smtpPort: 587,
        smtpSecure: false,
        smtpUser: "",
        smtpPassword: "",
        smtpFrom: "",
        smtpFromName: "",
        bilhetagemHabilitada: false,
        creditoMensalPadrao: null,
        saldoNotasDisponiveis: null,
        competenciaSaldo: null,
      });
    } finally {
      setIsConfigLoading(false);
    }
  };

  useEffect(() => {
    if (!configPrestador) {
      configForm.reset({
        versaoAplicacao: "",
        enviaEmailAutomatico: true,
        smtpHost: "",
        smtpPort: 587,
        smtpSecure: false,
        smtpUser: "",
        smtpPassword: "",
        smtpFrom: "",
        smtpFromName: "",
        bilhetagemHabilitada: false,
        creditoMensalPadrao: null,
        saldoNotasDisponiveis: null,
        competenciaSaldo: null,
      });
      setCertificados([]);
      setCertificadoSelecionadoId(null);
      setArquivoCertificadoBase64(null);
      setArquivoCertificadoNome("");
      setNovoCertificadoAlias("");
      setNovoCertificadoSenha("");
      setBilhetagemSaldo(null);
      setBilhetagemLancamentos([]);
      setIsBilhetagemLoading(false);
      if (certificadoFileInputRef.current) {
        certificadoFileInputRef.current.value = "";
      }
      return;
    }

    void loadCertificados(configPrestador.id);
    void loadBilhetagem(configPrestador.id);
  }, [configPrestador, configForm, loadCertificados, loadBilhetagem]);

  const closeConfigModal = () => {
    setConfigPrestador(null);
    setConfigData(null);
    setConfigTab("fiscal");
  };

  const onSubmitConfiguracao = configForm.handleSubmit(async (values) => {
    if (!configPrestador) return;
    let competenciaSaldoIso: string | null = null;
    if (values.competenciaSaldo) {
      const [year, month, day] = values.competenciaSaldo.split("-").map(Number);
      const date = new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0));
      competenciaSaldoIso = date.toISOString();
    }

    const creditoMensalPadraoSanitized =
      values.creditoMensalPadrao === null || Number.isNaN(values.creditoMensalPadrao)
        ? null
        : values.creditoMensalPadrao;
    const saldoNotasDisponiveisSanitized =
      values.saldoNotasDisponiveis === null || Number.isNaN(values.saldoNotasDisponiveis)
        ? null
        : values.saldoNotasDisponiveis;
    const bilhetagemHabilitada =
      typeof creditoMensalPadraoSanitized === "number" && creditoMensalPadraoSanitized > 0;

    const payload: UpsertPrestadorConfiguracaoDto = {
      versaoAplicacao: values.versaoAplicacao,
      enviaEmailAutomatico: values.enviaEmailAutomatico,
      smtpHost: values.smtpHost,
      smtpPort: values.smtpPort,
      smtpSecure: values.smtpSecure,
      smtpUser: values.smtpUser,
      smtpPassword: values.smtpPassword || undefined,
      smtpFrom: values.smtpFrom,
      smtpFromName: values.smtpFromName,
      bilhetagemHabilitada,
      creditoMensalPadrao: creditoMensalPadraoSanitized,
      saldoNotasDisponiveis: saldoNotasDisponiveisSanitized,
      competenciaSaldo: competenciaSaldoIso,
    };

    await configMutation.mutateAsync({
      prestadorId: configPrestador.id,
      payload,
    });
  });

  const handleDelete = async (prestador: PrestadorDto) => {
    if (
      window.confirm(`Confirma a exclusão do prestador ${prestador.nomeFantasia}? Essa ação é irreversível.`)
    ) {
      await deleteMutation.mutateAsync(prestador.id);
    }
  };

  return (
    <div className="flex flex-col gap-6 text-[hsl(var(--foreground))]">
      <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-semibold text-[hsl(var(--foreground))]">Prestadores</h1>
          <p className="text-sm text-[hsl(var(--muted-foreground))]">
            Gerencie empresas emissoras e suas configurações fiscais para NFSe.
          </p>
        </div>
        {canCreate && (
          <Button onClick={openCreateModal} className="w-full sm:w-auto">
            <Plus className="mr-2 h-4 w-4" /> Novo prestador
          </Button>
        )}
      </header>

      <Card>
        <div className="flex flex-col gap-4 p-6">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="relative flex w-full max-w-md items-center">
              <Search className="absolute left-3 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Pesquisar por nome fantasia, CNPJ ou razão social"
                className="pl-9"
                value={searchTerm}
                onChange={(event) => {
                  setSearchTerm(event.target.value);
                  setPage(1);
                }}
              />
            </div>
            <span className="text-sm text-slate-500">
              {totalItems} resultado{totalItems === 1 ? "" : "s"}
            </span>
          </div>

          <div className="overflow-hidden rounded-2xl border border-slate-200">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome fantasia</TableHead>
                  <TableHead>CNPJ</TableHead>
                  <TableHead>Telefone</TableHead>
                  <TableHead className="w-48 text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedPrestadores.map((prestador) => (
                  <TableRow key={prestador.id}>
                    <TableCell className="font-medium text-slate-900">
                      {prestador.nomeFantasia}
                    </TableCell>
                    <TableCell>{formatCnpj(prestador.cnpj)}</TableCell>
                    <TableCell>{prestador.telefone ? formatTelefone(prestador.telefone) : "—"}</TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openConfigModal(prestador)}
                          disabled={!canEdit || configMutation.isPending}
                          title={canEdit ? "Configurar" : "Sem permissão"}
                        >
                          <SlidersHorizontal className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEditModal(prestador)}
                          disabled={!canEdit}
                          title={canEdit ? "Editar" : "Sem permissão"}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-600 hover:bg-red-50"
                          onClick={() => handleDelete(prestador)}
                          disabled={!canDelete || deleteMutation.isPending}
                          title={canDelete ? "Excluir" : "Sem permissão"}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {paginatedPrestadores.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-sm text-slate-500">
                      Nenhum prestador encontrado.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          <Pagination
            page={currentPage}
            pageSize={pageSize}
            total={totalItems}
            onPageChange={setPage}
          />
        </div>
      </Card>

      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">
                  {editingPrestador ? "Editar prestador" : "Novo prestador"}
                </h2>
                <p className="text-sm text-slate-500">
                  Preencha os dados cadastrais e endereço conforme registro oficial.
                </p>
              </div>
              <button
                type="button"
                className="text-slate-400 transition-colors hover:text-slate-600"
                onClick={closeFormModal}
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={onSubmitForm} className="space-y-5 px-6 py-6">
              <section className="grid gap-4 md:grid-cols-2">
                <div className="space-y-1">
                  <label className="text-sm font-medium text-slate-600" htmlFor="cnpj">
                    CNPJ
                  </label>
                  <Controller
                    control={form.control}
                    name="cnpj"
                    render={({ field }) => (
                      <Input
                        id="cnpj"
                        inputMode="numeric"
                        maxLength={18}
                        value={formatCnpj(field.value)}
                        onChange={(event) => field.onChange(onlyDigits(event.target.value).slice(0, 14))}
                      />
                    )}
                  />
                  {form.formState.errors.cnpj && (
                    <span className="text-sm text-red-600">
                      {form.formState.errors.cnpj.message}
                    </span>
                  )}
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-slate-600" htmlFor="inscricaoMunicipal">
                    Inscrição Municipal
                  </label>
                  <Controller
                    control={form.control}
                    name="inscricaoMunicipal"
                    render={({ field }) => (
                      <Input
                        id="inscricaoMunicipal"
                        inputMode="numeric"
                        value={formatInscricaoMunicipal(field.value)}
                        onChange={(event) => field.onChange(onlyDigits(event.target.value).slice(0, 15))}
                      />
                    )}
                  />
                  {form.formState.errors.inscricaoMunicipal && (
                    <span className="text-sm text-red-600">
                      {form.formState.errors.inscricaoMunicipal.message}
                    </span>
                  )}
                </div>
                <div className="space-y-1 md:col-span-2">
                  <label className="text-sm font-medium text-slate-600" htmlFor="razaoSocial">
                    Razão Social
                  </label>
                  <Input id="razaoSocial" {...form.register("razaoSocial")} />
                  {form.formState.errors.razaoSocial && (
                    <span className="text-sm text-red-600">
                      {form.formState.errors.razaoSocial.message}
                    </span>
                  )}
                </div>
                <div className="space-y-1 md:col-span-2">
                  <label className="text-sm font-medium text-slate-600" htmlFor="nomeFantasia">
                    Nome Fantasia
                  </label>
                  <Input id="nomeFantasia" {...form.register("nomeFantasia")} />
                  {form.formState.errors.nomeFantasia && (
                    <span className="text-sm text-red-600">
                      {form.formState.errors.nomeFantasia.message}
                    </span>
                  )}
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-slate-600" htmlFor="inscricaoEstadual">
                    Inscrição Estadual
                  </label>
                  <Controller
                    control={form.control}
                    name="inscricaoEstadual"
                    render={({ field }) => (
                      <Input
                        id="inscricaoEstadual"
                        inputMode="numeric"
                        value={formatInscricaoEstadual(field.value ?? "")}
                        onChange={(event) => field.onChange(onlyDigits(event.target.value).slice(0, 15))}
                      />
                    )}
                  />
                  {form.formState.errors.inscricaoEstadual && (
                    <span className="text-sm text-red-600">
                      {form.formState.errors.inscricaoEstadual.message}
                    </span>
                  )}
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-slate-600" htmlFor="telefone">
                    Telefone
                  </label>
                  <Controller
                    control={form.control}
                    name="telefone"
                    render={({ field }) => (
                      <Input
                        id="telefone"
                        inputMode="tel"
                        maxLength={15}
                        value={formatTelefone(field.value ?? "")}
                        onChange={(event) => field.onChange(onlyDigits(event.target.value).slice(0, 11))}
                      />
                    )}
                  />
                  {form.formState.errors.telefone && (
                    <span className="text-sm text-red-600">
                      {form.formState.errors.telefone.message}
                    </span>
                  )}
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-slate-600" htmlFor="email">
                    E-mail
                  </label>
                  <Input id="email" type="email" {...form.register("email")} />
                  {form.formState.errors.email && (
                    <span className="text-sm text-red-600">
                      {form.formState.errors.email.message}
                    </span>
                  )}
                </div>
                <div className="space-y-1 md:col-span-2">
                  <label className="text-sm font-medium text-slate-600" htmlFor="website">
                    Website
                  </label>
                  <Input id="website" type="url" {...form.register("website")} />
                  {form.formState.errors.website && (
                    <span className="text-sm text-red-600">
                      {form.formState.errors.website.message}
                    </span>
                  )}
                </div>
              </section>

              <section className="space-y-4">
                <div>
                  <h3 className="text-base font-semibold text-slate-900">Endereço</h3>
                  <p className="text-sm text-slate-500">
                    Informe o endereço completo para emissão e comunicação oficial.
                  </p>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-1 md:col-span-2">
                    <label className="text-sm font-medium text-slate-600" htmlFor="cep">
                      CEP
                    </label>
                    <Controller
                      control={form.control}
                      name="endereco.cep"
                      render={({ field }) => (
                        <div className="flex gap-3">
                          <Input
                            id="cep"
                            className="md:w-60"
                            inputMode="numeric"
                            maxLength={9}
                            value={formatCep(field.value ?? "")}
                            onChange={(event) => field.onChange(onlyDigits(event.target.value).slice(0, 8))}
                            onBlur={() => handleCepBlur()}
                          />
                          <Button
                            type="button"
                            variant="outline"
                            className="md:w-32"
                            disabled={isViaCepLoading || !field.value}
                            onClick={async () => {
                              if (field.value) {
                                await consultarCep(field.value);
                              }
                            }}
                          >
                            {isViaCepLoading ? "Buscando..." : "Buscar"}
                          </Button>
                        </div>
                      )}
                    />
                    {form.formState.errors.endereco?.cep && (
                      <span className="text-sm text-red-600">
                        {form.formState.errors.endereco.cep.message}
                      </span>
                    )}
                  </div>
                  <div className="space-y-1 md:col-span-2">
                    <label className="text-sm font-medium text-slate-600" htmlFor="logradouro">
                      Logradouro
                    </label>
                    <Input id="logradouro" {...form.register("endereco.logradouro")} />
                    {form.formState.errors.endereco?.logradouro && (
                      <span className="text-sm text-red-600">
                        {form.formState.errors.endereco.logradouro.message}
                      </span>
                    )}
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-slate-600" htmlFor="numero">
                      Número
                    </label>
                    <Input id="numero" {...form.register("endereco.numero")} />
                    {form.formState.errors.endereco?.numero && (
                      <span className="text-sm text-red-600">
                        {form.formState.errors.endereco.numero.message}
                      </span>
                    )}
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-slate-600" htmlFor="complemento">
                      Complemento
                    </label>
                    <Input id="complemento" {...form.register("endereco.complemento")} />
                    {form.formState.errors.endereco?.complemento && (
                      <span className="text-sm text-red-600">
                        {form.formState.errors.endereco.complemento.message}
                      </span>
                    )}
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-slate-600" htmlFor="bairro">
                      Bairro
                    </label>
                    <Input id="bairro" {...form.register("endereco.bairro")} />
                    {form.formState.errors.endereco?.bairro && (
                      <span className="text-sm text-red-600">
                        {form.formState.errors.endereco.bairro.message}
                      </span>
                    )}
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-slate-600" htmlFor="cidade">
                      Cidade
                    </label>
                    <Controller
                      control={form.control}
                      name="endereco.cidade"
                      render={({ field }) => (
                        <Input
                          id="cidade"
                          list="municipios"
                          value={field.value ?? ""}
                          onChange={(event) => {
                            field.onChange(event.target.value);
                            handleCidadeChange(event.target.value);
                          }}
                          onBlur={(event) => handleCidadeChange(event.target.value)}
                        />
                      )}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-slate-600" htmlFor="enderecoCodigoIbge">
                      Código Município IBGE
                    </label>
                    <Input
                      id="enderecoCodigoIbge"
                      maxLength={7}
                      {...form.register("endereco.codigoMunicipioIbge")}
                    />
                    {form.formState.errors.endereco?.codigoMunicipioIbge && (
                      <span className="text-sm text-red-600">
                        {form.formState.errors.endereco.codigoMunicipioIbge.message}
                      </span>
                    )}
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-slate-600" htmlFor="uf">
                      UF
                    </label>
                    <Controller
                      control={form.control}
                      name="endereco.uf"
                      render={({ field }) => (
                        <Input
                          id="uf"
                          list="ufs"
                          maxLength={2}
                          className="uppercase"
                          value={field.value ?? ""}
                          onChange={(event) =>
                            field.onChange(event.target.value.slice(0, 2).toUpperCase())
                          }
                        />
                      )}
                    />
                    <datalist id="ufs">
                      {ufs.map((uf) => (
                        <option key={uf.id} value={uf.sigla}>
                          {uf.sigla} - {uf.nome}
                        </option>
                      ))}
                    </datalist>
                    {form.formState.errors.endereco?.uf && (
                      <span className="text-sm text-red-600">
                        {form.formState.errors.endereco.uf.message}
                      </span>
                    )}
                  </div>
                </div>
              </section>

              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="ghost" onClick={closeFormModal}>
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                >
                  {editingPrestador ? "Salvar alterações" : "Cadastrar"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {configPrestador && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="max-h-[90vh] w-full max-w-5xl overflow-y-auto rounded-2xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-4 py-4 sm:px-6">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">Configuração fiscal</h2>
                <p className="text-sm text-slate-500">
                  {configPrestador.nomeFantasia} — atualizado em {formatDate(configData?.dataAtualizacao ?? configPrestador.dataAtualizacao)}
                </p>
              </div>
              <button
                type="button"
                className="text-slate-400 transition-colors hover:text-slate-600"
                onClick={closeConfigModal}
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="px-4 pt-4 sm:px-6">
              <div className="mb-4 flex flex-wrap gap-2 text-sm font-medium text-slate-600">
                <button
                  type="button"
                  onClick={() => setConfigTab("fiscal")}
                  className={`flex-1 rounded-lg border px-3 py-2 transition-colors ${
                    configTab === "fiscal"
                      ? "border-slate-200 bg-white text-slate-900 shadow"
                      : "border-transparent bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  Configuração fiscal
                </button>
                <button
                  type="button"
                  onClick={() => setConfigTab("certificados")}
                  className={`flex-1 rounded-lg border px-3 py-2 transition-colors ${
                    configTab === "certificados"
                      ? "border-slate-200 bg-white text-slate-900 shadow"
                      : "border-transparent bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  Certificados digitais
                </button>
              </div>
            </div>

            {configTab === "fiscal" ? (
              <form onSubmit={onSubmitConfiguracao} className="space-y-4 px-4 pb-5 sm:px-6">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-slate-600" htmlFor="versaoAplicacao">
                      Versão da aplicação
                    </label>
                    <Input id="versaoAplicacao" {...configForm.register("versaoAplicacao")} />
                    {configForm.formState.errors.versaoAplicacao && (
                      <span className="text-sm text-red-600">
                        {configForm.formState.errors.versaoAplicacao.message}
                      </span>
                    )}
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-slate-600" htmlFor="enviaEmailAutomatico">
                      Enviar e-mail automático
                    </label>
                    <Controller
                      control={configForm.control}
                      name="enviaEmailAutomatico"
                      render={({ field }) => (
                        <Select
                          id="enviaEmailAutomatico"
                          value={field.value ? "true" : "false"}
                          onChange={(event) => field.onChange(event.target.value === "true")}
                        >
                          <option value="true">Sim</option>
                          <option value="false">Não</option>
                        </Select>
                      )}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-slate-600" htmlFor="smtpHost">
                      SMTP Host
                    </label>
                    <Input id="smtpHost" {...configForm.register("smtpHost")} />
                    {configForm.formState.errors.smtpHost && (
                      <span className="text-sm text-red-600">
                        {configForm.formState.errors.smtpHost.message}
                      </span>
                    )}
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-slate-600" htmlFor="smtpPort">
                      SMTP Port
                    </label>
                    <Input
                      id="smtpPort"
                      type="number"
                      min={1}
                      max={65535}
                      {...configForm.register("smtpPort", { valueAsNumber: true })}
                    />
                    {configForm.formState.errors.smtpPort && (
                      <span className="text-sm text-red-600">
                        {configForm.formState.errors.smtpPort.message}
                      </span>
                    )}
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-slate-600" htmlFor="smtpSecure">
                      SMTP usa TLS/SSL
                    </label>
                    <Controller
                      control={configForm.control}
                      name="smtpSecure"
                      render={({ field }) => (
                        <Select
                          id="smtpSecure"
                          value={field.value ? "true" : "false"}
                          onChange={(event) => field.onChange(event.target.value === "true")}
                        >
                          <option value="false">Não</option>
                          <option value="true">Sim</option>
                        </Select>
                      )}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-slate-600" htmlFor="smtpUser">
                      SMTP User
                    </label>
                    <Input id="smtpUser" {...configForm.register("smtpUser")} />
                    {configForm.formState.errors.smtpUser && (
                      <span className="text-sm text-red-600">
                        {configForm.formState.errors.smtpUser.message}
                      </span>
                    )}
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-slate-600" htmlFor="smtpPassword">
                      SMTP Password
                    </label>
                    <Input id="smtpPassword" type="password" {...configForm.register("smtpPassword")} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-slate-600" htmlFor="smtpFrom">
                      SMTP From (e-mail)
                    </label>
                    <Input id="smtpFrom" type="email" {...configForm.register("smtpFrom")} />
                    {configForm.formState.errors.smtpFrom && (
                      <span className="text-sm text-red-600">
                        {configForm.formState.errors.smtpFrom.message}
                      </span>
                    )}
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-slate-600" htmlFor="smtpFromName">
                      SMTP From (nome)
                    </label>
                    <Input id="smtpFromName" {...configForm.register("smtpFromName")} />
                    {configForm.formState.errors.smtpFromName && (
                      <span className="text-sm text-red-600">
                        {configForm.formState.errors.smtpFromName.message}
                      </span>
                    )}
                  </div>
                </div>

                <Card className="border border-slate-200 bg-slate-50">
                  <CardHeader className="pb-2">
                    <CardTitle>Bilhetagem</CardTitle>
                    <CardDescription>
                      Configure a habilitação, crédito mensal e saldo disponível para emissão de notas.
                    </CardDescription>
                  </CardHeader>

                  <div className="space-y-4">
                    <div className="flex flex-wrap items-center gap-3 text-sm text-slate-600">
                      {isBilhetagemLoading ? (
                        <span className="inline-flex items-center gap-2">
                          <Loader2 className="h-4 w-4 animate-spin text-slate-500" />
                          Carregando dados de bilhetagem...
                        </span>
                      ) : (
                        <>
                          <Badge className={resumoBilhetagemHabilitada ? "bg-emerald-500" : "bg-slate-500"}>
                            {resumoBilhetagemHabilitada ? "Bilhetagem habilitada" : "Bilhetagem desabilitada"}
                          </Badge>
                        </>
                      )}
                    </div>

                    <div className="grid gap-3 sm:grid-cols-3">
                      <div className="space-y-1">
                        <label
                          className="text-sm font-medium text-slate-600"
                          htmlFor="creditoMensalPadrao"
                        >
                          Crédito mensal padrão
                        </label>
                        <Controller
                          control={configForm.control}
                          name="creditoMensalPadrao"
                          render={({ field }) => (
                            <Input
                              id="creditoMensalPadrao"
                              type="number"
                              min={0}
                              step={1}
                              value={field.value ?? ""}
                              onChange={(event) => {
                                const value = event.target.value;
                                field.onChange(value === "" ? null : Number.parseInt(value, 10));
                              }}
                            />
                          )}
                        />
                        {configForm.formState.errors.creditoMensalPadrao && (
                          <span className="text-sm text-red-600">
                            {configForm.formState.errors.creditoMensalPadrao.message}
                          </span>
                        )}
                      </div>

                      <div className="space-y-1">
                        <label
                          className="text-sm font-medium text-slate-600"
                          htmlFor="saldoNotasDisponiveis"
                        >
                          Saldo de notas disponíveis
                        </label>
                        <Controller
                          control={configForm.control}
                          name="saldoNotasDisponiveis"
                          render={({ field }) => (
                            <Input
                              id="saldoNotasDisponiveis"
                              type="number"
                              min={0}
                              step={1}
                              value={field.value ?? ""}
                              onChange={(event) => {
                                const value = event.target.value;
                                field.onChange(value === "" ? null : Number.parseInt(value, 10));
                              }}
                            />
                          )}
                        />
                        {configForm.formState.errors.saldoNotasDisponiveis && (
                          <span className="text-sm text-red-600">
                            {configForm.formState.errors.saldoNotasDisponiveis.message}
                          </span>
                        )}
                      </div>

                      <div className="space-y-1">
                        <label
                          className="text-sm font-medium text-slate-600"
                          htmlFor="competenciaSaldo"
                        >
                          Competência do saldo
                        </label>
                        <Controller
                          control={configForm.control}
                          name="competenciaSaldo"
                          render={({ field }) => (
                            <Input
                              id="competenciaSaldo"
                              type="date"
                              value={field.value ?? ""}
                              onChange={(event) => field.onChange(event.target.value || null)}
                            />
                          )}
                        />
                      </div>
                    </div>
{/* 
                    {bilhetagemLancamentos.length > 0 && (
                      <div className="space-y-2">
                        <h4 className="text-sm font-medium text-slate-600">Últimos lançamentos</h4>
                        <ul className="space-y-2">
                          {bilhetagemLancamentos.slice(0, 5).map((lancamento) => (
                            <li
                              key={lancamento.id}
                              className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600"
                            >
                              <span>{formatDateTime(lancamento.dataCriacao)}</span>
                              <span className="font-medium text-slate-900">
                                {formatInteger(lancamento.quantidade)}
                              </span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )} */}
                  </div>
                </Card>

                <div className="flex justify-end gap-2 pt-2">
                  <Button type="button" variant="ghost" onClick={closeConfigModal}>
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={configMutation.isPending || isConfigLoading}>
                    Salvar configuração
                  </Button>
                </div>
              </form>
            ) : (
              <div className="space-y-4 px-4 pb-5 sm:px-6">
                <section className="space-y-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <header className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <h3 className="text-base font-semibold text-slate-900">Certificados digitais A1</h3>
                      <p className="text-sm text-slate-500">
                        Gerencie o arquivo .pfx do prestador e mantenha alias e senha atualizados.
                      </p>
                    </div>
                    <Badge className="whitespace-nowrap">
                      {isCertificadosLoading
                        ? "Carregando..."
                        : `${certificados.length} certificado${certificados.length === 1 ? "" : "s"}`}
                    </Badge>
                  </header>

                  <div className="grid gap-3 md:grid-cols-2">
                    <div className="space-y-1">
                      <label className="text-sm font-medium text-slate-600" htmlFor="certificadoAlias">
                        Alias {modoEdicao === "edicao" ? "do certificado" : "(opcional)"}
                      </label>
                      <Input
                        id="certificadoAlias"
                        value={novoCertificadoAlias}
                        onChange={(event) => setNovoCertificadoAlias(event.target.value)}
                        placeholder={modoEdicao === "edicao" ? "Alias do certificado selecionado" : "Ex.: Matriz 2025"}
                        disabled={modoEdicao === "criacao" && !configPrestador}
                      />
                    </div>
                    {modoEdicao === "criacao" && (
                      <div className="space-y-1">
                        <label className="text-sm font-medium text-slate-600" htmlFor="certificadoSenha">
                          Senha do certificado
                        </label>
                        <Input
                          id="certificadoSenha"
                          type="password"
                          value={novoCertificadoSenha}
                          onChange={(event) => setNovoCertificadoSenha(event.target.value)}
                          placeholder="Informe a senha do arquivo"
                        />
                      </div>
                    )}
                    {modoEdicao === "edicao" && (
                      <div className="space-y-1">
                        <label className="text-sm font-medium text-slate-600" htmlFor="certificadoNovaSenha">
                          Nova senha (opcional)
                        </label>
                        <Input
                          id="certificadoNovaSenha"
                          type="password"
                          value={novoCertificadoSenha}
                          onChange={(event) => setNovoCertificadoSenha(event.target.value)}
                          placeholder="Preencha apenas se desejar alterar a senha"
                        />
                        <p className="text-xs text-slate-500">Deixe em branco para manter a senha atual.</p>
                      </div>
                    )}
                    {modoEdicao === "criacao" && (
                      <div className="space-y-1 md:col-span-2">
                        <label className="text-sm font-medium text-slate-600" htmlFor="certificadoArquivo">
                          Arquivo do certificado (.pfx ou .p12)
                        </label>
                        <Input
                          id="certificadoArquivo"
                          ref={certificadoFileInputRef}
                          type="file"
                          accept=".pfx,.p12"
                          onChange={handleCertificadoFileChange}
                        />
                        {arquivoCertificadoNome && (
                          <span className="text-xs text-slate-500">Arquivo selecionado: {arquivoCertificadoNome}</span>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {modoEdicao === "criacao" ? (
                      <>
                        <Button
                          type="button"
                          onClick={handleUploadCertificado}
                          disabled={
                            uploadCertificadoMutation.isPending ||
                            !arquivoCertificadoBase64 ||
                            !novoCertificadoSenha.trim()
                          }
                        >
                          {uploadCertificadoMutation.isPending && (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          )}
                          Enviar certificado
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => {
                            setArquivoCertificadoBase64(null);
                            setArquivoCertificadoNome("");
                            setNovoCertificadoAlias("");
                            setNovoCertificadoSenha("");
                            if (certificadoFileInputRef.current) {
                              certificadoFileInputRef.current.value = "";
                            }
                          }}
                          disabled={uploadCertificadoMutation.isPending && Boolean(arquivoCertificadoBase64)}
                        >
                          Limpar seleção
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button
                          type="button"
                          onClick={() => void handleSalvarEdicao()}
                          disabled={
                            atualizarAliasCertificadoMutation.isPending ||
                            atualizarSenhaCertificadoMutation.isPending ||
                            !certificadoSelecionadoId
                          }
                        >
                          {(atualizarAliasCertificadoMutation.isPending ||
                            atualizarSenhaCertificadoMutation.isPending) && (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          )}
                          Salvar alterações
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => {
                            setModoEdicao("criacao");
                            setCertificadoSelecionadoId(null);
                            setNovoCertificadoAlias("");
                            setNovoCertificadoSenha("");
                            if (certificadoFileInputRef.current) {
                              certificadoFileInputRef.current.value = "";
                            }
                          }}
                        >
                          Cancelar edição
                        </Button>
                      </>
                    )}
                  </div>

                  <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Alias</TableHead>
                          <TableHead>CNPJ</TableHead>
                          <TableHead>Validade</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="w-48 text-right">Ações</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {isCertificadosLoading ? (
                          <TableRow>
                            <TableCell colSpan={5} className="py-8 text-center text-sm text-slate-500">
                              Carregando certificados...
                            </TableCell>
                          </TableRow>
                        ) : certificados.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={5} className="py-8 text-center text-sm text-slate-500">
                              Nenhum certificado cadastrado.
                            </TableCell>
                          </TableRow>
                        ) : (
                          certificados.map((certificado) => {
                            const selecionado = certificadoSelecionadoId === certificado.id;
                            const estaVigente =
                              Boolean(certificado.validadeInicio) &&
                              Boolean(certificado.validadeFim) &&
                              isCertificadoVigente(certificado.validadeInicio, certificado.validadeFim);

                            return (
                              <TableRow key={certificado.id} className={selecionado ? "bg-slate-50" : undefined}>
                                <TableCell>
                                  <div className="flex items-center gap-3">
                                    <input
                                      type="radio"
                                      aria-label="Selecionar certificado"
                                      checked={selecionado}
                                      onChange={() => handleCertificadoSelecionado(certificado.id)}
                                      className="h-4 w-4 border-slate-300 text-slate-600 focus:ring-slate-400"
                                    />
                                    <span className="text-sm text-slate-700">{certificado.alias ?? "(sem alias)"}</span>
                                  </div>
                                </TableCell>
                                <TableCell className="font-mono text-sm text-slate-600">{certificado.cnpj}</TableCell>
                                <TableCell>
                                  <div className="flex flex-col text-xs text-slate-600">
                                    <span>Início: {formatDate(certificado.validadeInicio)}</span>
                                    <span>Fim: {formatDate(certificado.validadeFim)}</span>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <Badge className={estaVigente ? "bg-emerald-100 text-emerald-700" : "bg-slate-200 text-slate-600"}>
                                    {estaVigente ? "Ativo" : "Inativo"}
                                  </Badge>
                                </TableCell>
                                <TableCell>
                                  <div className="flex justify-end gap-2">
                                    <Button
                                      type="button"
                                      variant="outline"
                                      size="sm"
                                      onClick={() => handleCertificadoSelecionado(certificado.id)}
                                    >
                                      Editar
                                    </Button>
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="sm"
                                      className="text-red-600 hover:bg-red-50"
                                      onClick={() => void handleRemoverCertificado(certificado)}
                                      disabled={removerCertificadoMutation.isPending}
                                    >
                                      {removerCertificadoMutation.isPending ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                      ) : (
                                        <Trash2 className="h-4 w-4" />
                                      )}
                                    </Button>
                                  </div>
                                </TableCell>
                              </TableRow>
                            );
                          })
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </section>
                <div className="flex justify-end">
                  <Button type="button" variant="ghost" onClick={closeConfigModal}>
                    Fechar
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
