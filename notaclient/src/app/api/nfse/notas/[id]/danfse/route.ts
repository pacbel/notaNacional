import { NextResponse } from "next/server";

import { handleRouteError } from "@/lib/http";
import { gerarDanfse } from "@/lib/nfse/service";

interface RouteParams {
  params: {
    id: string;
  };
}

export async function GET(request: Request, { params }: RouteParams) {
  try {
    const { searchParams } = new URL(request.url);
    const ambiente = searchParams.get("ambiente");
    const certificateId = searchParams.get("certificateId") ?? undefined;

    const parsedAmbiente = ambiente ? Number(ambiente) : undefined;

    const { buffer, filename, contentType } = await gerarDanfse(params.id, {
      ambiente: parsedAmbiente,
      certificateId,
    });

    return new NextResponse(buffer as unknown as BodyInit, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    return handleRouteError(error, "Erro ao gerar DANFSE");
  }
}
