"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
  ScrollText,
  CheckCircle2,
  XCircle,
  Loader2,
  Filter,
  Search,
  ChevronDown,
  ExternalLink,
  Trash2,
  UploadCloud,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { toast } from "sonner";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

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
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
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
  validateXmlXsd,
  type AssinarDpsPayload,
  type CreateDpsPayload,
  type DpsDto,
  type DpsStatus,
  type EmitirNfsePayload,
  type Ambiente,
  type NotaDto,
  type PaginatedResponse,
  type PaginationMeta,
} from "@/services/nfse";
import {
  listPrestadores,
  type PrestadorDto,
  RobotCredentialsMissingClientError,
} from "@/services/prestadores";
import { listTomadores, type TomadorDto } from "@/services/tomadores";
import { listServicos, type ServicoDto } from "@/services/servicos";
import { getConfiguracao } from "@/components/configuracoes/configuracoes-service";
import type { ConfiguracaoDto } from "@/lib/validators/configuracao";
import { dpsCreateSchema } from "@/lib/validators/dps";
import {
  CANCELAMENTO_MOTIVOS,
  type CancelamentoMotivoCodigo,
} from "@/lib/nfse/cancelamento-motivos";
import { cn } from "@/lib/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { useCurrentUser } from "@/hooks/use-auth";

interface CreateFormState {
  tomadorId: string;
  servicoId: string;
  competencia: string;
  dataEmissao: string;
  observacoes: string;
}

function extractErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  if (typeof error === "string" && error.trim()) {
    return error.trim();
  }

  if (error && typeof error === "object" && "message" in error) {
    const message = (error as { message?: unknown }).message;

    if (typeof message === "string" && message.trim()) {
      return message.trim();
    }
  }

  try {
    return JSON.stringify(error);
  } catch {
    return fallback;
  }
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

interface FilterState {
  statuses: DpsStatus[];
  ambiente?: Ambiente;
  search: string;
  prestadorIds: string[];
  tomadorIds: string[];
  servicoIds: string[];
  startDate?: string;
  endDate?: string;
  minValue?: number;
  maxValue?: number;
  page: number;
  perPage: number;
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
];

const AMBIENTE_OPTIONS = [
  { value: "1", label: "Produção" },
  { value: "2", label: "Homologação" },
];

const SELECT_LOADING_VALUE = "__loading__";
const SELECT_EMPTY_VALUE = "__empty__";
const MAX_MULTI_OPTIONS = 8;
const CANCELAMENTO_JUSTIFICATIVA_MIN_LENGTH = 15;
const CANCELAMENTO_JUSTIFICATIVA_MAX_LENGTH = 255;
const DELETE_DPS_CONFIRMATION_KEY = "DELETE";
const DEFAULT_PER_PAGE = 25;
const FILTERABLE_STATUSES: DpsStatus[] = ["RASCUNHO", "ASSINADO", "ENVIADO", "CANCELADO"];

const DEFAULT_FILTERS: FilterState = {
  statuses: ["RASCUNHO", "ASSINADO"],
  ambiente: undefined,
  search: "",
  prestadorIds: [],
  tomadorIds: [],
  servicoIds: [],
  startDate: undefined,
  endDate: undefined,
  minValue: undefined,
  maxValue: undefined,
  page: 1,
  perPage: DEFAULT_PER_PAGE,
};

const DEFAULT_PAGINATION: PaginationMeta = {
  page: 1,
  perPage: DEFAULT_PER_PAGE,
  totalItems: 0,
  totalPages: 1,
};

type FilterArrayKey = "prestadorIds" | "tomadorIds" | "servicoIds";

const PER_PAGE_OPTIONS = [10, 25, 50, 100] as const;

function getDefaultFilters(): FilterState {
  return {
    statuses: ["RASCUNHO", "ASSINADO"],
    ambiente: undefined,
    search: "",
    prestadorIds: [],
    tomadorIds: [],
    servicoIds: [],
    startDate: undefined,
    endDate: undefined,
    minValue: undefined,
    maxValue: undefined,
    page: 1,
    perPage: DEFAULT_PER_PAGE,
  };
}

const FILTER_AMBIENTE_OPTIONS: { value: Ambiente; label: string }[] = [
  { value: "PRODUCAO", label: "Produção" },
  { value: "HOMOLOGACAO", label: "Homologação" },
];

// Helpers
function normalizeStatuses(statuses: DpsStatus[]): DpsStatus[] {
  const allowed = new Set<DpsStatus>(FILTERABLE_STATUSES);
  return Array.from(new Set(statuses))
    .filter((status): status is DpsStatus => allowed.has(status))
    .sort();
}

function normalizeIds(values: string[]): string[] {
  return Array.from(
    new Set(
      values
        .map((value) => value.trim())
        .filter((value) => value.length > 0),
    ),
  ).sort((a, b) => a.localeCompare(b));
}

function parseOptionalNumber(value: string | null): number | undefined {
  if (!value) {
    return undefined;
  }

  const parsed = Number(value);

  return Number.isFinite(parsed) ? parsed : undefined;
}

function toDateInputValue(value?: string): string {
  if (!value) {
    return "";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toISOString().slice(0, 10);
}

function parseDateInputValue(value: string): string | undefined {
  if (!value) {
    return undefined;
  }

  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) {
    return undefined;
  }

  return date.toISOString();
}

function sanitizeFilters(input: FilterState): FilterState {
  const allowedAmbientes: ReadonlyArray<Ambiente> = ["PRODUCAO", "HOMOLOGACAO"];
  const normalizedStatuses = normalizeStatuses(input.statuses);
  const normalizedPrestadores = normalizeIds(input.prestadorIds);
  const normalizedTomadores = normalizeIds(input.tomadorIds);
  const normalizedServicos = normalizeIds(input.servicoIds);

  let minValue = typeof input.minValue === "number" && Number.isFinite(input.minValue) ? input.minValue : undefined;
  let maxValue = typeof input.maxValue === "number" && Number.isFinite(input.maxValue) ? input.maxValue : undefined;

  if (minValue !== undefined && maxValue !== undefined && minValue > maxValue) {
    [minValue, maxValue] = [maxValue, minValue];
  }

  const sanitizedPage = Number.isFinite(input.page) && input.page > 0 ? Math.min(9999, Math.floor(input.page)) : 1;
  const sanitizedPerPage = Number.isFinite(input.perPage) && input.perPage > 0 ? Math.min(200, Math.floor(input.perPage)) : DEFAULT_PER_PAGE;

  const sanitized: FilterState = {
    statuses: normalizedStatuses.length > 0 ? normalizedStatuses : [...DEFAULT_FILTERS.statuses],
    ambiente: allowedAmbientes.includes(input.ambiente as Ambiente) ? input.ambiente : undefined,
    search: input.search.trim(),
    prestadorIds: normalizedPrestadores,
    tomadorIds: normalizedTomadores,
    servicoIds: normalizedServicos,
    startDate: input.startDate || undefined,
    endDate: input.endDate || undefined,
    minValue,
    maxValue,
    page: sanitizedPage,
    perPage: sanitizedPerPage,
  };

  return sanitized;
}

function serializeFilters(filters: FilterState): URLSearchParams {
  const params = new URLSearchParams();

  if (filters.statuses.length > 0) {
    params.set("status", filters.statuses.join(","));
  }

  if (filters.search) {
    params.set("search", filters.search);
  }

  if (filters.ambiente) {
    params.set("ambiente", filters.ambiente);
  }

  if (filters.startDate) {
    params.set("startDate", filters.startDate);
  }

  if (filters.endDate) {
    params.set("endDate", filters.endDate);
  }

  if (filters.minValue !== undefined) {
    params.set("minValue", String(filters.minValue));
  }

  if (filters.maxValue !== undefined) {
    params.set("maxValue", String(filters.maxValue));
  }

  filters.prestadorIds.forEach((id) => {
    params.append("prestadorId", id);
  });

  filters.tomadorIds.forEach((id) => {
    params.append("tomadorId", id);
  });

  filters.servicoIds.forEach((id) => {
    params.append("servicoId", id);
  });

  if (filters.page > 1) {
    params.set("page", String(filters.page));
  }

  if (filters.perPage !== DEFAULT_PER_PAGE) {
    params.set("perPage", String(filters.perPage));
  }

  return params;
}

function arrayEquals<T>(a: readonly T[], b: readonly T[]): boolean {
  if (a.length !== b.length) {
    return false;
  }

  return a.every((value, index) => value === b[index]);
}

function areFiltersEqual(a: FilterState, b: FilterState): boolean {
  return (
    arrayEquals(a.statuses, b.statuses) &&
    a.ambiente === b.ambiente &&
    a.search === b.search &&
    arrayEquals(a.prestadorIds, b.prestadorIds) &&
    arrayEquals(a.tomadorIds, b.tomadorIds) &&
    arrayEquals(a.servicoIds, b.servicoIds) &&
    a.startDate === b.startDate &&
    a.endDate === b.endDate &&
    a.minValue === b.minValue &&
    a.maxValue === b.maxValue &&
    a.page === b.page &&
    a.perPage === b.perPage
  );
}

function parseFiltersFromSearchParams(searchParams: URLSearchParams | ReturnType<typeof useSearchParams>): FilterState {
  const params = new URLSearchParams(searchParams.toString());

  const statusesParam = params.get("status");
  const parsedStatuses = statusesParam
    ? normalizeStatuses(
        statusesParam
          .split(",")
          .map((value) => value.trim().toUpperCase())
          .filter((value): value is DpsStatus => FILTERABLE_STATUSES.includes(value as DpsStatus)),
      )
    : [...DEFAULT_FILTERS.statuses];

  const ambienteParam = params.get("ambiente");
  const ambiente = ambienteParam === "PRODUCAO" || ambienteParam === "HOMOLOGACAO" ? (ambienteParam as Ambiente) : undefined;

  const base: FilterState = {
    statuses: parsedStatuses.length > 0 ? parsedStatuses : [...DEFAULT_FILTERS.statuses],
    ambiente,
    search: params.get("search")?.trim() ?? "",
    prestadorIds: normalizeIds(params.getAll("prestadorId")),
    tomadorIds: normalizeIds(params.getAll("tomadorId")),
    servicoIds: normalizeIds(params.getAll("servicoId")),
    startDate: params.get("startDate") || undefined,
    endDate: params.get("endDate") || undefined,
    minValue: parseOptionalNumber(params.get("minValue")),
    maxValue: parseOptionalNumber(params.get("maxValue")),
    page: parseOptionalNumber(params.get("page")) ?? DEFAULT_FILTERS.page,
    perPage: parseOptionalNumber(params.get("perPage")) ?? DEFAULT_FILTERS.perPage,
  };

  return sanitizeFilters(base);
}

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
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const initialFilters = useMemo(() => parseFiltersFromSearchParams(searchParams), [searchParams]);
  const [filters, setFilters] = useState<FilterState>(initialFilters);
  const [prestadorSearch, setPrestadorSearch] = useState("");
  const [tomadorSearch, setTomadorSearch] = useState("");
  const [servicoSearch, setServicoSearch] = useState("");
  const [activeTab, setActiveTab] = useState<"dps" | "notas">("dps");
  const lastSyncedFilters = useRef<FilterState>(initialFilters);
  const filtersKey = useMemo(() => serializeFilters(filters).toString(), [filters]);
  
  // Chave específica para notas (sem status, pois não filtramos por status da DPS)
  const notasFiltersKey = useMemo(() => {
    const notasFilters: FilterState = {
      ...filters,
      statuses: [], // Remover status sem deletar a propriedade
    };
    return serializeFilters(notasFilters).toString();
  }, [filters]);
  
  const isDpsTab = activeTab === "dps";

  useEffect(() => {
    const parsed = parseFiltersFromSearchParams(searchParams);

    setFilters((previous) => {
      if (areFiltersEqual(previous, parsed)) {
        return previous;
      }

      return parsed;
    });
  }, [searchParams]);

  const syncFiltersToUrl = useCallback(
    (nextFilters: FilterState) => {
      if (areFiltersEqual(lastSyncedFilters.current, nextFilters)) {
        return;
      }

      lastSyncedFilters.current = nextFilters;

      const params = serializeFilters(nextFilters);
      const queryString = params.toString();
      const url = queryString ? `${pathname}?${queryString}` : pathname;

      router.replace(url);
    },
    [pathname, router],
  );

  const handleFiltersChange = useCallback(
    (updater: (previous: FilterState) => FilterState) => {
      setFilters((previous) => {
        const next = sanitizeFilters(updater(previous));
        syncFiltersToUrl(next);
        return next;
      });
    },
    [syncFiltersToUrl],
  );

  useEffect(() => {
    syncFiltersToUrl(filters);
  }, [filters, syncFiltersToUrl]);

  const [actionState, setActionState] = useState<ActionState | null>(null);
  const [selectedCertificateId, setSelectedCertificateId] = useState<string>("");
  const DEFAULT_SIGNATURE_TAG = "infDPS";
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [createForm, setCreateForm] = useState<CreateFormState>(() => ({
    tomadorId: "",
    servicoId: "",
    competencia: new Date().toISOString(),
    dataEmissao: new Date().toISOString(),
    observacoes: "",
  }));

  const currentUserQuery = useCurrentUser();
  const [cancelState, setCancelState] = useState<{
    nota: NotaDto;
    motivoCodigo: CancelamentoMotivoCodigo | "";
    justificativa: string;
  } | null>(null);
  const [deleteState, setDeleteState] = useState<{ dps: DpsDto; confirmation: string }>({ dps: null as unknown as DpsDto, confirmation: "" });
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const queryClient = useQueryClient();

  const certificadosQuery = useQuery<CertificatesResponseItem[]>({
    queryKey: ["nfse", "certificados"],
    queryFn: listCertificados,
    staleTime: 5 * 60 * 1000,
  });

  const configuracoesQuery = useQuery<ConfiguracaoDto>({
    queryKey: ["configuracoes"],
    queryFn: getConfiguracao,
    staleTime: 5 * 60 * 1000,
  });

  // Definir ambiente padrão quando as configurações forem carregadas
  useEffect(() => {
    if (configuracoesQuery.data && !filters.ambiente) {
      const ambientePadrao = configuracoesQuery.data.ambientePadrao;
      setFilters((previous) => ({
        ...previous,
        ambiente: ambientePadrao,
      }));
    }
  }, [configuracoesQuery.data, filters.ambiente]);

  const deleteDpsMutation = useMutation({
    mutationFn: async (id: string) => deleteDps(id),
    onSuccess: () => {
      toast.success("DPS excluída com sucesso");
      queryClient.invalidateQueries({ queryKey: ["nfse", "dps"] });
      setShowDeleteDialog(false);
      setDeleteState({ dps: null as unknown as DpsDto, confirmation: "" });
    },
    onError: (error) => {
      if (handleRobotCredentialsError(error)) {
        return;
      }
      toast.error(error instanceof Error ? error.message : "Erro ao excluir DPS");
    },
  });

  const handleRobotCredentialsError = useCallback(
    (error: unknown, fallbackMessage: string = "Credenciais do robô ausentes. Configure o acesso robótico.") => {
      if (error instanceof RobotCredentialsMissingClientError) {
        toast.error(error.message);
        router.push(error.redirectTo);
        return true;
      }

      if (error instanceof Error && error.message.includes("Credenciais do robô")) {
        toast.error(error.message || fallbackMessage);
        router.push("/configuracoes");
        return true;
      }

      return false;
    },
    [router]
  );

  const prestadoresQuery = useQuery<PrestadorDto[]>({
    queryKey: ["nfse", "prestadores"],
    queryFn: async () => {
      try {
        const { data } = await listPrestadores({ perPage: 100, status: "ativos" });
        return data;
      } catch (error) {
        if (!handleRobotCredentialsError(error)) {
          toast.error(extractErrorMessage(error, "Erro ao carregar prestadores"));
        }
        throw error;
      }
    },
    staleTime: 5 * 60 * 1000,
  });

  const tomadoresQuery = useQuery<TomadorDto[]>({
    queryKey: ["nfse", "tomadores"],
    queryFn: async () => {
      try {
        const { data } = await listTomadores({ perPage: 100, status: "ativos" });
        return data;
      } catch (error) {
        if (!handleRobotCredentialsError(error)) {
          toast.error(extractErrorMessage(error, "Erro ao carregar tomadores"));
        }
        throw error;
      }
    },
    staleTime: 5 * 60 * 1000,
  });

  const servicosQuery = useQuery<ServicoDto[]>({
    queryKey: ["nfse", "servicos"],
    queryFn: async () => {
      try {
        const { data } = await listServicos({ perPage: 100, status: "ativos" });
        return data;
      } catch (error) {
        if (!handleRobotCredentialsError(error)) {
          toast.error(extractErrorMessage(error, "Erro ao carregar serviços"));
        }
        throw error;
      }
    },
    staleTime: 5 * 60 * 1000,
  });

  const dpsQuery = useQuery<PaginatedResponse<DpsDto>>({
    queryKey: ["nfse", "dps", filtersKey],
    queryFn: async () => {
      try {
        return await listDps({
          statuses: filters.statuses.filter((status) => status !== "ENVIADO" && status !== "CANCELADO"),
          ambiente: filters.ambiente,
          search: filters.search,
          prestadorIds: filters.prestadorIds,
          tomadorIds: filters.tomadorIds,
          servicoIds: filters.servicoIds,
          startDate: filters.startDate,
          endDate: filters.endDate,
          minValue: filters.minValue,
          maxValue: filters.maxValue,
          page: filters.page,
          perPage: filters.perPage,
        });
      } catch (error) {
        if (!handleRobotCredentialsError(error)) {
          toast.error(extractErrorMessage(error, "Erro ao carregar DPS"));
        }
        throw error;
      }
    },
    gcTime: 0,
    refetchOnWindowFocus: false,
  });

  const notasQuery = useQuery<PaginatedResponse<NotaDto>>({
    queryKey: ["nfse", "notas", notasFiltersKey],
    queryFn: async () => {
      try {
        // Para notas, NÃO enviar filtro de status
        // A API filtra pelo status da DPS associada, o que impede que todas as notas sejam exibidas
        // Uma nota fiscal sempre representa um documento emitido, independente do status da DPS
        return await listNotas({
          ambiente: filters.ambiente,
          search: filters.search,
          prestadorIds: filters.prestadorIds,
          tomadorIds: filters.tomadorIds,
          startDate: filters.startDate,
          endDate: filters.endDate,
          minValue: filters.minValue,
          maxValue: filters.maxValue,
          page: filters.page,
          perPage: filters.perPage,
        });
      } catch (error) {
        if (!handleRobotCredentialsError(error)) {
          toast.error(extractErrorMessage(error, "Erro ao carregar NFSe"));
        }
        throw error;
      }
    },
    gcTime: 0,
    refetchOnWindowFocus: false,
  });

  const assinarMutation = useMutation({
    mutationFn: (payload: AssinarDpsPayload) => assinarDps(payload),
    onMutate: (variables) => {
      console.debug("[NFSe/UI] Assinar DPS - onMutate", { variables });
    },
    onSuccess: (_response, variables) => {
      console.debug("[NFSe/UI] Assinar DPS - onSuccess", { variables });
      toast.success("DPS assinada com sucesso");
      queryClient.invalidateQueries({ queryKey: ["nfse", "dps"] });
      setActionState(null);
      setSelectedCertificateId(variables.certificateId ?? "");
    },
    onError: (error) => {
      console.warn("[NFSe/UI] Assinar DPS - onError", error);
      if (handleRobotCredentialsError(error)) {
        return;
      }
      toast.error(extractErrorMessage(error, "Erro ao assinar DPS"));
    },
    onSettled: (_data, _error, variables) => {
      console.debug("[NFSe/UI] Assinar DPS - onSettled", { variables });
    },
  });

  const emitirMutation = useMutation({
    mutationFn: (payload: EmitirNfsePayload) => emitirNfse(payload),
    onMutate: (variables) => {
      console.debug("[NFSe/UI] Emitir NFSe - onMutate", { variables });
    },
    onSuccess: (response) => {
      console.debug("[NFSe/UI] Emitir NFSe - onSuccess", { response });
      toast.success(`NFSe emitida. Chave: ${response.chaveAcesso}`);
      queryClient.invalidateQueries({ queryKey: ["nfse", "dps"] });
      queryClient.invalidateQueries({ queryKey: ["nfse", "notas"] });
      setActionState(null);
    },
    onError: (error) => {
      console.warn("[NFSe/UI] Emitir NFSe - onError", error);
      if (handleRobotCredentialsError(error)) {
        return;
      }
      toast.error(extractErrorMessage(error, "Erro ao emitir NFSe"));
    },
    onSettled: (_data, _error, variables) => {
      console.debug("[NFSe/UI] Emitir NFSe - onSettled", { variables });
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
      if (handleRobotCredentialsError(error)) {
        return;
      }
      toast.error(extractErrorMessage(error, "Erro ao cancelar NFSe"));
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
      if (handleRobotCredentialsError(error)) {
        return;
      }
      toast.error(extractErrorMessage(error, "Erro ao criar DPS"));
    },
  });

  const certificados = certificadosQuery.data ?? ([] as CertificatesResponseItem[]);
  const dpsData = dpsQuery.data?.data ?? ([] as DpsDto[]);
  const dpsMeta = dpsQuery.data?.meta ?? DEFAULT_PAGINATION;
  const notasData = notasQuery.data?.data ?? ([] as NotaDto[]);
  const notasMeta = notasQuery.data?.meta ?? DEFAULT_PAGINATION;

  const dpsPagination = useMemo(() => {
    const perPage = dpsMeta.perPage ?? filters.perPage ?? DEFAULT_PER_PAGE;
    const totalItems = dpsMeta.totalItems ?? dpsData.length;
    const totalPages = Math.max(1, dpsMeta.totalPages ?? (Math.ceil(totalItems / perPage) || 1));
    return {
      page: dpsMeta.page ?? filters.page,
      perPage,
      totalItems,
      totalPages,
    };
  }, [dpsData.length, dpsMeta, filters.page, filters.perPage]);

  const notasPagination = useMemo(() => {
    const perPage = notasMeta.perPage ?? filters.perPage ?? DEFAULT_PER_PAGE;
    const totalItems = notasMeta.totalItems ?? notasData.length;
    const totalPages = Math.max(1, notasMeta.totalPages ?? (Math.ceil(totalItems / perPage) || 1));
    return {
      page: notasMeta.page ?? filters.page,
      perPage,
      totalItems,
      totalPages,
    };
  }, [filters.page, filters.perPage, notasData.length, notasMeta]);

  useEffect(() => {
    if (!actionState) {
      return;
    }

    const firstCertificate = certificados[0]?.id ?? "";
    setSelectedCertificateId(actionState.dps.certificadoId ?? firstCertificate);
  }, [actionState, certificados]);

  const isActionLoading = actionState?.type === "sign" ? assinarMutation.isPending : emitirMutation.isPending;

  const selectedCertificate = certificados.find((item) => item.id === selectedCertificateId);

  const handlePreviewSignedXml = (dpsId: string) => {
    const previewUrl = `/api/nfse/dps/${dpsId}/xml`;
    window.open(previewUrl, "_blank", "noopener,noreferrer");
  };

  const [xsdDialog, setXsdDialog] = useState<{ open: boolean; title: string; report: string }>({ open: false, title: "", report: "" });

  const handleValidateXsd = useCallback(async (dps: DpsDto) => {
    try {
      const result = await validateXmlXsd({ dpsId: dps.id });

      if (result.valid && result.warnings.length === 0) {
        toast.success("XML válido segundo XSD");
        return;
      }

      const title = result.valid ? "XML válido com avisos" : "XML inválido";
      const lines: string[] = [];
      lines.push(`Engine: ${result.engine}`);
      if (result.errors.length > 0) {
        lines.push("\nErros:");
        result.errors.forEach((e, i) => {
          lines.push(`  ${i + 1}. ${e.field ? `[${e.field}] ` : ""}${e.message}${e.value ? ` (valor: ${e.value})` : ""}`);
        });
      }
      if (result.warnings.length > 0) {
        lines.push("\nAvisos:");
        result.warnings.forEach((w, i) => lines.push(`  ${i + 1}. ${w}`));
      }
      if (result.report) {
        lines.push("\nRelatório:\n" + result.report);
      }

      const report = lines.join("\n");
      setXsdDialog({ open: true, title, report });

      if (!result.valid) {
        toast.error("XML inválido segundo XSD");
      } else if (result.warnings.length > 0) {
        toast.warning("XML válido com avisos do XSD");
      }
    } catch (error) {
      toast.error(extractErrorMessage(error, "Falha ao validar contra XSD"));
    }
  }, []);

  useEffect(() => {
    if (certificadosQuery.error) {
      const error = certificadosQuery.error;
      toast.error(extractErrorMessage(error, "Falha ao carregar certificados"));
    }
  }, [certificadosQuery.error]);

  useEffect(() => {
    if (dpsQuery.error) {
      const error = dpsQuery.error;
      toast.error(extractErrorMessage(error, "Falha ao carregar DPS"));
    }
  }, [dpsQuery.error]);

  useEffect(() => {
    if (notasQuery.error) {
      const error = notasQuery.error;
      toast.error(extractErrorMessage(error, "Falha ao carregar NFSe"));
    }
  }, [notasQuery.error]);

  const handleToggleStatus = (status: DpsStatus) => {
    handleFiltersChange((previous) => {
      const statuses = previous.statuses ?? [];
      const alreadySelected = statuses.includes(status);

      if (alreadySelected) {
        const filtered = statuses.filter((item) => item !== status);

        return {
          ...previous,
          statuses: filtered.length === 0 ? statuses : filtered,
          page: 1,
        };
      }

      const nextStatuses = [...statuses, status];

      return {
        ...previous,
        statuses: nextStatuses,
        page: 1,
      };
    });
  };

  const handleResetFilters = () => {
    setPrestadorSearch("");
    setTomadorSearch("");
    setServicoSearch("");
    handleFiltersChange(() => getDefaultFilters());
  };

  const handleSearchChange = (value: string) => {
    handleFiltersChange((previous) => ({
      ...previous,
      search: value,
      page: 1,
    }));
  };

  const handleAmbienteChange = (value: string) => {
    handleFiltersChange((previous) => ({
      ...previous,
      ambiente: value as Ambiente,
      page: 1,
    }));
  };


  const handlePerPageChange = (value: number) => {
    handleFiltersChange((previous) => ({
      ...previous,
      perPage: value,
      page: 1,
    }));
  };

  const handlePageChange = (page: number) => {
    handleFiltersChange((previous) => ({
      ...previous,
      page: Math.max(1, page),
    }));
  };

  const handleArrayFilterChange = (key: FilterArrayKey, itemId: string, checked: boolean) => {
    handleFiltersChange((previous) => {
      const current = new Set(previous[key]);

      if (checked) {
        current.add(itemId);
      } else {
        current.delete(itemId);
      }

      return {
        ...previous,
        [key]: Array.from(current).sort(),
        page: 1,
      };
    });
  };

  const handleClearArrayFilter = (key: FilterArrayKey) => {
    handleFiltersChange((previous) => ({
      ...previous,
      [key]: [],
      page: 1,
    }));
  };

  const filteredPrestadores = useMemo(() => {
    if (!prestadoresQuery.data) {
      return [] as PrestadorDto[];
    }

    if (!prestadorSearch.trim()) {
      return prestadoresQuery.data.slice(0, MAX_MULTI_OPTIONS);
    }

    const term = prestadorSearch.trim().toLowerCase();
    return prestadoresQuery.data
      .filter((prestador) =>
        [prestador.nomeFantasia, prestador.razaoSocial, prestador.cnpj]
          .filter(Boolean)
          .some((field) => field!.toLowerCase().includes(term)),
      )
      .slice(0, MAX_MULTI_OPTIONS);
  }, [prestadorSearch, prestadoresQuery.data]);

  const filteredTomadores = useMemo(() => {
    if (!tomadoresQuery.data) {
      return [] as TomadorDto[];
    }

    if (!tomadorSearch.trim()) {
      return tomadoresQuery.data.slice(0, MAX_MULTI_OPTIONS);
    }

    const term = tomadorSearch.trim().toLowerCase();
    return tomadoresQuery.data
      .filter((tomador) =>
        [tomador.nomeRazaoSocial, tomador.email, tomador.documento]
          .filter(Boolean)
          .some((field) => field!.toLowerCase().includes(term)),
      )
      .slice(0, MAX_MULTI_OPTIONS);
  }, [tomadorSearch, tomadoresQuery.data]);

  const filteredServicos = useMemo(() => {
    if (!servicosQuery.data) {
      return [] as ServicoDto[];
    }

    if (!servicoSearch.trim()) {
      return servicosQuery.data.slice(0, MAX_MULTI_OPTIONS);
    }

    const term = servicoSearch.trim().toLowerCase();
    return servicosQuery.data
      .filter((servico) =>
        [servico.descricao, servico.codigoTributacaoMunicipal, servico.codigoTributacaoNacional]
          .filter(Boolean)
          .some((field) => field!.toLowerCase().includes(term)),
      )
      .slice(0, MAX_MULTI_OPTIONS);
  }, [servicoSearch, servicosQuery.data]);

  const selectedPrestadores = useMemo(() => {
    if (!filters.prestadorIds.length) {
      return [] as { id: string; label: string }[];
    }

    const items = prestadoresQuery.data ?? [];
    const map = new Map(items.map((item) => [item.id, item]));

    return filters.prestadorIds.map((id) => {
      const prestador = map.get(id);
      const label = prestador?.nomeFantasia ?? prestador?.razaoSocial ?? id;
      return { id, label };
    });
  }, [filters.prestadorIds, prestadoresQuery.data]);

  const selectedTomadores = useMemo(() => {
    if (!filters.tomadorIds.length) {
      return [] as { id: string; label: string }[];
    }

    const items = tomadoresQuery.data ?? [];
    const map = new Map(items.map((item) => [item.id, item]));

    return filters.tomadorIds.map((id) => {
      const tomador = map.get(id);
      const label = tomador?.nomeRazaoSocial ?? tomador?.documento ?? id;
      return { id, label };
    });
  }, [filters.tomadorIds, tomadoresQuery.data]);

  const selectedServicos = useMemo(() => {
    if (!filters.servicoIds.length) {
      return [] as { id: string; label: string }[];
    }

    const items = servicosQuery.data ?? [];
    const map = new Map(items.map((item) => [item.id, item]));

    return filters.servicoIds.map((id) => {
      const servico = map.get(id);
      const label = servico?.descricao ?? id;
      return { id, label };
    });
  }, [filters.servicoIds, servicosQuery.data]);

  const handleDateChange = (key: "startDate" | "endDate", value: string) => {
    const parsed = parseDateInputValue(value);
    handleFiltersChange((previous) => ({
      ...previous,
      [key]: parsed,
      page: 1,
    }));
  };

  const handleValueChange = (key: "minValue" | "maxValue", value: string) => {
    const parsed = value ? Number(value) : undefined;
    handleFiltersChange((previous) => ({
      ...previous,
      [key]: Number.isFinite(parsed) ? parsed : undefined,
      page: 1,
    }));
  };

  const handleOpenAction = (type: ActionType, dps: DpsDto) => {
    console.debug("[NFSe/UI] handleOpenAction", {
      type,
      dpsId: dps.id,
      dpsStatus: dps.status,
      dpsCertificadoId: dps.certificadoId,
    });
    setActionState({ type, dps });
  };

  const resetCreateForm = () => {
    setCreateForm({
      tomadorId: "",
      servicoId: "",
      competencia: new Date().toISOString(),
      dataEmissao: new Date().toISOString(),
      observacoes: "",
    });
  };

  const handleSubmitCreate = () => {
    if (!currentUserQuery.data?.prestadorId) {
      toast.error("Prestador não identificado no contexto");
      return;
    }

    createDpsMutation.mutate({
      prestadorId: currentUserQuery.data.prestadorId,
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
      console.warn("[NFSe/UI] Nenhum certificado selecionado explicitamente. Tentando assinar com resolução automática.", {
        dpsId: actionState.dps.id,
      });
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
      try {
        await assinarMutation.mutateAsync({
          dpsId: actionState.dps.id,
          tag: DEFAULT_SIGNATURE_TAG,
        });
      } catch {
        // handled pela mutation via toast
      }
      return;
    }

    const ambienteNumber = actionState.dps.ambiente === "PRODUCAO"
      ? 1
      : actionState.dps.ambiente === "HOMOLOGACAO"
        ? 2
        : configuracoesQuery.data?.tpAmb ?? (configuracoesQuery.data?.ambientePadrao === "PRODUCAO" ? 1 : 2);

    try {
      console.debug("[NFSe/UI] Emitindo NFSe - mutateAsync", {
        dpsId: actionState.dps.id,
        ambienteNumber,
        selectedCertificateId,
      });
      await emitirMutation.mutateAsync({
        dpsId: actionState.dps.id,
        ambiente: ambienteNumber,
      });
    } catch {
      // handled pela mutation via toast
    }
  };

  return (
    <div className="flex h-screen flex-col gap-4 p-4" suppressHydrationWarning>
      <section className="rounded-lg border bg-card p-4 shadow-sm">
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-2">
              {STATUS_OPTIONS.map((option) => {
                const isActive = filters.statuses.includes(option.value);
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
            </div>

            <div className="flex flex-wrap items-center gap-2">
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
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleResetFilters}
              >
                Limpar filtros
              </Button>
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
          </div>

          <Separator />

          <div className="grid gap-4">
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative w-full max-w-xs">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={filters.search}
                  onChange={(event) => handleSearchChange(event.target.value)}
                  placeholder="Buscar por DPS, tomador ou prestador"
                  className="pl-9"
                />
                {filters.search ? (
                  <button
                    type="button"
                    onClick={() => handleSearchChange("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition hover:text-foreground"
                    aria-label="Limpar busca"
                  >
                    ×
                  </button>
                ) : null}
              </div>

              <Select 
                value={filters.ambiente ?? configuracoesQuery.data?.ambientePadrao ?? "PRODUCAO"} 
                onValueChange={handleAmbienteChange}
                disabled={configuracoesQuery.isLoading}
              >
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="Ambiente" />
                </SelectTrigger>
                <SelectContent>
                  {FILTER_AMBIENTE_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Input
                type="date"
                value={toDateInputValue(filters.startDate)}
                onChange={(event) => handleDateChange("startDate", event.target.value)}
                placeholder="Data início"
                className="w-[160px]"
              />
              <span className="text-sm text-muted-foreground">até</span>
              <Input
                type="date"
                value={toDateInputValue(filters.endDate)}
                onChange={(event) => handleDateChange("endDate", event.target.value)}
                placeholder="Data fim"
                className="w-[160px]"
              />

              <Input
                type="number"
                inputMode="decimal"
                step="0.01"
                min={0}
                value={filters.minValue ?? ""}
                onChange={(event) => handleValueChange("minValue", event.target.value)}
                placeholder="Valor mínimo"
                className="w-[140px]"
              />
              <span className="text-sm text-muted-foreground">a</span>
              <Input
                type="number"
                inputMode="decimal"
                step="0.01"
                min={0}
                value={filters.maxValue ?? ""}
                onChange={(event) => handleValueChange("maxValue", event.target.value)}
                placeholder="Valor máximo"
                className="w-[140px]"
              />

              <Select value={String(filters.perPage)} onValueChange={(value) => handlePerPageChange(Number(value))}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Itens por página" />
                </SelectTrigger>
                <SelectContent>
                  {PER_PAGE_OPTIONS.map((option) => (
                    <SelectItem key={option} value={String(option)}>
                      {option} / página
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className={cn("grid gap-3", isDpsTab ? "md:grid-cols-3" : "md:grid-cols-2") }>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="justify-between">
                  Prestadores
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-72" align="start">
                <DropdownMenuLabel>Selecionar prestadores</DropdownMenuLabel>
                <div className="px-2 py-2">
                  <Input
                    value={prestadorSearch}
                    onChange={(event) => setPrestadorSearch(event.target.value)}
                    placeholder="Buscar prestador"
                    className="h-8"
                  />
                </div>
                <DropdownMenuSeparator />
                {filters.prestadorIds.length > 0 ? (
                  <DropdownMenuItem onSelect={() => handleClearArrayFilter("prestadorIds")}>Limpar seleção</DropdownMenuItem>
                ) : null}
                {filteredPrestadores.length === 0 ? (
                  <DropdownMenuItem disabled>Nenhum prestador encontrado</DropdownMenuItem>
                ) : (
                  filteredPrestadores.map((item) => (
                    <DropdownMenuCheckboxItem
                      key={item.id}
                      checked={filters.prestadorIds.includes(item.id)}
                      onCheckedChange={(checked) => handleArrayFilterChange("prestadorIds", item.id, Boolean(checked))}
                    >
                      <div className="flex flex-col">
                        <span className="text-sm font-medium">{item.nomeFantasia ?? item.razaoSocial}</span>
                        <span className="text-xs text-muted-foreground">CNPJ {item.cnpj}</span>
                      </div>
                    </DropdownMenuCheckboxItem>
                  ))
                )}
              </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="justify-between">
                  Tomadores
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-72" align="start">
                <DropdownMenuLabel>Selecionar tomadores</DropdownMenuLabel>
                <div className="px-2 py-2">
                  <Input
                    value={tomadorSearch}
                    onChange={(event) => setTomadorSearch(event.target.value)}
                    placeholder="Buscar tomador"
                    className="h-8"
                  />
                </div>
                <DropdownMenuSeparator />
                {filters.tomadorIds.length > 0 ? (
                  <DropdownMenuItem onSelect={() => handleClearArrayFilter("tomadorIds")}>Limpar seleção</DropdownMenuItem>
                ) : null}
                {filteredTomadores.length === 0 ? (
                  <DropdownMenuItem disabled>Nenhum tomador encontrado</DropdownMenuItem>
                ) : (
                  filteredTomadores.map((item) => (
                    <DropdownMenuCheckboxItem
                      key={item.id}
                      checked={filters.tomadorIds.includes(item.id)}
                      onCheckedChange={(checked) => handleArrayFilterChange("tomadorIds", item.id, Boolean(checked))}
                    >
                      <div className="flex flex-col">
                        <span className="text-sm font-medium">{item.nomeRazaoSocial}</span>
                        <span className="text-xs text-muted-foreground">{item.documento}</span>
                      </div>
                    </DropdownMenuCheckboxItem>
                  ))
                )}
              </DropdownMenuContent>
            </DropdownMenu>

            {isDpsTab ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="justify-between">
                    Serviços
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-72" align="start">
                  <DropdownMenuLabel>Selecionar serviços</DropdownMenuLabel>
                  <div className="px-2 py-2">
                    <Input
                      value={servicoSearch}
                      onChange={(event) => setServicoSearch(event.target.value)}
                      placeholder="Buscar serviço"
                      className="h-8"
                    />
                  </div>
                  <DropdownMenuSeparator />
                  {filters.servicoIds.length > 0 ? (
                    <DropdownMenuItem onSelect={() => handleClearArrayFilter("servicoIds")}>
                      Limpar seleção
                    </DropdownMenuItem>
                  ) : null}
                  {filteredServicos.length === 0 ? (
                    <DropdownMenuItem disabled>Nenhum serviço encontrado</DropdownMenuItem>
                  ) : (
                    filteredServicos.map((item) => (
                      <DropdownMenuCheckboxItem
                        key={item.id}
                        checked={filters.servicoIds.includes(item.id)}
                        onCheckedChange={(checked) => handleArrayFilterChange("servicoIds", item.id, Boolean(checked))}
                      >
                        <div className="flex flex-col">
                          <span className="text-sm font-medium">{item.descricao}</span>
                          <span className="text-xs text-muted-foreground">
                            Código municipal: {item.codigoTributacaoMunicipal ?? "-"}
                          </span>
                        </div>
                      </DropdownMenuCheckboxItem>
                    ))
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            ) : null}
          </div>

          {(selectedPrestadores.length > 0 || selectedTomadores.length > 0 || (isDpsTab && selectedServicos.length > 0)) && (
            <div className="flex flex-wrap gap-2">
              {selectedPrestadores.map((item) => (
                <Badge key={`prestador-tag-${item.id}`} variant="outline" className="flex items-center gap-2">
                  <Building2 className="h-3.5 w-3.5" /> {item.label}
                  <button onClick={() => handleArrayFilterChange("prestadorIds", item.id, false)} aria-label="Remover prestador">
                    ×
                  </button>
                </Badge>
              ))}
              {selectedTomadores.map((item) => (
                <Badge key={`tomador-tag-${item.id}`} variant="outline" className="flex items-center gap-2">
                  <User2 className="h-3.5 w-3.5" /> {item.label}
                  <button onClick={() => handleArrayFilterChange("tomadorIds", item.id, false)} aria-label="Remover tomador">
                    ×
                  </button>
                </Badge>
              ))}
              {isDpsTab
                ? selectedServicos.map((item) => (
                    <Badge key={`servico-tag-${item.id}`} variant="outline" className="flex items-center gap-2">
                      <ScrollText className="h-3.5 w-3.5" /> {item.label}
                      <button onClick={() => handleArrayFilterChange("servicoIds", item.id, false)} aria-label="Remover serviço">
                        ×
                      </button>
                    </Badge>
                  ))
                : null}
            </div>
          )}
          </div>
        </div>
      </section>

      <section className="flex min-h-0 flex-1 flex-col rounded-lg border bg-card shadow-sm">
        <Tabs
          value={activeTab}
          onValueChange={(value) => setActiveTab(value as "dps" | "notas")}
          className="flex h-full min-h-0 flex-col"
        >
          <div className="flex flex-wrap items-center justify-between gap-3 border-b px-4 py-3">
            <TabsList>
              <TabsTrigger value="dps">Declarações pendentes</TabsTrigger>
              <TabsTrigger value="notas">NFSe emitidas recentemente</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="dps" className="flex min-h-0 flex-1 flex-col">
            <div className="flex min-h-0 flex-1 flex-col overflow-hidden px-4 pb-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>DPS</TableHead>
                    <TableHead>Prestador</TableHead>
                    <TableHead>Tomador</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {dpsQuery.isLoading ? (
                    <TableRow>
                      <TableCell colSpan={5} className="py-10 text-center text-sm text-muted-foreground">
                        Carregando declarações...
                      </TableCell>
                    </TableRow>
                  ) : dpsData.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="py-10 text-center text-sm text-muted-foreground">
                        Nenhuma DPS encontrada para os filtros selecionados.
                      </TableCell>
                    </TableRow>
                  ) : (
                    dpsData.map((dps: DpsDto) => (
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
                              variant="secondary"
                              disabled={dps.status !== "ASSINADO"}
                              onClick={() => handlePreviewSignedXml(dps.id)}
                            >
                              <ExternalLink className="mr-2 h-4 w-4" />
                              Visualizar
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                // Abre relatório direto em nova aba via rota dedicada
                                const url = `/api/nfse/validar/relatorio?dpsId=${encodeURIComponent(dps.id)}`;
                                const win = window.open(url, "_blank", "noopener,noreferrer");
                                // Em paralelo, mantém feedback em toast reutilizando handler existente
                                handleValidateXsd(dps);
                                if (!win) {
                                  toast.warning("Permita pop-ups para visualizar o relatório");
                                }
                              }}
                            >
                              <ScrollText className="mr-2 h-4 w-4" />
                              Validar XSD
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

            <div className="mt-auto border-t px-4 py-3 text-xs text-muted-foreground">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <span>
                  Página {dpsPagination.page} de {dpsPagination.totalPages} · {dpsPagination.totalItems} registro
                  {dpsPagination.totalItems === 1 ? "" : "s"}
                </span>

                <div className="flex flex-wrap items-center gap-3">
                  <Pagination>
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious
                          aria-disabled={dpsPagination.page === 1}
                          className={dpsPagination.page === 1 ? "pointer-events-none opacity-50" : ""}
                          onClick={() => dpsPagination.page > 1 && handlePageChange(dpsPagination.page - 1)}
                        />
                      </PaginationItem>

                      {Array.from({ length: Math.min(5, dpsPagination.totalPages) }).map((_, index) => {
                        const start = Math.max(1, dpsPagination.page - 2);
                        const targetPage = Math.min(dpsPagination.totalPages, start + index);
                        return (
                          <PaginationItem key={`dps-page-${targetPage}`}>
                            <PaginationLink
                              isActive={dpsPagination.page === targetPage}
                              onClick={() => handlePageChange(targetPage)}
                            >
                              {targetPage}
                            </PaginationLink>
                          </PaginationItem>
                        );
                      })}

                      <PaginationItem>
                        <PaginationNext
                          aria-disabled={dpsPagination.page === dpsPagination.totalPages}
                          className={dpsPagination.page === dpsPagination.totalPages ? "pointer-events-none opacity-50" : ""}
                          onClick={() =>
                            dpsPagination.page < dpsPagination.totalPages && handlePageChange(dpsPagination.page + 1)
                          }
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="notas" className="flex min-h-0 flex-1 flex-col">
            <div className="flex min-h-0 flex-1 flex-col overflow-hidden px-4 pb-4">
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
                    notasData.map((nota: NotaDto) => (
                      <TableRow key={nota.id} className="align-top">
                        <TableCell>
                          <div className="font-medium">NFSe {nota.numero}</div>
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
                              <ScrollText className="mr-2 h-4 w-4" /> DANFSE
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

            <div className="mt-auto border-t px-4 py-3 text-xs text-muted-foreground">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <span>
                  Página {notasPagination.page} de {notasPagination.totalPages} · {notasPagination.totalItems} registro
                  {notasPagination.totalItems === 1 ? "" : "s"}
                </span>

                <div className="flex flex-wrap items-center gap-3">
                  <Pagination>
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious
                          aria-disabled={notasPagination.page === 1}
                          className={notasPagination.page === 1 ? "pointer-events-none opacity-50" : ""}
                          onClick={() => notasPagination.page > 1 && handlePageChange(notasPagination.page - 1)}
                        />
                      </PaginationItem>

                      {Array.from({ length: Math.min(5, notasPagination.totalPages) }).map((_, index) => {
                        const start = Math.max(1, notasPagination.page - 2);
                        const targetPage = Math.min(notasPagination.totalPages, start + index);
                        return (
                          <PaginationItem key={`nota-page-${targetPage}`}>
                            <PaginationLink
                              isActive={notasPagination.page === targetPage}
                              onClick={() => handlePageChange(targetPage)}
                            >
                              {targetPage}
                            </PaginationLink>
                          </PaginationItem>
                        );
                      })}

                      <PaginationItem>
                        <PaginationNext
                          aria-disabled={notasPagination.page === notasPagination.totalPages}
                          className={notasPagination.page === notasPagination.totalPages ? "pointer-events-none opacity-50" : ""}
                          onClick={() =>
                            notasPagination.page < notasPagination.totalPages && handlePageChange(notasPagination.page + 1)
                          }
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
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
              <div className="space-y-2 rounded border bg-muted/30 p-3 text-sm">
                <div>
                  <p className="font-medium">DPS nº {actionState.dps.numero}</p>
                  <p className="text-xs text-muted-foreground">Atualizada em {formatDate(actionState.dps.updatedAt)}</p>
                </div>
                <div className="space-y-1 text-muted-foreground">
                  <p>
                    <span className="font-medium text-foreground">Prestador:</span> {actionState.dps.prestador.nomeFantasia}
                  </p>
                  <p>
                    <span className="font-medium text-foreground">Tomador:</span> {actionState.dps.tomador.nomeRazaoSocial}
                  </p>
                </div>
              </div>

              {actionState.type === "sign" ? null : (
                <div className="space-y-1 text-sm text-muted-foreground">
                  <span className="font-medium text-foreground">Ambiente:</span> {resolveAmbienteLabel(actionState.dps.ambiente ?? configuracoesQuery.data?.ambientePadrao ?? "HOMOLOGACAO")}
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
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="tomadorId">Tomador</Label>
              <Select
                value={createForm.tomadorId}
                onValueChange={(value) => setCreateForm((prev) => ({ ...prev, tomadorId: value }))}
                disabled={tomadoresQuery.isLoading || createDpsMutation.isPending}
              >
                <SelectTrigger id="tomadorId">
                  <SelectValue placeholder="Selecione" className="max-w-full text-left wrap-break-word line-clamp-2" />
                </SelectTrigger>
                <SelectContent>
                  {tomadoresQuery.isLoading ? (
                    <SelectItem value={SELECT_LOADING_VALUE} disabled>
                      Carregando...
                    </SelectItem>
                  ) : (tomadoresQuery.data ?? []).length > 0 ? (
                    tomadoresQuery.data?.map((tomador) => (
                      <SelectItem key={tomador.id} value={tomador.id} className="wrap-break-word">
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
                  <SelectValue placeholder="Selecione" className="max-w-full text-left wrap-break-word line-clamp-2" />
                </SelectTrigger>
                <SelectContent>
                  {servicosQuery.isLoading ? (
                    <SelectItem value={SELECT_LOADING_VALUE} disabled>
                      Carregando...
                    </SelectItem>
                  ) : (servicosQuery.data ?? []).length > 0 ? (
                    servicosQuery.data?.map((servico) => (
                      <SelectItem key={servico.id} value={servico.id} className="wrap-break-word">
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
                !currentUserQuery.data?.prestadorId ||
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
