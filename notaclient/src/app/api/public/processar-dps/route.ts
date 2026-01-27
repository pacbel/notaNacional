import { NextResponse } from "next/server";

import { handleRouteError } from "@/lib/http";
import { processarDpsPublic } from "@/lib/services/public-api-service";
import { publicProcessDpsSchema } from "@/lib/validators/public-api";

export async function POST(request: Request) {
  try {
    const payload = await request.json().catch(() => null);
    const parseResult = publicProcessDpsSchema.safeParse(payload);

    if (!parseResult.success) {
      return NextResponse.json({ message: "Dados inválidos", issues: parseResult.error.format() }, { status: 400 });
    }

    const results = await processarDpsPublic(parseResult.data);

    return NextResponse.json(results, { status: 200 });
  } catch (error) {
    return handleRouteError(error, "Erro ao processar DPS");
  }
}
