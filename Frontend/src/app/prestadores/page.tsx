"use client";

import { useMemo, useState, useEffect, useRef, useCallback } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Pencil, Trash2, SlidersHorizontal, Search, X } from "lucide-react";
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
} from "@/services/prestadores";
import { listarUfs, listarMunicipiosPorUf, type IbgeUf } from "@/services/ibge";
import { listarCertificados } from "@/services/nfse";
import { ApiError } from "@/services/http";
import { type CertificateInfo } from "@/types/nfse";
import {
  PrestadorDto,
  CreatePrestadorDto,
  UpdatePrestadorDto,
  PrestadorConfiguracaoDto,
  UpsertPrestadorConfiguracaoDto,
} from "@/types/prestadores";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
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
  cnae: z.string().optional().or(z.literal("")),
  tipoEmissao: z.coerce.number().int().min(1),
  codigoMunicipioIbge: z
    .string()
    .min(7, "Código IBGE deve conter 7 dígitos")
    .max(7, "Código IBGE deve conter 7 dígitos"),
  optanteSimplesNacional: z.coerce.number().int().min(0).max(1),
  regimeEspecialTributario: z.coerce.number().int().min(0),
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
  ambiente: z.coerce.number().int().min(1).max(2),
  versaoAplicacao: z.string().min(1, "Informe a versão da aplicação"),
  seriePadrao: z.string().min(1, "Informe a série padrão"),
  numeroAtual: z.coerce.number().int().min(1, "Número atual deve ser maior que zero"),
  enviaEmailAutomatico: z.boolean(),
  smtpHost: z.string().min(1, "Informe o host SMTP"),
  smtpPort: z.coerce.number().int().min(1).max(65535),
  smtpSecure: z.boolean(),
  smtpUser: z.string().min(1, "Informe o usuário SMTP"),
  smtpPassword: z.string().optional(),
  smtpFrom: z.string().email("Informe um e-mail válido"),
  smtpFromName: z.string().min(1, "Informe o nome do remetente"),
});

type ConfigFormValues = z.infer<typeof configuracaoSchema>;

const ambienteOptions = [
  { label: "Produção", value: 1 },
  { label: "Homologação", value: 2 },
];

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
  return new Date(value).toLocaleDateString("pt-BR");
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
  const [isConfigLoading, setIsConfigLoading] = useState(false);
  const [ufs, setUfs] = useState<IbgeUf[]>([]);
  const [municipioOptions, setMunicipioOptions] = useState<MunicipioOption[]>([]);
  const [isViaCepLoading, setIsViaCepLoading] = useState(false);
  const [isIbgeLoading, setIsIbgeLoading] = useState(false);
  const [certificados] = useState<CertificateInfo[]>([]);
  const [isCertificadosLoading] = useState(false);


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
      cnae: "",
      tipoEmissao: 1,
      codigoMunicipioIbge: "",
      optanteSimplesNacional: 0,
      regimeEspecialTributario: 0,
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
      ambiente: 2,
      versaoAplicacao: "",
      seriePadrao: "",
      numeroAtual: 1,
      enviaEmailAutomatico: true,
      smtpHost: "",
      smtpPort: 587,
      smtpSecure: false,
      smtpUser: "",
      smtpPassword: "",
      smtpFrom: "",
      smtpFromName: "",
    },
  });

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

  const cidadeWatch = useWatch({ control: form.control, name: "endereco.cidade" });
  const codigoMunicipioWatch = useWatch({ control: form.control, name: "endereco.codigoMunicipioIbge" });

  const ufWatch = useWatch({ control: form.control, name: "endereco.uf" });
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
        ibge: codigoMunicipioWatch ?? "",
      };

      const exists = options.some((option) => option.value === newOption.value);
      if (exists) {
        return options.map((option) => (option.value === newOption.value ? newOption : option));
      }

      return [newOption, ...options];
    });
  }, [cidadeWatch, codigoMunicipioWatch]);

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
    const codigoAtual = codigoMunicipioWatch?.trim();
    if (!codigoAtual) {
      return;
    }

    const match = municipioOptions.find((municipio) => municipio.ibge === codigoAtual);
    if (match && form.getValues("endereco.cidade") !== match.value) {
      form.setValue("endereco.cidade", match.value, {
        shouldDirty: false,
        shouldValidate: true,
      });
    }
  }, [codigoMunicipioWatch, municipioOptions, form]);

  useEffect(() => {
    const enderecoCodigo = codigoMunicipioWatch?.trim();
    if (!enderecoCodigo) {
      return;
    }

    if (form.getValues("codigoMunicipioIbge") !== enderecoCodigo) {
      form.setValue("codigoMunicipioIbge", enderecoCodigo, {
        shouldDirty: false,
        shouldValidate: true,
      });
    }
  }, [codigoMunicipioWatch, form]);

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
        form.setValue("codigoMunicipioIbge", match.ibge, {
          shouldDirty: false,
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
      cnae: "",
      tipoEmissao: 1,
      codigoMunicipioIbge: "",
      optanteSimplesNacional: 0,
      regimeEspecialTributario: 0,
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
      cnae: prestador.cnae ?? "",
      tipoEmissao: prestador.tipoEmissao,
      codigoMunicipioIbge: prestador.codigoMunicipioIbge,
      optanteSimplesNacional: prestador.optanteSimplesNacional,
      regimeEspecialTributario: prestador.regimeEspecialTributario,
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
  };

  const closeFormModal = () => {
    setIsFormOpen(false);
    setEditingPrestador(null);
    setMunicipioOptions([]);
    lastConsultedCepRef.current = null;
  };

  const onSubmitForm = form.handleSubmit(async (values) => {
    const payload: CreatePrestadorDto = {
      cnpj: values.cnpj,
      razaoSocial: values.razaoSocial,
      nomeFantasia: values.nomeFantasia,
      inscricaoMunicipal: values.inscricaoMunicipal,
      inscricaoEstadual: values.inscricaoEstadual || undefined,
      cnae: values.cnae || undefined,
      tipoEmissao: values.tipoEmissao,
      codigoMunicipioIbge: values.codigoMunicipioIbge,
      optanteSimplesNacional: values.optanteSimplesNacional,
      regimeEspecialTributario: values.regimeEspecialTributario,
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
        inscricaoEstadual: values.inscricaoEstadual || undefined,
        cnae: values.cnae || undefined,
        tipoEmissao: values.tipoEmissao,
        codigoMunicipioIbge: values.codigoMunicipioIbge,
        optanteSimplesNacional: values.optanteSimplesNacional,
        regimeEspecialTributario: values.regimeEspecialTributario,
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
    setIsConfigLoading(true);
    try {
      const data = await obterConfiguracaoPrestador(prestador.id);
      setConfigData(data);
      configForm.reset({
        ambiente: data.ambiente,
        versaoAplicacao: data.versaoAplicacao ?? "",
        seriePadrao: data.seriePadrao ?? "",
        numeroAtual: data.numeroAtual ?? 1,
        enviaEmailAutomatico: data.enviaEmailAutomatico ?? false,
        smtpHost: data.smtpHost ?? "",
        smtpPort: data.smtpPort ?? 587,
        smtpSecure: data.smtpSecure ?? false,
        smtpUser: data.smtpUser ?? "",
        smtpPassword: "",
        smtpFrom: data.smtpFrom ?? "",
        smtpFromName: data.smtpFromName ?? "",
      });
    } catch (error) {
      console.error(error);
      configForm.reset({
        ambiente: 2,
        versaoAplicacao: "",
        seriePadrao: "",
        numeroAtual: 1,
        enviaEmailAutomatico: true,
        smtpHost: "",
        smtpPort: 587,
        smtpSecure: false,
        smtpUser: "",
        smtpPassword: "",
        smtpFrom: "",
        smtpFromName: "",
      });
    } finally {
      setIsConfigLoading(false);
    }
  };

  useEffect(() => {
    if (!configPrestador) {
      configForm.reset({
        ambiente: 2,
      });
    }
  }, [configPrestador, configForm]);

  const closeConfigModal = () => {
    setConfigPrestador(null);
    setConfigData(null);
  };

  const onSubmitConfiguracao = configForm.handleSubmit(async (values) => {
    if (!configPrestador) return;
    const payload: UpsertPrestadorConfiguracaoDto = {
      ambiente: values.ambiente,
      versaoAplicacao: values.versaoAplicacao,
      seriePadrao: values.seriePadrao,
      numeroAtual: values.numeroAtual,
      enviaEmailAutomatico: values.enviaEmailAutomatico,
      smtpHost: values.smtpHost,
      smtpPort: values.smtpPort,
      smtpSecure: values.smtpSecure,
      smtpUser: values.smtpUser,
      smtpPassword: values.smtpPassword || undefined,
      smtpFrom: values.smtpFrom,
      smtpFromName: values.smtpFromName,
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
                  <label className="text-sm font-medium text-slate-600" htmlFor="cnae">
                    CNAE
                  </label>
                  <Input id="cnae" {...form.register("cnae")} />
                  {form.formState.errors.cnae && (
                    <span className="text-sm text-red-600">
                      {form.formState.errors.cnae.message}
                    </span>
                  )}
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-slate-600" htmlFor="codigoMunicipioIbge">
                    Código Município IBGE
                  </label>
                  <Input
                    id="codigoMunicipioIbge"
                    maxLength={7}
                    {...form.register("codigoMunicipioIbge")}
                  />
                  {form.formState.errors.codigoMunicipioIbge && (
                    <span className="text-sm text-red-600">
                      {form.formState.errors.codigoMunicipioIbge.message}
                    </span>
                  )}
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-slate-600" htmlFor="tipoEmissao">
                    Tipo de Emissão
                  </label>
                  <Select id="tipoEmissao" {...form.register("tipoEmissao")}>
                    <option value={1}>1 - Normal</option>
                    <option value={2}>2 - Contingência</option>
                  </Select>
                  {form.formState.errors.tipoEmissao && (
                    <span className="text-sm text-red-600">
                      {form.formState.errors.tipoEmissao.message}
                    </span>
                  )}
                </div>
                <div className="space-y-1">
                  <label
                    className="text-sm font-medium text-slate-600"
                    htmlFor="optanteSimplesNacional"
                  >
                    Optante Simples Nacional
                  </label>
                  <Select id="optanteSimplesNacional" {...form.register("optanteSimplesNacional")}>
                    <option value={1}>Sim</option>
                    <option value={0}>Não</option>
                  </Select>
                  {form.formState.errors.optanteSimplesNacional && (
                    <span className="text-sm text-red-600">
                      {form.formState.errors.optanteSimplesNacional.message}
                    </span>
                  )}
                </div>
                <div className="space-y-1">
                  <label
                    className="text-sm font-medium text-slate-600"
                    htmlFor="regimeEspecialTributario"
                  >
                    Regime Especial Tributário
                  </label>
                  <Input
                    id="regimeEspecialTributario"
                    type="number"
                    {...form.register("regimeEspecialTributario")}
                  />
                  {form.formState.errors.regimeEspecialTributario && (
                    <span className="text-sm text-red-600">
                      {form.formState.errors.regimeEspecialTributario.message}
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
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-xl">
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
            <form onSubmit={onSubmitConfiguracao} className="space-y-4 px-4 py-5 sm:px-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1">
                  <label className="text-sm font-medium text-slate-600" htmlFor="ambiente">
                    Ambiente
                  </label>
                  <Select id="ambiente" {...configForm.register("ambiente")}>
                    {ambienteOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.value} - {option.label}
                      </option>
                    ))}
                  </Select>
                  {configForm.formState.errors.ambiente && (
                    <span className="text-sm text-red-600">
                      {configForm.formState.errors.ambiente.message}
                    </span>
                  )}
                </div>
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
                  <label className="text-sm font-medium text-slate-600" htmlFor="seriePadrao">
                    Série padrão
                  </label>
                  <Input id="seriePadrao" maxLength={5} {...configForm.register("seriePadrao")} />
                  {configForm.formState.errors.seriePadrao && (
                    <span className="text-sm text-red-600">
                      {configForm.formState.errors.seriePadrao.message}
                    </span>
                  )}
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-slate-600" htmlFor="numeroAtual">
                    Número atual
                  </label>
                  <Input
                    id="numeroAtual"
                    type="number"
                    min={1}
                    {...configForm.register("numeroAtual", { valueAsNumber: true })}
                  />
                  {configForm.formState.errors.numeroAtual && (
                    <span className="text-sm text-red-600">
                      {configForm.formState.errors.numeroAtual.message}
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
              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="ghost" onClick={closeConfigModal}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={configMutation.isPending || isConfigLoading}>
                  Salvar configuração
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
