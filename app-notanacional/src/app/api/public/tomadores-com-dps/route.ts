import { NextResponse } from "next/server";

import { handleRouteError } from "@/lib/http";
import { createTomadorComDpsPublic } from "@/lib/services/public-api-service";
import { publicTomadorWithDpsSchema } from "@/lib/validators/public-api";

export async function POST(request: Request) {
  try {
    const payload = await request.json().catch(() => null);
    const parseResult = publicTomadorWithDpsSchema.safeParse(payload);

    if (!parseResult.success) {
      return NextResponse.json({ message: "Dados inválidos", issues: parseResult.error.format() }, { status: 400 });
    }

    const ids = await createTomadorComDpsPublic(parseResult.data);

    return NextResponse.json(ids, { status: 201 });
  } catch (error) {
    return handleRouteError(error, "Erro ao criar tomador e DPS");
  }
}
