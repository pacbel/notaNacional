import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { getEnv } from "@/lib/env";

const PUBLIC_API_PREFIX = "/api/public";

function isPublicApiRoute(pathname: string) {
  return pathname.startsWith(PUBLIC_API_PREFIX);
}

function unauthorizedResponse() {
  const response = new NextResponse("Unauthorized", { status: 401 });
  response.headers.set("WWW-Authenticate", "Basic realm=\"Public API\"");
  return response;
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (!isPublicApiRoute(pathname)) {
    return NextResponse.next();
  }

  const authHeader = request.headers.get("authorization");

  if (!authHeader?.startsWith("Basic ")) {
    return unauthorizedResponse();
  }

  const credentials = Buffer.from(authHeader.replace("Basic ", ""), "base64").toString("utf-8");
  const [user, password] = credentials.split(":");

  if (!user || !password) {
    return unauthorizedResponse();
  }

  const env = getEnv();

  if (user !== env.PUBLIC_API_USER || password !== env.PUBLIC_API_PASSWORD) {
    return unauthorizedResponse();
  }

  return NextResponse.next();
}

export const config = {
  matcher: "/api/public/:path*",
};
