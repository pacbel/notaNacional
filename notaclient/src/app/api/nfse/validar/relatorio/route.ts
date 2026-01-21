import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { validateAgainstXsd } from "@/lib/nfse/xml/xsd-runtime-validator";

function escapeHtml(value: string) {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const dpsId = searchParams.get("dpsId") ?? undefined;
  const xml = searchParams.get("xml") ?? undefined;

  try {
    let xmlToValidate = xml?.trim();

    if (!xmlToValidate) {
      if (!dpsId) {
        return new NextResponse("Parâmetro 'dpsId' ou 'xml' é obrigatório", {
          status: 400,
          headers: { "Content-Type": "text/plain; charset=utf-8" },
        });
      }

      const dps = await prisma.dps.findUnique({ where: { id: dpsId } });
      if (!dps) {
        return new NextResponse("DPS não encontrada", {
          status: 404,
          headers: { "Content-Type": "text/plain; charset=utf-8" },
        });
      }

      xmlToValidate = dps.xmlAssinado?.trim() || dps.xmlGerado?.trim() || undefined;
      if (!xmlToValidate) {
        return new NextResponse("DPS não possui XML para validar", {
          status: 400,
          headers: { "Content-Type": "text/plain; charset=utf-8" },
        });
      }
    }

    const result = await validateAgainstXsd(xmlToValidate);

    const title = result.valid
      ? result.warnings.length > 0
        ? "XML válido com avisos"
        : "XML válido"
      : "XML inválido";

    const lines: string[] = [];
    lines.push(`Engine: ${result.engine}`);
    if (result.errors.length > 0) {
      lines.push("\nErros:");
      result.errors.forEach((e, i) => {
        lines.push(`  ${i + 1}. ${e.field ? `[${e.field}] ` : ""}${e.message}${e.value ? ` (valor: ${e.value})` : ""}`);
      });
    }
    if (result.warnings.length > 0) {
      lines.push("\nAvisos:");
      result.warnings.forEach((w, i) => lines.push(`  ${i + 1}. ${w}`));
    }
    if (result.report) {
      lines.push("\nRelatório:\n" + result.report);
    }

    const safeTitle = escapeHtml(title);
    const safeReport = escapeHtml(lines.join("\n"));

    const html = [
      "<!doctype html>",
      "<html>",
      "<head>",
      '<meta charset="utf-8">',
      `<title>Validação XSD - ${safeTitle}</title>`,
      '<meta name="viewport" content="width=device-width, initial-scale=1">',
      '<style>body{font-family:ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace; padding:16px; white-space:pre-wrap;} h1{font-size:16px; margin:0 0 12px} .meta{color:#666; margin-bottom:12px} .ok{color:#0a0} .warn{color:#a60} .err{color:#c00}</style>',
      "</head>",
      "<body>",
      `<h1 class="${result.valid ? (result.warnings.length ? 'warn' : 'ok') : 'err'}">${safeTitle}</h1>`,
      `<div class="meta">${result.valid ? "Documento compatível com o XSD" : "Foram encontrados problemas de esquema"}</div>`,
      `<pre>${safeReport}</pre>`,
      "</body>",
      "</html>",
    ].join("");

    return new NextResponse(html, { status: 200, headers: { "Content-Type": "text/html; charset=utf-8" } });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return new NextResponse(`Erro ao validar: ${message}`, { status: 500, headers: { "Content-Type": "text/plain; charset=utf-8" } });
  }
}
