"use client";

import { useEffect, useMemo, useState } from "react";
import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import {
  RefreshCw,
  FileSignature,
  Send,
  Building2,
  User2,
  Receipt,
  CheckCircle2,
  XCircle,
  Loader2,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import StatisticsSummary from "@/components/nfse/statistics-summary";
import {
  assinarDps,
  cancelarNfse,
  createDps,
  deleteDps,
  downloadDanfse,
  emitirNfse,
  listCertificados,
  listDps,
  listNotas,
  type AssinarDpsPayload,
  type CreateDpsPayload,
  type DpsDto,
  type DpsStatus,
  type EmitirNfsePayload,
  type NotaDto,
} from "@/services/nfse";
import { listPrestadores, type PrestadorDto } from "@/services/prestadores";
import { listTomadores, type TomadorDto } from "@/services/tomadores";
import { listServicos, type ServicoDto } from "@/services/servicos";
import { dpsCreateSchema } from "@/lib/validators/dps";
import {
  CANCELAMENTO_MOTIVOS,
  type CancelamentoMotivoCodigo,
} from "@/lib/nfse/cancelamento-motivos";

interface CreateFormState {
  prestadorId: string;
  tomadorId: string;
  servicoId: string;
  competencia: string;
  dataEmissao: string;
  observacoes: string;
}

interface CertificatesResponseItem {
  id: string;
  nome?: string;
  apelido?: string;
  cnpj?: string;
  validadeFim?: string;
}

type ActionType = "sign" | "emit";

interface ActionState {
  type: ActionType;
  dps: DpsDto;
}

const STATUS_LABELS: Record<DpsStatus, string> = {
  RASCUNHO: "Rascunho",
  ASSINADO: "Assinado",
  ENVIADO: "Enviado",
  CANCELADO: "Cancelado",
};

const STATUS_BADGE_VARIANT: Record<DpsStatus, "default" | "secondary" | "outline" | "destructive"> = {
  RASCUNHO: "outline",
  ASSINADO: "secondary",
  ENVIADO: "default",
  CANCELADO: "destructive",
};

const STATUS_OPTIONS: { value: DpsStatus; icon: LucideIcon }[] = [
  { value: "RASCUNHO", icon: FileSignature },
  { value: "ASSINADO", icon: CheckCircle2 },
  { value: "ENVIADO", icon: Send },
  { value: "CANCELADO", icon: XCircle },
];

const AMBIENTE_OPTIONS = [
  { value: "1", label: "Produção" },
  { value: "2", label: "Homologação" },
];

const SELECT_LOADING_VALUE = "__loading__";
const SELECT_EMPTY_VALUE = "__empty__";
const CANCELAMENTO_JUSTIFICATIVA_MIN_LENGTH = 15;
const CANCELAMENTO_JUSTIFICATIVA_MAX_LENGTH = 255;
const DELETE_DPS_CONFIRMATION_KEY = "DELETE";

function normalizeOptionalText(value: string | null | undefined) {
  if (value === null || value === undefined) {
    return "";
  }

  return value;
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 2,
  }).format(value);
}

function formatDate(value: string) {
  return new Date(value).toLocaleString("pt-BR");
}

function resolveAmbienteLabel(ambiente: DpsDto["ambiente"]) {
  return ambiente === "PRODUCAO" ? "Produção" : "Homologação";
}

function resolveCertificateLabel(certificado?: CertificatesResponseItem | null) {
  if (!certificado) {
    return "Sem certificado";
  }

  if (certificado.apelido) {
    return certificado.apelido;
  }

  if (certificado.nome) {
    return certificado.nome;
  }

  return certificado.id;
}

export default function NfsePageContent() {
  const [selectedStatuses, setSelectedStatuses] = useState<DpsStatus[]>(["RASCUNHO", "ASSINADO"]);
  const [actionState, setActionState] = useState<ActionState | null>(null);
  const [selectedCertificateId, setSelectedCertificateId] = useState<string>("");
  const DEFAULT_SIGNATURE_TAG = "infDPS";
  const [selectedAmbiente, setSelectedAmbiente] = useState<string>("");
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [createForm, setCreateForm] = useState<CreateFormState>(() => ({
    prestadorId: "",
    tomadorId: "",
    servicoId: "",
    competencia: new Date().toISOString(),
    dataEmissao: new Date().toISOString(),
    observacoes: "",
  }));
  const [cancelState, setCancelState] = useState<{
    nota: NotaDto;
    motivoCodigo: CancelamentoMotivoCodigo | "";
    justificativa: string;
  } | null>(null);
  const [deleteState, setDeleteState] = useState<{ dps: DpsDto; confirmation: string }>({ dps: null as unknown as DpsDto, confirmation: "" });
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const queryClient = useQueryClient();

  const statusKey = useMemo(() => [...selectedStatuses].sort().join("-"), [selectedStatuses]);

  const certificadosQuery = useQuery<CertificatesResponseItem[]>({
    queryKey: ["nfse", "certificados"],
    queryFn: listCertificados,
    staleTime: 5 * 60 * 1000,
  });

  const deleteDpsMutation = useMutation({
    mutationFn: async (id: string) => deleteDps(id),
    onSuccess: () => {
      toast.success("DPS excluída com sucesso");
      queryClient.invalidateQueries({ queryKey: ["nfse", "dps"] });
      setShowDeleteDialog(false);
      setDeleteState({ dps: null as unknown as DpsDto, confirmation: "" });
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Erro ao excluir DPS");
    },
  });

  const prestadoresQuery = useQuery<PrestadorDto[]>({
    queryKey: ["nfse", "prestadores"],
    queryFn: async () => {
      const { data } = await listPrestadores({ perPage: 100, status: "ativos" });
      return data;
    },
    staleTime: 5 * 60 * 1000,
  });

  const tomadoresQuery = useQuery<TomadorDto[]>({
    queryKey: ["nfse", "tomadores"],
    queryFn: async () => {
      const { data } = await listTomadores({ perPage: 100, status: "ativos" });
      return data;
    },
    staleTime: 5 * 60 * 1000,
  });

  const servicosQuery = useQuery<ServicoDto[]>({
    queryKey: ["nfse", "servicos"],
    queryFn: async () => {
      const { data } = await listServicos({ perPage: 100, status: "ativos" });
      return data;
    },
    staleTime: 5 * 60 * 1000,
  });

  const dpsQuery = useQuery<DpsDto[]>({
    queryKey: ["nfse", "dps", statusKey],
    queryFn: () => listDps({ statuses: selectedStatuses }),
    gcTime: 0,
    refetchOnWindowFocus: false,
  });

  const notasQuery = useQuery<NotaDto[]>({
    queryKey: ["nfse", "notas"],
    queryFn: () => listNotas(100),
    gcTime: 0,
    refetchOnWindowFocus: false,
  });

  const assinarMutation = useMutation({
    mutationFn: (payload: AssinarDpsPayload) => assinarDps(payload),
    onSuccess: (_response, variables) => {
      toast.success("DPS assinada com sucesso");
      queryClient.invalidateQueries({ queryKey: ["nfse", "dps"] });
      queryClient.invalidateQueries({ queryKey: ["nfse", "dps", statusKey] });
      setActionState(null);
      setSelectedCertificateId(variables.certificateId ?? "");
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Erro ao assinar DPS");
    },
  });

  const emitirMutation = useMutation({
    mutationFn: (payload: EmitirNfsePayload) => emitirNfse(payload),
    onSuccess: (response) => {
      toast.success(`NFSe emitida. Chave: ${response.chaveAcesso}`);
      queryClient.invalidateQueries({ queryKey: ["nfse", "dps"] });
      queryClient.invalidateQueries({ queryKey: ["nfse", "dps", statusKey] });
      queryClient.invalidateQueries({ queryKey: ["nfse", "notas"] });
      setActionState(null);
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Erro ao emitir NFSe");
    },
  });

  const cancelarMutation = useMutation({
    mutationFn: cancelarNfse,
    onSuccess: () => {
      toast.success("NFSe cancelada com sucesso");
      queryClient.invalidateQueries({ queryKey: ["nfse", "notas"] });
      setCancelState(null);
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Erro ao cancelar NFSe");
    },
  });

  const createDpsMutation = useMutation({
    mutationFn: async (values: CreateDpsPayload) => {
      const parsed = dpsCreateSchema.parse(values);
      return createDps(parsed);
    },
    onSuccess: () => {
      toast.success("DPS criada com sucesso");
      setShowCreateDialog(false);
      resetCreateForm();
      queryClient.invalidateQueries({ queryKey: ["nfse", "dps"] });
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Erro ao criar DPS");
    },
  });

  const certificados = certificadosQuery.data ?? ([] as CertificatesResponseItem[]);
  const dpsData = dpsQuery.data ?? ([] as DpsDto[]);
  const notasData = notasQuery.data ?? ([] as NotaDto[]);

  const statistics = useMemo(() => {
    const now = new Date();
    const totalEmitidas = notasData.length;
    const notasMes = notasData.filter((nota) => {
      const created = new Date(nota.createdAt);
      return created.getMonth() === now.getMonth() && created.getFullYear() === now.getFullYear();
    }).length;
    const pendentes = dpsData.filter((dps) => dps.status === "RASCUNHO" || dps.status === "ASSINADO").length;
    const valorTotal = notasData.reduce((acc, nota) => acc + (nota.dps?.servico.valorUnitario ?? 0), 0);

    return {
      totalNotas: totalEmitidas,
      notasMes,
      dpsPendentes: pendentes,
      valorTotalMes: valorTotal,
    };
  }, [dpsData, notasData]);

  useEffect(() => {
    if (!actionState) {
      return;
    }

    const firstCertificate = certificados[0]?.id ?? "";
    setSelectedCertificateId(actionState.dps.certificadoId ?? firstCertificate);
    setSelectedAmbiente(actionState.dps.ambiente === "PRODUCAO" ? "1" : "2");
  }, [actionState, certificados]);

  const isActionLoading = actionState?.type === "sign" ? assinarMutation.isPending : emitirMutation.isPending;

  const selectedCertificate = certificados.find((item) => item.id === selectedCertificateId);

  useEffect(() => {
    if (certificadosQuery.error) {
      const error = certificadosQuery.error;
      toast.error(error instanceof Error ? error.message : "Falha ao carregar certificados");
    }
  }, [certificadosQuery.error]);

  useEffect(() => {
    if (dpsQuery.error) {
      const error = dpsQuery.error;
      toast.error(error instanceof Error ? error.message : "Falha ao carregar DPS");
    }
  }, [dpsQuery.error]);

  useEffect(() => {
    if (notasQuery.error) {
      const error = notasQuery.error;
      toast.error(error instanceof Error ? error.message : "Falha ao carregar NFSe");
    }
  }, [notasQuery.error]);

  const handleToggleStatus = (status: DpsStatus) => {
    setSelectedStatuses((previous) => {
      const alreadySelected = previous.includes(status);

      if (alreadySelected) {
        const filtered = previous.filter((item) => item !== status);
        return filtered.length === 0 ? previous : filtered;
      }

      return [...previous, status];
    });
  };

  const handleOpenAction = (type: ActionType, dps: DpsDto) => {
    setActionState({ type, dps });
  };

  const resetCreateForm = () => {
    setCreateForm({
      prestadorId: "",
      tomadorId: "",
      servicoId: "",
      competencia: new Date().toISOString(),
      dataEmissao: new Date().toISOString(),
      observacoes: "",
    });
  };

  const handleSubmitCreate = () => {
    createDpsMutation.mutate({
      prestadorId: createForm.prestadorId,
      tomadorId: createForm.tomadorId,
      servicoId: createForm.servicoId,
      competencia: createForm.competencia,
      dataEmissao: createForm.dataEmissao,
      observacoes: normalizeOptionalText(createForm.observacoes),
    });
  };

  const handleConfirmAction = async () => {
    if (!actionState) {
      return;
    }

    if (!selectedCertificateId) {
      try {
        await assinarMutation.mutateAsync({
          dpsId: actionState.dps.id,
          tag: DEFAULT_SIGNATURE_TAG,
        });
      } catch {
        // handled by mutation
      }
      return;
    }

    if (actionState.type === "sign") {
      await assinarMutation.mutateAsync({
        dpsId: actionState.dps.id,
        tag: DEFAULT_SIGNATURE_TAG,
      });
      return;
    }

    const ambienteNumber = selectedAmbiente ? Number(selectedAmbiente) : undefined;

    await emitirMutation.mutateAsync({
      dpsId: actionState.dps.id,
      ambiente: ambienteNumber,
    });
  };

  return (
    <div className="space-y-6">
      <section className="space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          {STATUS_OPTIONS.map((option) => {
            const isActive = selectedStatuses.includes(option.value);
            const Icon = option.icon;

            return (
              <Button
                key={option.value}
                type="button"
                variant={isActive ? "default" : "outline"}
                size="sm"
                onClick={() => handleToggleStatus(option.value)}
              >
                <Icon className="mr-2 h-4 w-4" />
                {STATUS_LABELS[option.value]}
              </Button>
            );
          })}

          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={dpsQuery.isFetching}
            onClick={() => dpsQuery.refetch()}
          >
            {dpsQuery.isFetching ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="mr-2 h-4 w-4" />
            )}
            Atualizar
          </Button>
        </div>

        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <StatisticsSummary
            totalNotas={statistics.totalNotas}
            notasMes={statistics.notasMes}
            dpsPendentes={statistics.dpsPendentes}
            valorTotalMes={statistics.valorTotalMes}
            className="flex-1"
          />
          <Button
            type="button"
            onClick={() => {
              setCreateForm((prev) => ({
                ...prev,
                competencia: new Date().toISOString(),
                dataEmissao: new Date().toISOString(),
              }));
              setShowCreateDialog(true);
            }}
          >
            Nova DPS
          </Button>
        </div>
      </section>

      <section className="rounded-lg border bg-card shadow-sm">
        <div className="border-b px-4 py-3">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Declarações pendentes</h2>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>DPS</TableHead>
                <TableHead>Prestador</TableHead>
                <TableHead>Tomador</TableHead>
                <TableHead>Serviço</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {dpsQuery.isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="py-10 text-center text-sm text-muted-foreground">
                    Carregando declarações...
                  </TableCell>
                </TableRow>
              ) : dpsData.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="py-10 text-center text-sm text-muted-foreground">
                    Nenhuma DPS encontrada para os filtros selecionados.
                  </TableCell>
                </TableRow>
              ) : (
                dpsData.map((dps) => (
                  <TableRow key={dps.id} className="align-top">
                    <TableCell>
                      <div className="font-medium">DPS nº {dps.numero}</div>
                      <div className="text-xs text-muted-foreground">Série {dps.serie} · Atualizado em {formatDate(dps.updatedAt)}</div>
                      <div className="text-xs text-muted-foreground">Ambiente: {resolveAmbienteLabel(dps.ambiente)}</div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 text-sm">
                        <Building2 className="h-4 w-4 text-muted-foreground" />
                        {dps.prestador.nomeFantasia}
                      </div>
                      <div className="text-xs text-muted-foreground">CNPJ {dps.prestador.cnpj}</div>
                      <div className="text-xs text-muted-foreground">
                        Certificado atual: {resolveCertificateLabel(certificados.find((item) => item.id === dps.certificadoId) ?? null)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 text-sm">
                        <User2 className="h-4 w-4 text-muted-foreground" />
                        {dps.tomador.nomeRazaoSocial}
                      </div>
                      <div className="text-xs text-muted-foreground">Documento {dps.tomador.documento}</div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 text-sm">
                        <Receipt className="h-4 w-4 text-muted-foreground" />
                        {dps.servico.descricao}
                      </div>
                      <div className="text-xs text-muted-foreground">Valor {formatCurrency(dps.servico.valorUnitario)}</div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={STATUS_BADGE_VARIANT[dps.status]}>{STATUS_LABELS[dps.status]}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          disabled={dps.status !== "RASCUNHO" || assinarMutation.isPending}
                          onClick={() => handleOpenAction("sign", dps)}
                        >
                          <FileSignature className="mr-2 h-4 w-4" />
                          Assinar
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="default"
                          disabled={dps.status !== "ASSINADO" || emitirMutation.isPending}
                          onClick={() => handleOpenAction("emit", dps)}
                        >
                          <Send className="mr-2 h-4 w-4" />
                          Emitir
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="destructive"
                          disabled={dps.status === "ENVIADO" || dps.status === "CANCELADO" || deleteDpsMutation.isPending}
                          onClick={() => {
                            setDeleteState({ dps, confirmation: "" });
                            setShowDeleteDialog(true);
                          }}
                        >
                          <XCircle className="mr-2 h-4 w-4" />
                          Excluir
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </section>

      <section className="rounded-lg border bg-card shadow-sm">
        <div className="border-b px-4 py-3 flex flex-col gap-1 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">NFSe emitidas recentemente</h2>
            <p className="text-xs text-muted-foreground">Acompanhe as últimas emissões e realize ações de cancelamento ou download.</p>
          </div>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            disabled={notasQuery.isFetching}
            onClick={() => notasQuery.refetch()}
          >
            {notasQuery.isFetching ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
            Atualizar
          </Button>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>NFSe</TableHead>
                <TableHead>Prestador</TableHead>
                <TableHead>Tomador</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {notasQuery.isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="py-10 text-center text-sm text-muted-foreground">
                    Carregando notas...
                  </TableCell>
                </TableRow>
              ) : notasData.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="py-10 text-center text-sm text-muted-foreground">
                    Nenhuma NFSe emitida ainda.
                  </TableCell>
                </TableRow>
              ) : (
                notasData.map((nota) => (
                  <TableRow key={nota.id} className="align-top">
                    <TableCell>
                      <div className="font-medium">NFSe nº {nota.numero}</div>
                      <div className="text-xs text-muted-foreground">Chave {nota.chaveAcesso}</div>
                      <div className="text-xs text-muted-foreground">Emitida em {formatDate(nota.createdAt)}</div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium text-sm">{nota.prestador.nomeFantasia}</div>
                      <div className="text-xs text-muted-foreground">CNPJ {nota.prestador.cnpj}</div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium text-sm">{nota.tomador.nomeRazaoSocial}</div>
                      <div className="text-xs text-muted-foreground">Documento {nota.tomador.documento}</div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm font-medium">
                        {nota.dps?.servico.valorUnitario ? formatCurrency(nota.dps.servico.valorUnitario) : "-"}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={nota.dps?.status === "CANCELADO" ? "destructive" : "default"}>
                        {nota.dps?.status === "CANCELADO" ? "Cancelada" : "Emitida"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex flex-wrap justify-end gap-2">
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            downloadDanfse(nota.chaveAcesso, {
                              ambiente: nota.ambiente === "PRODUCAO" ? 1 : 2,
                              certificateId: nota.certificateId ?? nota.dps?.certificadoId,
                            })
                          }
                        >
                          <Receipt className="mr-2 h-4 w-4" /> DANFSE
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="destructive"
                          disabled={cancelarMutation.isPending || nota.dps?.status === "CANCELADO"}
                          onClick={() => {
                            setCancelState({
                              nota,
                              motivoCodigo: CANCELAMENTO_MOTIVOS[0]?.codigo ?? "",
                              justificativa: "",
                            });
                          }}
                        >
                          <XCircle className="mr-2 h-4 w-4" /> Cancelar
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </section>

      <Dialog open={actionState !== null} onOpenChange={(open) => !open && setActionState(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{actionState?.type === "sign" ? "Assinar DPS" : "Emitir NFSe"}</DialogTitle>
            {/* <DialogDescription>
              {actionState?.type === "sign"
                ? "O certificado será resolvido automaticamente. Confirme para assinar a DPS."
                : "O certificado será resolvido automaticamente. Informe apenas o ambiente se necessário."}
            </DialogDescription> */}
          </DialogHeader>

          {actionState ? (
            <div className="space-y-4">
              <div className="rounded border bg-muted/30 p-3 text-sm">
                <p className="font-medium">DPS nº {actionState.dps.numero}</p>
                <p className="text-muted-foreground">
                  Prestador: {actionState.dps.prestador.nomeFantasia} · Tomador: {actionState.dps.tomador.nomeRazaoSocial}
                </p>
              </div>

              {actionState.type === "sign" ? null : (
                <div className="space-y-2">
                  <label className="text-sm font-medium" htmlFor="ambiente">
                    Ambiente de emissão
                  </label>
                  <Select value={selectedAmbiente} onValueChange={setSelectedAmbiente}>
                    <SelectTrigger id="ambiente">
                      <SelectValue placeholder="Selecione o ambiente" />
                    </SelectTrigger>
                    <SelectContent>
                      {AMBIENTE_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              <p className="text-xs text-muted-foreground">
                O certificado será obtido automaticamente pelo sistema Nota Nacional.
              </p>
            </div>
          ) : null}

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => setActionState(null)} disabled={isActionLoading}>
              Cancelar
            </Button>
            <Button type="button" onClick={handleConfirmAction} disabled={isActionLoading || certificadosQuery.isLoading}>
              {isActionLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Confirmar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={showDeleteDialog}
        onOpenChange={(open) => {
          setShowDeleteDialog(open);
          if (!open) {
            setDeleteState({ dps: null as unknown as DpsDto, confirmation: "" });
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir DPS</AlertDialogTitle>
            <AlertDialogDescription>
              Essa ação não pode ser desfeita. Digite <strong>{DELETE_DPS_CONFIRMATION_KEY}</strong> para confirmar a exclusão da
              DPS nº {deleteState.dps?.numero}.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-2 py-3">
            <Input
              value={deleteState.confirmation}
              onChange={(event) => setDeleteState((state) => ({ ...state, confirmation: event.target.value }))}
              placeholder={DELETE_DPS_CONFIRMATION_KEY}
            />
            <p className="text-xs text-muted-foreground">
              Somente DPS em rascunho ou assinadas podem ser excluídas.
            </p>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteDpsMutation.isPending}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              disabled={
                deleteDpsMutation.isPending ||
                !deleteState.dps ||
                deleteState.confirmation.trim().toUpperCase() !== DELETE_DPS_CONFIRMATION_KEY
              }
              onClick={() => deleteState.dps && deleteDpsMutation.mutate(deleteState.dps.id)}
            >
              {deleteDpsMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Confirmar exclusão
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog
        open={cancelState !== null}
        onOpenChange={(open) => {
          if (!open) {
            setCancelState(null);
          }
        }}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Cancelar NFSe</DialogTitle>
            <DialogDescription>
              Escolha o motivo, descreva a justificativa e confirme o cancelamento. O certificado A1 será aplicado
              automaticamente.
            </DialogDescription>
          </DialogHeader>

          {cancelState ? (
            <div className="space-y-4">
              <div className="rounded border bg-muted/30 p-3 text-sm">
                <p className="font-medium">NFSe nº {cancelState.nota.numero}</p>
                <p className="text-muted-foreground wrap-break-word">
                  Chave: {cancelState.nota.chaveAcesso}
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium" htmlFor="cancelMotivo">
                  Motivo do cancelamento
                </label>
                <Select
                  value={cancelState.motivoCodigo}
                  onValueChange={(value) =>
                    setCancelState((state) => (state ? { ...state, motivoCodigo: value as CancelamentoMotivoCodigo } : state))
                  }
                >
                  <SelectTrigger id="cancelMotivo">
                    <SelectValue placeholder="Selecione o motivo" />
                  </SelectTrigger>
                  <SelectContent>
                    {CANCELAMENTO_MOTIVOS.map((motivo) => (
                      <SelectItem key={motivo.codigo} value={motivo.codigo} description={motivo.descricao}>
                        {motivo.descricao}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium" htmlFor="cancelJustificativa">
                  Justificativa
                </label>
                <Textarea
                  id="cancelJustificativa"
                  maxLength={CANCELAMENTO_JUSTIFICATIVA_MAX_LENGTH}
                  value={cancelState.justificativa}
                  onChange={(event) =>
                    setCancelState((state) => (state ? { ...state, justificativa: event.target.value } : state))
                  }
                  rows={4}
                  placeholder="Descreva o motivo do cancelamento"
                />
                <p className="text-xs text-muted-foreground">
                  A justificativa (15 a 255 caracteres) será enviada para a SEFIN junto com o pedido de cancelamento.
                </p>
              </div>
            </div>
          ) : null}

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => setCancelState(null)} disabled={cancelarMutation.isPending}>
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={() =>
                cancelState &&
                cancelarMutation.mutate({
                  chaveAcesso: cancelState.nota.chaveAcesso,
                  motivoCodigo: cancelState.motivoCodigo as CancelamentoMotivoCodigo,
                  justificativa: cancelState.justificativa.trim(),
                })
              }
              disabled={
                cancelarMutation.isPending ||
                !cancelState?.motivoCodigo ||
                cancelState.justificativa.trim().length < CANCELAMENTO_JUSTIFICATIVA_MIN_LENGTH ||
                cancelState.justificativa.trim().length > CANCELAMENTO_JUSTIFICATIVA_MAX_LENGTH
              }
            >
              {cancelarMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Confirmar cancelamento
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={showCreateDialog}
        onOpenChange={(open) => {
          setShowCreateDialog(open);
          if (!open) {
            resetCreateForm();
          }
        }}
      >
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Nova DPS</DialogTitle>
            <DialogDescription>Informe os dados necessários para gerar uma nova declaração.</DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="prestadorId">Prestador</Label>
              <Select
                value={createForm.prestadorId}
                onValueChange={(value) => setCreateForm((prev) => ({ ...prev, prestadorId: value }))}
                disabled={prestadoresQuery.isLoading || createDpsMutation.isPending}
              >
                <SelectTrigger id="prestadorId">
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {prestadoresQuery.isLoading ? (
                    <SelectItem value={SELECT_LOADING_VALUE} disabled>
                      Carregando...
                    </SelectItem>
                  ) : (prestadoresQuery.data ?? []).length > 0 ? (
                    prestadoresQuery.data?.map((prestador) => (
                      <SelectItem key={prestador.id} value={prestador.id}>
                        {prestador.nomeFantasia} · {prestador.cnpj}
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value={SELECT_EMPTY_VALUE} disabled>
                      Nenhum prestador disponível
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="tomadorId">Tomador</Label>
              <Select
                value={createForm.tomadorId}
                onValueChange={(value) => setCreateForm((prev) => ({ ...prev, tomadorId: value }))}
                disabled={tomadoresQuery.isLoading || createDpsMutation.isPending}
              >
                <SelectTrigger id="tomadorId">
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {tomadoresQuery.isLoading ? (
                    <SelectItem value={SELECT_LOADING_VALUE} disabled>
                      Carregando...
                    </SelectItem>
                  ) : (tomadoresQuery.data ?? []).length > 0 ? (
                    tomadoresQuery.data?.map((tomador) => (
                      <SelectItem key={tomador.id} value={tomador.id}>
                        {tomador.nomeRazaoSocial} · {tomador.documento}
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value={SELECT_EMPTY_VALUE} disabled>
                      Nenhum tomador disponível
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="servicoId">Serviço</Label>
              <Select
                value={createForm.servicoId}
                onValueChange={(value) => setCreateForm((prev) => ({ ...prev, servicoId: value }))}
                disabled={servicosQuery.isLoading || createDpsMutation.isPending}
              >
                <SelectTrigger id="servicoId">
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {servicosQuery.isLoading ? (
                    <SelectItem value={SELECT_LOADING_VALUE} disabled>
                      Carregando...
                    </SelectItem>
                  ) : (servicosQuery.data ?? []).length > 0 ? (
                    servicosQuery.data?.map((servico) => (
                      <SelectItem key={servico.id} value={servico.id}>
                        {servico.descricao}
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value={SELECT_EMPTY_VALUE} disabled>
                      Nenhum serviço disponível
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="competencia">Competência</Label>
              <Input
                id="competencia"
                type="datetime-local"
                value={createForm.competencia.slice(0, 16)}
                onChange={(event) =>
                  setCreateForm((prev) => ({ ...prev, competencia: new Date(event.target.value).toISOString() }))
                }
                disabled={createDpsMutation.isPending}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="dataEmissao">Data de emissão</Label>
              <Input
                id="dataEmissao"
                type="datetime-local"
                value={createForm.dataEmissao.slice(0, 16)}
                onChange={(event) =>
                  setCreateForm((prev) => ({ ...prev, dataEmissao: new Date(event.target.value).toISOString() }))
                }
                disabled={createDpsMutation.isPending}
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="observacoes">Observações</Label>
              <Textarea
                id="observacoes"
                value={createForm.observacoes}
                onChange={(event) => setCreateForm((prev) => ({ ...prev, observacoes: event.target.value }))}
                rows={3}
                disabled={createDpsMutation.isPending}
              />
            </div>

            <div className="space-y-2">&nbsp;</div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              onClick={() => setShowCreateDialog(false)}
              disabled={createDpsMutation.isPending}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={handleSubmitCreate}
              disabled={
                createDpsMutation.isPending ||
                !createForm.prestadorId ||
                !createForm.tomadorId ||
                !createForm.servicoId
              }
            >
              {createDpsMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Criar DPS
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
