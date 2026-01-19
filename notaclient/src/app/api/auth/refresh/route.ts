import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { SESSION_COOKIE_NAME } from "@/lib/constants";
import { decodeTokenPayload } from "@/lib/notanacional-api";
import { buildSessionCookie } from "@/lib/auth";

export async function POST() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

    if (!token) {
      return NextResponse.json(
        { message: "Token não encontrado" },
        { status: 401 }
      );
    }

    // Verifica se o token atual ainda é válido
    const payload = decodeTokenPayload(token);

    if (!payload) {
      return NextResponse.json(
        { message: "Token inválido" },
        { status: 401 }
      );
    }

    // Verifica se o token expirou
    const exp = payload.exp as number | undefined;
    if (exp && exp * 1000 < Date.now()) {
      return NextResponse.json(
        { message: "Token expirado" },
        { status: 401 }
      );
    }

    // Se o token ainda é válido, apenas renova o cookie
    const response = NextResponse.json({ success: true });
    const sessionCookie = buildSessionCookie(token);
    
    response.cookies.set(
      sessionCookie.name,
      sessionCookie.value,
      {
        httpOnly: sessionCookie.httpOnly,
        secure: sessionCookie.secure,
        sameSite: sessionCookie.sameSite,
        path: sessionCookie.path,
        maxAge: sessionCookie.maxAge,
      }
    );

    return response;
  } catch (error) {
    console.error("[Auth Refresh] Erro:", error);
    return NextResponse.json(
      { message: "Erro ao renovar sessão" },
      { status: 500 }
    );
  }
}
