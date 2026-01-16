import { NextResponse } from "next/server";
import { z } from "zod";
import { getEnv } from "@/lib/env";

const forgotSchema = z.object({
  email: z.string().email(),
});

export async function POST(request: Request) {
  try {
    const payload = await request.json().catch(() => null);
    const parseResult = forgotSchema.safeParse(payload);

    if (!parseResult.success) {
      return NextResponse.json({ message: "Dados inválidos" }, { status: 400 });
    }

    const env = getEnv();

    // Chamar API externa para solicitar recuperação de senha
    const response = await fetch(`${env.NOTA_API_BASE_URL}/api/Auth/forgot-password`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(parseResult.data),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: "Erro ao solicitar recuperação de senha" }));
      return NextResponse.json(
        { message: error.message || error.detail || "Erro ao solicitar recuperação de senha" },
        { status: response.status }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[ForgotPassword] Erro:", error);
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Erro ao solicitar recuperação de senha" },
      { status: 500 }
    );
  }
}
