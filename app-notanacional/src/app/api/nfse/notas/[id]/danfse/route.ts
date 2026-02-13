import { NextResponse } from "next/server";

import { handleRouteError } from "@/lib/http";
import { gerarDanfse } from "@/lib/nfse/service";

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

export async function GET(request: Request, context: RouteParams) {
  try {
    const { searchParams } = new URL(request.url);
    const ambiente = searchParams.get("ambiente");
    const certificateId = searchParams.get("certificateId") ?? undefined;

    const parsedAmbiente = ambiente ? Number(ambiente) : undefined;
    const { id } = await context.params;

    console.info("[NFSe/API] DANFSe - requisição recebida", {
      chaveAcesso: id,
      ambiente: parsedAmbiente ?? "auto",
      certificateId,
    });

    const { buffer, filename, contentType } = await gerarDanfse(id, {
      ambiente: parsedAmbiente,
      certificateId,
    });

    console.info("[NFSe/API] DANFSe - resposta gerada", {
      chaveAcesso: id,
      contentType,
      filename,
      tamanhoBytes: buffer.byteLength,
    });

    return new NextResponse(buffer as unknown as BodyInit, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `inline; filename="${filename}"`,
      },
    });
  } catch (error) {
    return handleRouteError(error, "Erro ao gerar DANFSE");
  }
}
