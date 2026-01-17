import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getRobotToken } from "@/lib/notanacional-api";
import { getEnv } from "@/lib/env";

/**
 * GET /api/prestadores/[id]
 * Retorna o prestador da API externa apenas se for o prestador do usuário logado
 */
export async function GET(_request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return NextResponse.json({ message: "Não autorizado" }, { status: 401 });
    }

    const { id } = await context.params;

    // Apenas permitir acesso ao próprio prestador
    if (id !== currentUser.prestadorId) {
      return NextResponse.json({ message: "Acesso negado" }, { status: 403 });
    }

    const token = await getRobotToken();
    const env = getEnv();

    const url = `${env.API_BASE_URL}/api/Prestadores/${id}`;
    
    console.log("[Prestadores] Buscando prestador por ID:", id);
    console.log("[Prestadores] URL:", url);
    console.log("[Prestadores] Token presente:", !!token);

    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      cache: "no-store",
    });

    if (!response.ok) {
      const error = await response.text();
      console.error("[Prestadores] Erro ao buscar por ID:", error);
      return NextResponse.json(
        { message: error || "Erro ao buscar prestador" },
        { status: response.status }
      );
    }

    const prestador = await response.json();
    return NextResponse.json(prestador);
  } catch (error) {
    console.error("[Prestadores] Erro:", error);
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Erro ao buscar prestador" },
      { status: 500 }
    );
  }
}

// POST, PATCH e DELETE removidos - prestadores são gerenciados pela API externa
