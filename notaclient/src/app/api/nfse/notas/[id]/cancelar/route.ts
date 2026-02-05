import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { handleRouteError } from "@/lib/http";
import { cancelarNota } from "@/lib/nfse/service";
import { CANCELAMENTO_MOTIVO_CODES } from "@/lib/nfse/cancelamento-motivos";

const cancelarNfseRequestSchema = z.object({
  chaveAcesso: z.string().min(1),
  motivoCodigo: z.enum(CANCELAMENTO_MOTIVO_CODES),
  justificativa: z.string().min(5),
  ambiente: z.number().int().min(1).max(2).optional(),
});

export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    void id;
    const body = await request.json().catch(() => null);
    const parseResult = cancelarNfseRequestSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json({ message: "Dados inválidos", issues: parseResult.error.format() }, { status: 400 });
    }

    console.info("[NFSe/API] Cancelar NFSe - requisição recebida", {
      chaveAcesso: parseResult.data.chaveAcesso,
      motivoCodigo: parseResult.data.motivoCodigo,
      ambiente: parseResult.data.ambiente ?? "auto",
    });

    const response = await cancelarNota(parseResult.data);

    console.info("[NFSe/API] Cancelar NFSe - resposta entregue", {
      chaveAcesso: parseResult.data.chaveAcesso,
      statusCode: response.statusCode,
      contentType: response.contentType,
    });

    return NextResponse.json(response);
  } catch (error) {
    return handleRouteError(error, "Erro ao cancelar NFSe");
  }
}
