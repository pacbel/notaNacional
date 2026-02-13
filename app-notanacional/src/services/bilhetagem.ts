import { fetchWithAuth } from "@/lib/fetch-with-auth";

export interface BilhetagemSaldoResponse {
  bilhetagemHabilitada: boolean;
  creditoMensalPadrao?: number | null;
  saldoNotasDisponiveis: number;
  competenciaSaldo?: string | null;
}

export async function getSaldoBilhetagem(prestadorId: string): Promise<BilhetagemSaldoResponse> {
  const response = await fetchWithAuth(
    `/api/prestadores/${prestadorId}/bilhetagem/saldo`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      cache: "no-store",
    }
  );

  if (response.status === 401) {
    throw new Error("Não autorizado");
  }

  if (!response.ok) {
    const errorText = await response.text().catch(() => "");

    throw new Error(
      errorText.trim() || "Não foi possível obter o saldo de bilhetagem"
    );
  }

  return (await response.json()) as BilhetagemSaldoResponse;
}
