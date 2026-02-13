"use client";

import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Bot, RefreshCcw, Power, ShieldPlus, ArrowRightLeft, Plus, X, Copy } from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { useApiQuery } from "@/hooks/use-api-query";
import { useApiMutation } from "@/hooks/use-api-mutation";
import { listarPrestadores } from "@/services/prestadores";
import {
  listarRobotClients,
  criarRobotClient,
  atualizarRobotClient,
  inativarRobotClient,
  reativarRobotClient,
  rotacionarSecretRobotClient,
} from "@/services/robot-clients";
import { RobotClientDto, CreateRobotClientDto, UpdateRobotClientDto } from "@/types/robot-clients";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Pagination } from "@/components/ui/pagination";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

const robotSchema = z
  .object({
    prestadorId: z.string().uuid("Selecione um prestador"),
    nome: z.string().min(3, "Informe o nome"),
    clientId: z.string().trim().optional(),
    clientSecret: z.string().trim().optional(),
    scopes: z.array(z.string()).min(1, "Selecione ao menos um escopo"),
    ativo: z.boolean().optional(),
  })
  .superRefine((data, ctx) => {
    const clientId = data.clientId?.trim() ?? "";
    if (clientId && clientId.length < 3) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["clientId"],
        message: "O Client ID deve conter pelo menos 3 caracteres.",
      });
    }

    const clientSecret = data.clientSecret?.trim() ?? "";
    if (clientSecret && clientSecret.length < 8) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["clientSecret"],
        message: "O Client Secret deve conter pelo menos 8 caracteres.",
      });
    }
  });

type RobotFormValues = z.infer<typeof robotSchema>;

function generateClientSecret(length = 64) {
  const charset = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_";
  const values = new Uint8Array(length);

  if (typeof window !== "undefined" && window.crypto?.getRandomValues) {
    window.crypto.getRandomValues(values);
  } else {
    for (let index = 0; index < length; index += 1) {
      values[index] = Math.floor(Math.random() * charset.length);
    }
  }

  return Array.from(values, (value) => charset[value % charset.length]).join("");
}

const copySecret = async (value: string) => {
  try {
    await navigator.clipboard.writeText(value);
    toast.success("Copiado para a área de transferência.");
  } catch {
    toast.error("Não foi possível copiar o valor.");
  }
};

const scopeOptions = [
  {
    value: "nfse.certificados",
    label: "NFSe - Certificados",
    description: "Permite consultar certificados do prestador na SEFIN.",
  },
  {
    value: "nfse.emitir",
    label: "NFSe - Emissão",
    description: "Permite emitir NFSe em nome do prestador.",
  },
  {
    value: "nfse.cancelar",
    label: "NFSe - Cancelamento",
    description: "Permite cancelar NFSe do prestador.",
  },
  {
    value: "nfse.email",
    label: "NFSe - E-mail",
    description: "Permite enviar NFSe por e-mail em nome do prestador.",
  },
  {
    value: "nfse.danfse",
    label: "NFSe - DANFSe",
    description: "Permite baixar o DANFSe de notas emitidas.",
  },
  {
    value: "nfse.robot",
    label: "NFSe - Manutenção de Robôs",
    description: "Permite operar o cadastro de robô.",
  },  
];

const ALL_PRESTADORES_OPTION = "__all__";

const resolvePrestadorIdValue = (prestadorId: string | null) =>
  prestadorId && prestadorId !== ALL_PRESTADORES_OPTION ? prestadorId : "";

const buildRobotClientsQueryKey = (
  prestadorId: string | null,
  includeInactive: boolean,
  allPrestadoresKey: string
) => {
  if (prestadorId === ALL_PRESTADORES_OPTION) {
    return ["robot-clients", ALL_PRESTADORES_OPTION, includeInactive, allPrestadoresKey] as const;
  }

  return ["robot-clients", prestadorId ?? "", includeInactive] as const;
};

const areScopesEqual = (previous: string[], current: string[]) => {
  if (previous.length !== current.length) {
    return false;
  }

  const reference = new Set(previous.map((scope) => scope.toLowerCase()));
  return current.every((scope) => reference.has(scope.toLowerCase()));
};

export default function RobotClientsPage() {
  const { roles, user } = useAuth();
  const queryClient = useQueryClient();

  const isAdmin = roles.includes("Administrador");
  const [prestadorIdFilter, setPrestadorIdFilter] = useState<string | null>(null);
  const [includeInactive, setIncludeInactive] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const [page, setPage] = useState(1);
  const pageSize = 10;

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingRobot, setEditingRobot] = useState<RobotClientDto | null>(null);
  const [rotatingRobot, setRotatingRobot] = useState<RobotClientDto | null>(null);
  const [createdSecret, setCreatedSecret] = useState<{ clientId: string; secret: string } | null>(null);

  const isEditing = Boolean(editingRobot);

  const prestadoresQuery = useApiQuery({
    queryKey: ["prestadores"] as const,
    queryFn: listarPrestadores,
    enabled: isAdmin,
  });

  const prestadores = useMemo(() => prestadoresQuery.data ?? [], [prestadoresQuery.data]);

  const defaultPrestadorId = useMemo(() => {
    if (isAdmin) {
      return ALL_PRESTADORES_OPTION;
    }

    if (user?.prestadorId) {
      return user.prestadorId;
    }

    if (prestadores.length > 0) {
      return prestadores[0].id;
    }

    return null;
  }, [isAdmin, user?.prestadorId, prestadores]);

  useEffect(() => {
    if (prestadorIdFilter || !defaultPrestadorId) {
      return;
    }

    setPrestadorIdFilter(defaultPrestadorId);
  }, [prestadorIdFilter, defaultPrestadorId]);

  const robotQuery = useApiQuery({
    queryKey: buildRobotClientsQueryKey(prestadorIdFilter, includeInactive, user?.prestadorId ?? ""),
    enabled: Boolean(prestadorIdFilter),
    queryFn: async () => {
      const resolvedPrestadorId = resolvePrestadorIdValue(prestadorIdFilter);
      if (!resolvedPrestadorId && prestadorIdFilter !== ALL_PRESTADORES_OPTION) {
        return [] as RobotClientDto[];
      }

      if (prestadorIdFilter === ALL_PRESTADORES_OPTION) {
        const robots = await Promise.all(
          prestadores.map((prestador) => listarRobotClients(prestador.id, includeInactive))
        );

        return robots.flat().map((robot) => {
          const prestador = prestadores.find((item) => item.id === robot.prestadorId);
          return {
            ...robot,
            prestadorNome: prestador?.nomeFantasia ?? robot.prestadorNome,
            prestadorCnpj: prestador?.cnpj ?? robot.prestadorCnpj,
          };
        });
      }

      return listarRobotClients(resolvedPrestadorId, includeInactive);
    },
  });

  const robotForm = useForm<RobotFormValues>({
    resolver: zodResolver(robotSchema),
    defaultValues: {
      prestadorId: "",
      nome: "",
      clientId: undefined,
      clientSecret: undefined,
      scopes: [],
      ativo: true,
    },
  });

  const createMutation = useApiMutation(
    (payload: { prestadorId: string; dados: CreateRobotClientDto }) =>
      criarRobotClient(payload.prestadorId, payload.dados),
    {
      successMessage: "Cliente robótico criado.",
      onSuccess: (data) => {
        setIsFormOpen(false);
        setEditingRobot(null);
        robotForm.reset({
          prestadorId: prestadorIdFilter === ALL_PRESTADORES_OPTION ? "" : prestadorIdFilter ?? "",
          nome: "",
          clientId: undefined,
          clientSecret: undefined,
          scopes: [],
          ativo: true,
        });
        if (data?.secretGerado) {
          setCreatedSecret({ clientId: data.clientId, secret: data.secretGerado });
        }
        queryClient.invalidateQueries({
          queryKey: buildRobotClientsQueryKey(prestadorIdFilter, includeInactive, user?.prestadorId ?? ""),
        });
      },
    }
  );

  const updateMutation = useApiMutation(
    (payload: { prestadorId: string; robotId: string; dados: UpdateRobotClientDto }) =>
      atualizarRobotClient(payload.prestadorId, payload.robotId, payload.dados),
    {
      successMessage: "Cliente robótico atualizado.",
      onSuccess: () => {
        setIsFormOpen(false);
        setEditingRobot(null);
        robotForm.reset({
          prestadorId: prestadorIdFilter === ALL_PRESTADORES_OPTION ? "" : prestadorIdFilter ?? "",
          nome: "",
          clientId: undefined,
          clientSecret: undefined,
          scopes: [],
          ativo: true,
        });
        queryClient.invalidateQueries({
          queryKey: buildRobotClientsQueryKey(prestadorIdFilter, includeInactive, user?.prestadorId ?? ""),
        });
      },
    }
  );

  const deactivateMutation = useApiMutation(
    (payload: { prestadorId: string; robotId: string; ativo: boolean }) => {
      if (payload.ativo) {
        return reativarRobotClient(payload.prestadorId, payload.robotId);
      }
      return inativarRobotClient(payload.prestadorId, payload.robotId);
    },
    {
      successMessage: "Status atualizado.",
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: buildRobotClientsQueryKey(prestadorIdFilter, includeInactive, user?.prestadorId ?? ""),
        });
      },
    }
  );

  const rotateMutation = useApiMutation<
    RobotClientDto,
    unknown,
    { prestadorId: string; robotId: string; clientId: string; novoSecret: string }
  >(
    (payload) =>
      rotacionarSecretRobotClient(payload.prestadorId, payload.robotId, {
        novoSecret: payload.novoSecret,
      }),
    {
      successMessage: "Secret redefinido.",
      onSuccess: (data, variables) => {
        setRotatingRobot(null);
        setCreatedSecret({
          clientId: data?.clientId ?? variables.clientId,
          secret: variables.novoSecret,
        });
        queryClient.invalidateQueries({
          queryKey: buildRobotClientsQueryKey(prestadorIdFilter, includeInactive, user?.prestadorId ?? ""),
        });
      },
    }
  );

  const filteredRobots = useMemo(() => {
    const data = robotQuery.data ?? [];
    if (!searchTerm) return data;
    const normalized = searchTerm.toLowerCase();
    return data.filter((robot) =>
      [robot.nome, robot.clientId, robot.prestadorNome]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(normalized))
    );
  }, [robotQuery.data, searchTerm]);

  const totalItems = filteredRobots.length;
  const totalPages = Math.max(Math.ceil(totalItems / pageSize), 1);
  const currentPage = Math.min(page, totalPages);
  const paginatedRobots = filteredRobots.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const openCreateModal = () => {
    robotForm.reset({
      prestadorId: prestadorIdFilter === ALL_PRESTADORES_OPTION ? "" : prestadorIdFilter ?? "",
      nome: "",
      clientId: undefined,
      clientSecret: undefined,
      scopes: [],
      ativo: true,
    });
    setEditingRobot(null);
    setIsFormOpen(true);
  };

  const openEditModal = (robot: RobotClientDto) => {
    robotForm.reset({
      prestadorId: robot.prestadorId,
      nome: robot.nome,
      clientId: robot.clientId,
      clientSecret: undefined,
      scopes: robot.scopes,
      ativo: robot.ativo,
    });
    setEditingRobot(robot);
    setIsFormOpen(true);
  };

  const closeFormModal = () => {
    setIsFormOpen(false);
    setEditingRobot(null);
  };

  const onSubmitForm = robotForm.handleSubmit(async (values) => {
    if (!values.prestadorId) {
      robotForm.setError("prestadorId", { message: "Selecione um prestador" });
      return;
    }

    const nome = values.nome.trim();

    if (editingRobot) {
      const scopesChanged = !areScopesEqual(editingRobot.scopes, values.scopes);

      if (scopesChanged) {
        const confirmed = window.confirm(
          "Alterar os escopos irá gerar uma nova credencial (secret). Deseja continuar?"
        );
        if (!confirmed) {
          return;
        }
      }

      const currentRobot = editingRobot;

      await updateMutation.mutateAsync({
        prestadorId: values.prestadorId,
        robotId: currentRobot.id,
        dados: {
          nome,
          clientId: currentRobot.clientId,
          scopes: values.scopes,
          ativo: Boolean(values.ativo),
        },
      });

      if (scopesChanged) {
        const novoSecret = generateClientSecret();
        await rotateMutation.mutateAsync({
          prestadorId: currentRobot.prestadorId,
          robotId: currentRobot.id,
          clientId: currentRobot.clientId,
          novoSecret,
        });
      }
    } else {
      await createMutation.mutateAsync({
        prestadorId: values.prestadorId,
        dados: {
          nome,
          scopes: values.scopes,
          ativo: Boolean(values.ativo ?? true),
          gerarClientIdAutomatico: true,
          gerarSecretAutomatico: true,
        },
      });
      setPage(1);
    }
  });

  const toggleRobotStatus = async (robot: RobotClientDto) => {
    if (robot.ativo) {
      const confirmed = window.confirm(
        `Deseja realmente inativar o cliente robótico "${robot.nome}"?`
      );
      if (!confirmed) {
        return;
      }
    }

    await deactivateMutation.mutateAsync({
      prestadorId: robot.prestadorId,
      robotId: robot.id,
      ativo: !robot.ativo,
    });
  };

  const openRotateModal = (robot: RobotClientDto) => {
    setRotatingRobot(robot);
  };

  const closeRotateModal = () => {
    setRotatingRobot(null);
  };

  const handleRotate = async () => {
    if (!rotatingRobot) return;
    const novoSecret = generateClientSecret();
    await rotateMutation.mutateAsync({
      prestadorId: rotatingRobot.prestadorId,
      robotId: rotatingRobot.id,
      clientId: rotatingRobot.clientId,
      novoSecret,
    });
  };

  const prestadorOptions = useMemo(() => {
    const options = prestadores.map((prestador) => ({
      value: prestador.id,
      label: `${prestador.nomeFantasia} (${prestador.cnpj})`,
    }));

    if (isAdmin) {
      return [
        {
          value: ALL_PRESTADORES_OPTION,
          label: "Todos os Prestadores",
        },
        ...options,
      ];
    }

    return options;
  }, [prestadores, isAdmin]);

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Clientes Robóticos</h1>
          <p className="text-sm text-slate-500">
            Gerencie integrações automatizadas vinculadas aos prestadores autorizados.
          </p>
        </div>
        {isAdmin && (
          <Button onClick={openCreateModal} className="w-full sm:w-auto">
            <Plus className="mr-2 h-4 w-4" /> Novo cliente
          </Button>
        )}

      {createdSecret && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">Credenciais geradas</h2>
                <p className="text-sm text-slate-500">
                  O secret é exibido somente uma vez. Copie e guarde com segurança.
                </p>
              </div>
              <button
                type="button"
                className="text-slate-400 transition-colors hover:text-slate-600"
                onClick={() => setCreatedSecret(null)}
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-4 px-6 py-6">
              <div>
                <h3 className="text-sm font-semibold text-slate-700">Client ID</h3>
                <div className="mt-2 flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                  <span className="font-mono text-sm text-slate-800">{createdSecret.clientId}</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="text-slate-600 hover:bg-slate-200"
                    onClick={() => copySecret(createdSecret.clientId)}
                  >
                    <Copy className="mr-1 h-4 w-4" /> Copiar
                  </Button>
                </div>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-red-700">Client Secret</h3>
                <div className="mt-2 flex items-center justify-between rounded-xl border border-red-200 bg-red-50 px-4 py-3">
                  <span className="font-mono text-sm text-red-900 break-all">{createdSecret.secret}</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="text-red-600 hover:bg-red-100"
                    onClick={() => copySecret(createdSecret.secret)}
                  >
                    <Copy className="mr-1 h-4 w-4" /> Copiar
                  </Button>
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="ghost" onClick={() => setCreatedSecret(null)}>
                  Fechar
                </Button>
                <Button onClick={() => setCreatedSecret(null)}>Entendi</Button>
              </div>
            </div>
          </div>
        </div>
      )}
      </header>

      <Card className="p-6 space-y-4">
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-600" htmlFor="prestador">
              Prestador
            </label>
            <Select
              id="prestador"
              value={prestadorIdFilter ?? ""}
              onChange={(event) => {
                const { value } = event.target;
                setPrestadorIdFilter(value || null);
                setPage(1);
              }}
              disabled={!isAdmin && Boolean(user?.prestadorId)}
            >
              {isAdmin && (
                <option value="">Selecione</option>
              )}
              {prestadorOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-600" htmlFor="search">
              Buscar
            </label>
            <div className="flex items-center shadow-sm">
              <Input
                id="search"
                placeholder="Nome, Client ID, prestador"
                value={searchTerm}
                onChange={(event) => {
                  setSearchTerm(event.target.value);
                  setPage(1);
                }}
              />
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-600" htmlFor="inativos">
              Mostrar inativos
            </label>
            <Select
              id="inativos"
              value={includeInactive ? "true" : "false"}
              onChange={(event) => {
                const showInactive = event.target.value === "true";
                setIncludeInactive(showInactive);
                queryClient.invalidateQueries({
                  queryKey: buildRobotClientsQueryKey(prestadorIdFilter, showInactive, user?.prestadorId ?? ""),
                });
              }}
            >
              <option value="false">Somente ativos</option>
              <option value="true">Ativos e inativos</option>
            </Select>
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-slate-200">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Client ID</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-48 text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedRobots.map((robot) => (
                <TableRow key={robot.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Bot className="h-4 w-4 text-slate-400" />
                      <div className="flex flex-col">
                        <span className="font-medium text-slate-900">{robot.nome}</span>
                        <span className="text-xs text-slate-500">{robot.prestadorNome}</span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{robot.clientId}</TableCell>
                  <TableCell>{robot.ativo ? "Ativo" : "Inativo"}</TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openRotateModal(robot)}
                        title="Rotacionar secret"
                      >
                        <RefreshCcw className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleRobotStatus(robot)}
                        title={robot.ativo ? "Inativar" : "Reativar"}
                        className={robot.ativo ? "text-red-600 hover:bg-red-50" : "text-emerald-600 hover:bg-emerald-50"}
                      >
                        {robot.ativo ? <Power className="h-4 w-4" /> : <ShieldPlus className="h-4 w-4" />}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openEditModal(robot)}
                      >
                        <ArrowRightLeft className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {paginatedRobots.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-sm text-slate-500">
                    Nenhum cliente robótico encontrado.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        <Pagination page={currentPage} pageSize={pageSize} total={totalItems} onPageChange={setPage} />
      </Card>

      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">
                  {editingRobot ? "Editar cliente robótico" : "Novo cliente robótico"}
                </h2>
                <p className="text-sm text-slate-500">
                  Configure as credenciais utilizadas por automações (Robots).
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
            <form onSubmit={onSubmitForm} className="space-y-4 px-6 py-6">
              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-600" htmlFor="prestadorId">
                  Prestador
                </label>
                <Select
                  id="prestadorId"
                  {...robotForm.register("prestadorId")}
                  disabled={Boolean(editingRobot)}
                >
                  <option value="">Selecione</option>
                  {prestadorOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </Select>
                {robotForm.formState.errors.prestadorId && (
                  <span className="text-sm text-red-600">
                    {robotForm.formState.errors.prestadorId.message}
                  </span>
                )}
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-600" htmlFor="nome">
                  Nome
                </label>
                <Input id="nome" {...robotForm.register("nome")} />
                {robotForm.formState.errors.nome && (
                  <span className="text-sm text-red-600">
                    {robotForm.formState.errors.nome.message}
                  </span>
                )}
              </div>
              {isEditing ? (
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-slate-600" htmlFor="clientId">
                      Client ID
                    </label>
                    <Input
                      id="clientId"
                      {...robotForm.register("clientId")}
                      readOnly
                      className="bg-slate-100"
                    />
                    {robotForm.formState.errors.clientId && (
                      <span className="text-sm text-red-600">
                        {robotForm.formState.errors.clientId.message}
                      </span>
                    )}
                  </div>
                  <div className="space-y-1">
                    <span className="text-sm font-medium text-slate-600">Client Secret</span>
                    <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                      O secret atual não é exibido. Utilize o botão "Rotacionar secret" na listagem para gerar
                      uma nova credencial.
                    </div>
                  </div>
                </div>
              ) : (
                <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                  O Client ID e o Client Secret serão gerados automaticamente após o cadastro. Você poderá
                  consultá-los e rotacionar o secret pela listagem de clientes robóticos.
                </div>
              )}
              <div className="space-y-2">
                <span className="text-sm font-medium text-slate-600">Escopos permitidos</span>
                <div className="grid gap-2 md:grid-cols-2">
                  {scopeOptions.map((option) => (
                    <label key={option.value} className="flex items-start gap-2 rounded-lg border border-slate-200 p-3 text-sm text-slate-600">
                      <input
                        type="checkbox"
                        value={option.value}
                        className="mt-1 h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-500"
                        {...robotForm.register("scopes")}
                      />
                      <span>
                        <span className="font-medium text-slate-700">{option.label}</span>
                        <span className="block text-xs text-slate-500">{option.description}</span>
                        <span className="block text-[11px] text-slate-400">{option.value}</span>
                      </span>
                    </label>
                  ))}
                </div>
                {robotForm.formState.errors.scopes && (
                  <span className="text-sm text-red-600">
                    {robotForm.formState.errors.scopes.message}
                  </span>
                )}
              </div>
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-slate-600" htmlFor="ativo">
                  Status
                </label>
                <Select id="ativo" {...robotForm.register("ativo")}
                  defaultValue="true"
                  onChange={(event) => robotForm.setValue("ativo", event.target.value === "true")}
                >
                  <option value="true">Ativo</option>
                  <option value="false">Inativo</option>
                </Select>
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="ghost" onClick={closeFormModal}>
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                >
                  {editingRobot ? "Salvar alterações" : "Cadastrar"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {rotatingRobot && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-md rounded-2xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">Rotacionar secret</h2>
                <p className="text-sm text-slate-500">
                  Gere um novo secret aleatório para {rotatingRobot.nome}. O valor será enviado ao servidor e exibido
                  apenas uma vez após a rotação.
                </p>
              </div>
              <button
                type="button"
                className="text-slate-400 transition-colors hover:text-slate-600"
                onClick={closeRotateModal}
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-4 px-6 py-6">
              <p className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                Ao confirmar, geramos um novo secret seguro, enviamos para atualização e exibimos o valor apenas uma vez
                para que você possa copiá-lo.
              </p>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="ghost" onClick={closeRotateModal} disabled={rotateMutation.isPending}>
                  Cancelar
                </Button>
                <Button onClick={handleRotate} disabled={rotateMutation.isPending}>
                  {rotateMutation.isPending ? "Gerando..." : "Confirmar"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
