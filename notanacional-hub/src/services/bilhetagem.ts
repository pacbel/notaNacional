import { apiFetch } from "@/services/http";
import {
  AdicionarCreditoBilhetagemRequestDto,
  BilhetagemLancamentoDto,
  BilhetagemSaldoDto,
} from "@/types/prestadores";

const basePath = "/api/prestadores";

export function obterBilhetagemSaldo(prestadorId: string) {
  return apiFetch<BilhetagemSaldoDto>(`${basePath}/${prestadorId}/bilhetagem/saldo`);
}

export function listarLancamentosBilhetagem(prestadorId: string, limite?: number) {
  const searchParams = new URLSearchParams();
  if (typeof limite === "number") {
    searchParams.set("limite", limite.toString());
  }

  const query = searchParams.toString();
  const url = query ? `${basePath}/${prestadorId}/bilhetagem/lancamentos?${query}` : `${basePath}/${prestadorId}/bilhetagem/lancamentos`;

  return apiFetch<BilhetagemLancamentoDto[]>(url);
}

export function adicionarCreditoBilhetagem(
  prestadorId: string,
  payload: AdicionarCreditoBilhetagemRequestDto
) {
  return apiFetch<BilhetagemSaldoDto>(`${basePath}/${prestadorId}/bilhetagem/creditos`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}
