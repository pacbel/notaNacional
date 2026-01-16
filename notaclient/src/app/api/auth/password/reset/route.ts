import { NextResponse } from "next/server";
import { z } from "zod";
import { getEnv } from "@/lib/env";

const resetSchema = z.object({
  token: z.string().min(1),
  novaSenha: z.string().min(8, "A nova senha precisa ter pelo menos 8 caracteres"),
});

export async function POST(request: Request) {
  try {
    const payload = await request.json().catch(() => null);
    const parseResult = resetSchema.safeParse(payload);

    if (!parseResult.success) {
      return NextResponse.json({ message: "Dados inválidos" }, { status: 400 });
    }

    const env = getEnv();

    // Chamar API externa para resetar senha
    const response = await fetch(`${env.NOTA_API_BASE_URL}/api/Auth/reset-password`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(parseResult.data),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: "Erro ao resetar senha" }));
      return NextResponse.json(
        { message: error.message || error.detail || "Erro ao resetar senha" },
        { status: response.status }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[ResetPassword] Erro:", error);
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Erro ao resetar senha" },
      { status: 500 }
    );
  }
}
