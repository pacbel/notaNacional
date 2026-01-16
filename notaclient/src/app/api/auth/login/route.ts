import { NextResponse } from "next/server";
import { z } from "zod";
import { getEnv } from "@/lib/env";

const loginSchema = z.object({
  email: z.string().email(),
  senha: z.string().min(1),
});

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null);

    const parseResult = loginSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        { message: "Credenciais inválidas" },
        { status: 400 }
      );
    }

    const env = getEnv();

    // Chamar API externa para login
    const response = await fetch(`${env.NOTA_API_BASE_URL}/api/Auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(parseResult.data),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: "Credenciais inválidas" }));
      return NextResponse.json(
        { message: error.message || error.detail || "Credenciais inválidas" },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("[Login] Erro ao autenticar:", error);
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Erro ao autenticar" },
      { status: 500 }
    );
  }
}
