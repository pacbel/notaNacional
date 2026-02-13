import { NextResponse } from "next/server";

import { handleRouteError } from "@/lib/http";
import { createTomadorPublic } from "@/lib/services/public-api-service";
import { publicTomadorCreateSchema } from "@/lib/validators/public-api";

export async function POST(request: Request) {
  try {
    const payload = await request.json().catch(() => null);
    const parseResult = publicTomadorCreateSchema.safeParse(payload);

    if (!parseResult.success) {
      return NextResponse.json({ message: "Dados inválidos", issues: parseResult.error.format() }, { status: 400 });
    }

    const id = await createTomadorPublic(parseResult.data);

    return NextResponse.json({ id }, { status: 201 });
  } catch (error) {
    return handleRouteError(error, "Erro ao criar tomador");
  }
}
