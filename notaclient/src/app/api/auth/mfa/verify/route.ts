import { NextResponse } from "next/server";
import { z } from "zod";
import { getEnv } from "@/lib/env";
import { buildSessionCookie } from "@/lib/auth";

const verifySchema = z.object({
  email: z.string().email(),
  codigo: z.string().min(1),
});

export async function POST(request: Request) {
  try {
    const payload = await request.json().catch(() => null);

    const parseResult = verifySchema.safeParse(payload);

    if (!parseResult.success) {
      return NextResponse.json({ message: "Dados inválidos" }, { status: 400 });
    }

    const env = getEnv();

    // Chamar API externa para confirmar MFA
    const response = await fetch(`${env.NOTA_API_BASE_URL}/api/Auth/confirm-mfa`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(parseResult.data),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: "Código inválido" }));
      return NextResponse.json(
        { message: error.message || error.detail || "Código inválido" },
        { status: response.status }
      );
    }

    const data = await response.json();
    
    // Armazenar o token JWT retornado pela API em um cookie
    const sessionToken = data.accessToken || data.access_token;
    
    if (!sessionToken) {
      return NextResponse.json(
        { message: "Token não retornado pela API" },
        { status: 500 }
      );
    }

    const result = NextResponse.json({ success: true });
    result.cookies.set(buildSessionCookie(sessionToken));

    return result;
  } catch (error) {
    console.error("[MFA] Erro ao verificar código:", error);
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Erro ao verificar código" },
      { status: 500 }
    );
  }
}
