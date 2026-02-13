import { NextResponse } from "next/server";

import { handleRouteError } from "@/lib/http";
import {
  assinarDps,
  assinarDpsSchema,
  emitirNotaFiscal,
  emitirNfseSchema,
  obterCertificados,
} from "@/lib/nfse/service";

export async function GET() {
  try {
    const certificados = await obterCertificados();

    return NextResponse.json(certificados);
  } catch (error) {
    return handleRouteError(error, "Erro ao listar certificados");
  }
}

export async function POST(request: Request) {
  try {
    const payload = await request.json().catch(() => null);
    const parseResult = assinarDpsSchema.safeParse(payload);

    if (!parseResult.success) {
      return NextResponse.json({ message: "Dados inválidos", issues: parseResult.error.format() }, { status: 400 });
    }

    const response = await assinarDps(parseResult.data);

    return NextResponse.json({ xmlAssinado: response });
  } catch (error) {
    return handleRouteError(error, "Erro ao assinar DPS");
  }
}

export async function PUT(request: Request) {
  try {
    const payload = await request.json().catch(() => null);
    const parseResult = emitirNfseSchema.safeParse(payload);

    if (!parseResult.success) {
      return NextResponse.json({ message: "Dados inválidos", issues: parseResult.error.format() }, { status: 400 });
    }

    const response = await emitirNotaFiscal(parseResult.data);

    return NextResponse.json(response);
  } catch (error) {
    return handleRouteError(error, "Erro ao emitir NFSe");
  }
}
