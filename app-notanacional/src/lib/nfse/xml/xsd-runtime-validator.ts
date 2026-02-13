import fs from "fs/promises";
import path from "path";
import { validateXmlWellFormed, validateDpsStructure } from "./xml-validator";
import { validateDpsXsdRules, formatValidationResult } from "./xsd-validator";

export interface XsdValidationError {
  field?: string;
  message: string;
  value?: string;
}

export interface XsdValidationResult {
  valid: boolean;
  errors: XsdValidationError[];
  warnings: string[];
  engine: "libxml" | "fallback";
  report?: string;
}

/**
 * Valida um XML de DPS contra os XSDs da pasta /esquemas.
 * Tenta usar libxml-xsd se disponível em runtime. Caso contrário, usa validações heurísticas existentes.
 */
export async function validateAgainstXsd(xml: string): Promise<XsdValidationResult> {
  // Caminho base dos XSDs
  const baseDir = path.join(process.cwd(), "esquemas");
  const mainSchema = path.join(baseDir, "DPS_v1.01.xsd");

  // 1) Sempre validar bem-formação e estrutura básica primeiro
  const wellFormed = validateXmlWellFormed(xml);
  if (!wellFormed.valid) {
    return {
      valid: false,
      errors: [{ message: wellFormed.error || "XML malformado" }],
      warnings: [],
      engine: "fallback",
    };
  }

  // 2) Tentar validação real via libxml-xsd (se pacote estiver instalado em runtime)
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const libxmlXsd = require("libxml-xsd") as {
      parseFile: (xsdPath: string) => Promise<{ validate: (xml: string) => { errors?: { message: string }[] } | null }>;
    };

    // Garante que o arquivo XSD principal existe
    await fs.access(mainSchema);

    const schema = await libxmlXsd.parseFile(mainSchema);
    const validation = schema.validate(xml);

    const engine: XsdValidationResult["engine"] = "libxml";

    if (!validation || !validation.errors || validation.errors.length === 0) {
      // Complementar com nossa validação estrutural para mensagens adicionais
      const structure = validateDpsStructure(xml);
      return {
        valid: structure.errors.length === 0,
        errors: structure.errors.map((msg) => ({ message: msg })),
        warnings: structure.warnings,
        engine,
      };
    }

    return {
      valid: false,
      errors: validation.errors.map((e: { message: string }) => ({ message: e.message })),
      warnings: [],
      engine,
    };
  } catch {
    // 3) Fallback: usar nossas regras heurísticas de XSD já existentes
    const xsd = validateDpsXsdRules(xml);
    const report = formatValidationResult(xsd);

    return {
      valid: xsd.valid,
      errors: xsd.errors.map((e) => ({ field: e.field, message: e.message, value: e.value })),
      warnings: xsd.warnings,
      engine: "fallback",
      report,
    };
  }
}
