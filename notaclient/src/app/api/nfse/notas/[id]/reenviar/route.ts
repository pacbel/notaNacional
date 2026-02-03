import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { handleRouteError } from "@/lib/http";
import { reenviarNotaFiscalEmail } from "@/lib/nfse/service";

const bodySchema = z
  .object({
    ambiente: z.number().int().min(1).max(2).optional(),
    certificateId: z.string().min(1).optional(),
  })
  .optional();

export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const body = await request.json().catch(() => undefined);
    const parsed = bodySchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ message: "Dados inválidos", issues: parsed.error.format() }, { status: 400 });
    }

    await reenviarNotaFiscalEmail({
      chaveAcesso: id,
      ambiente: parsed.data?.ambiente,
      certificateId: parsed.data?.certificateId,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleRouteError(error, "Erro ao reenviar e-mail da NFSe");
  }
}
