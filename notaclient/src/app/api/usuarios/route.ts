import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getRobotToken, getPrestadorIdFromToken } from "@/lib/notanacional-api";
import { getEnv } from "@/lib/env";

export async function GET() {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return NextResponse.json(
        { message: "Não autorizado" },
        { status: 401 }
      );
    }

    const token = await getRobotToken();
    const env = getEnv();

    // Usar prestadorId do usuário logado
    const prestadorId = currentUser.prestadorId;

    console.log("[Usuarios] Consultando usuários com prestadorId:", prestadorId);

    // Adicionar prestadorId como query parameter
    const url = new URL(`${env.NOTA_API_BASE_URL}/api/Usuarios`);
    url.searchParams.append("prestadorId", prestadorId);

    const response = await fetch(url.toString(), {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      cache: "no-store",
    });

    if (!response.ok) {
      const error = await response.text();
      return NextResponse.json(
        { message: error || "Erro ao buscar usuários" },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Erro ao buscar usuários" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return NextResponse.json(
        { message: "Não autorizado" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const token = await getRobotToken();
    const env = getEnv();

    // Garantir que o usuário seja criado para o prestador correto
    const payload = {
      ...body,
      prestadorId: currentUser.prestadorId,
    };

    const response = await fetch(`${env.NOTA_API_BASE_URL}/api/Usuarios`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const error = await response.text();
      return NextResponse.json(
        { message: error || "Erro ao criar usuário" },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Erro ao criar usuário" },
      { status: 500 }
    );
  }
}
