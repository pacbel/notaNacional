import { toast } from "sonner";
import { ApiError } from "@/services/http";

export function handleApiError(error: unknown, fallbackMessage = "Ocorreu um erro inesperado.") {
  if (error instanceof ApiError) {
    if (error.status === 401) {
      const message =
        typeof error.payload === "string"
          ? error.payload
          : error.payload && typeof error.payload === "object" && "mensagem" in error.payload
            ? String((error.payload as { mensagem: unknown }).mensagem)
            : "Sessão expirada. Faça login novamente.";
      toast.error(message);
      return;
    }

    if (error.status === 403) {
      toast.error(
        typeof error.payload === "string"
          ? error.payload
          : "Você não tem permissão para acessar este recurso."
      );
      return;
    }

    const message =
      typeof error.payload === "string"
        ? error.payload
        : error.payload && typeof error.payload === "object" && "mensagem" in error.payload
          ? String((error.payload as { mensagem: unknown }).mensagem)
          : error.message;

    toast.error(message ?? fallbackMessage);
    return;
  }

  const message = error instanceof Error ? error.message : fallbackMessage;
  toast.error(message);
}

export function handleSuccess(message: string) {
  toast.success(message);
}
