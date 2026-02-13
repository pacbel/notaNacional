import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { handleRouteError } from "@/lib/http";
import { validateAgainstXsd } from "@/lib/nfse/xml/xsd-runtime-validator";

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const dpsId: string | undefined = body?.dpsId;
    const xmlProvided: string | undefined = body?.xml;

    let xmlToValidate = xmlProvided?.trim();

    if (!xmlToValidate) {
      if (!dpsId) {
        return NextResponse.json({ message: "Informe 'dpsId' ou 'xml'" }, { status: 400 });
      }

      const dps = await prisma.dps.findUnique({ where: { id: dpsId } });

      if (!dps) {
        return NextResponse.json({ message: "DPS não encontrada" }, { status: 404 });
      }

      xmlToValidate = dps.xmlAssinado?.trim() || dps.xmlGerado?.trim() || undefined;

      if (!xmlToValidate) {
        return NextResponse.json({ message: "DPS não possui XML para validar" }, { status: 400 });
      }
    }

    const result = await validateAgainstXsd(xmlToValidate);

    return NextResponse.json({
      valid: result.valid,
      engine: result.engine,
      errors: result.errors,
      warnings: result.warnings,
      report: result.report,
    });
  } catch (error) {
    return handleRouteError(error, "Erro ao validar XML contra XSD");
  }
}
