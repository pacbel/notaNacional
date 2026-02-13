import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth";
import { RobotCredentialsMissingError } from "@/lib/errors";
import { getEnv } from "@/lib/env";
import { fetchWithAuth } from "@/lib/fetch-with-auth";
import { hasFullAccess } from "@/lib/permissions";
import { getRobotToken } from "@/lib/notanacional-api";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return NextResponse.json({ message: "Não autorizado" }, { status: 401 });
    }

    const { id } = await context.params;

    if (!id) {
      return NextResponse.json({ message: "Prestador inválido" }, { status: 400 });
    }

    if (!hasFullAccess(currentUser.role) && currentUser.prestadorId !== id) {
      return NextResponse.json({ message: "Acesso negado" }, { status: 403 });
    }

    const token = await getRobotToken(id);
    const env = getEnv();

    const response = await fetchWithAuth(`${env.API_BASE_URL}/api/prestadores/${id}/bilhetagem/saldo`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      cache: "no-store",
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => "");
      const message = errorText.trim() || "Não foi possível obter o saldo de bilhetagem";
      return NextResponse.json({ message }, { status: response.status });
    }

    const payload = await response.json();
    return NextResponse.json(payload);
  } catch (error) {
    if (error instanceof RobotCredentialsMissingError) {
      return NextResponse.json(
        { message: error.message, redirectTo: "/configuracoes" },
        { status: error.statusCode }
      );
    }

    console.error("[Bilhetagem] Erro ao consultar saldo", error);
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Erro ao obter saldo de bilhetagem" },
      { status: 500 }
    );
  }
}
