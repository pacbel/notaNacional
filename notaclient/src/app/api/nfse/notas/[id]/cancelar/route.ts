import { NextResponse } from "next/server";

import { handleRouteError } from "@/lib/http";
import { cancelarNota, cancelarNfseSchema } from "@/lib/nfse/service";

interface RouteParams {
  params: {
    id: string;
  };
}

export async function POST(request: Request, { params }: RouteParams) {
  try {
    const body = await request.json().catch(() => null);
    const parseResult = cancelarNfseSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json({ message: "Dados inválidos", issues: parseResult.error.format() }, { status: 400 });
    }

    const response = await cancelarNota(parseResult.data);

    return NextResponse.json(response);
  } catch (error) {
    return handleRouteError(error, "Erro ao cancelar NFSe");
  }
}
