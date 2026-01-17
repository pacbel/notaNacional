import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getRobotToken } from "@/lib/notanacional-api";
import { getEnv } from "@/lib/env";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return NextResponse.json(
        { message: "Não autorizado" },
        { status: 401 }
      );
    }

    const { id } = await params;
    const body = await request.json();
    const token = await getRobotToken();
    const env = getEnv();

    const response = await fetch(`${env.API_BASE_URL}/api/Usuarios/${id}/senha`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const error = await response.text();
      return NextResponse.json(
        { message: error || "Erro ao alterar senha" },
        { status: response.status }
      );
    }

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Erro ao alterar senha" },
      { status: 500 }
    );
  }
}
