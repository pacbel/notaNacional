import { NextResponse } from "next/server";
import { SESSION_COOKIE_NAME } from "@/lib/constants";

export async function POST() {
  // Apenas limpar o cookie de sessão
  // A API externa gerencia a invalidação do token
  const response = NextResponse.json({ success: true });
  response.cookies.set(SESSION_COOKIE_NAME, "", {
    path: "/",
    maxAge: 0,
  });

  return response;
}
