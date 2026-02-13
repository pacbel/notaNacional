import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";

/**
 * GET /api/auth/me
 * Retorna os dados do usuário autenticado
 */
export async function GET() {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return NextResponse.json(
        { message: "Não autenticado" },
        { status: 401 }
      );
    }

    return NextResponse.json({
      id: currentUser.id,
      nome: currentUser.nome,
      email: currentUser.email,
      prestadorId: currentUser.prestadorId,
      role: currentUser.role,
    });
  } catch (error) {
    console.error("[API /auth/me] Erro ao obter usuário:", error);
    return NextResponse.json(
      { message: "Erro ao obter dados do usuário" },
      { status: 500 }
    );
  }
}
