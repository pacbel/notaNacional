import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getRobotToken } from "@/lib/notanacional-api";
import { getEnv } from "@/lib/env";

/**
 * GET /api/prestadores
 * Retorna o prestador do usuário logado da API externa
 */
export async function GET() {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return NextResponse.json({ message: "Não autorizado" }, { status: 401 });
    }

    const token = await getRobotToken();
    const env = getEnv();

    // Buscar lista de prestadores da API externa (retorna apenas os do usuário)
    const url = `${env.APP_BASE_URL}/api/Prestadores`;
    
    console.log("[Prestadores] Buscando prestadores");
    console.log("[Prestadores] URL:", url);
    console.log("[Prestadores] Token presente:", !!token);
    console.log("[Prestadores] Token (primeiros 50 chars):", token?.substring(0, 50));
    console.log("[Prestadores] PrestadorId do usuário:", currentUser.prestadorId);

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
      console.error("[Prestadores] Erro ao buscar:", error);
      console.error("[Prestadores] Status:", response.status);
      return NextResponse.json(
        { message: error || "Erro ao buscar prestador" },
        { status: response.status }
      );
    }

    const data = await response.json();
    console.log("[Prestadores] Resposta da API:", data);

    // A API retorna lista de prestadores do token
    // Filtrar pelo prestadorId do usuário se necessário
    const prestadores = Array.isArray(data) ? data : [data];
    const prestador = prestadores.find((p: any) => p.id === currentUser.prestadorId) || prestadores[0];

    if (!prestador) {
      return NextResponse.json(
        { message: "Prestador não encontrado" },
        { status: 404 }
      );
    }

    // Retornar no formato de lista para compatibilidade com frontend
    return NextResponse.json({
      data: [prestador],
      total: 1,
      page: 1,
      perPage: 1,
    });
  } catch (error) {
    console.error("[Prestadores] Erro:", error);
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Erro ao buscar prestador" },
      { status: 500 }
    );
  }
}
