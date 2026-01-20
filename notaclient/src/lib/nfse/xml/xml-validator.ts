import fs from "fs/promises";
import path from "path";
import { validateDpsXsdRules, formatValidationResult } from "./xsd-validator";

/**
 * Salva o XML gerado em arquivo para análise
 */
export async function saveXmlToFile(
  xml: string,
  filename: string,
  subfolder = "debug"
): Promise<string> {
  try {
    const debugDir = path.join(process.cwd(), "xml-debug", subfolder);
    await fs.mkdir(debugDir, { recursive: true });

    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const fullFilename = `${timestamp}_${filename}.xml`;
    const filepath = path.join(debugDir, fullFilename);

    await fs.writeFile(filepath, xml, "utf-8");

    console.log(`[XML Debug] XML salvo em: ${filepath}`);
    return filepath;
  } catch (error) {
    console.error("[XML Debug] Erro ao salvar XML:", error);
    throw error;
  }
}

/**
 * Valida se o XML está bem formado (validação básica)
 */
export function validateXmlWellFormed(xml: string): {
  valid: boolean;
  error?: string;
} {
  try {
    // Conta tags de abertura (excluindo auto-fechadas e declarações)
    const allOpenTags = xml.match(/<[^/!?][^>]*>/g) || [];
    
    // Identifica tags auto-fechadas (que terminam com />)
    const selfClosingTags = xml.match(/<[^/!?][^>]*\/>/g) || [];
    
    // Tags de abertura que precisam de fechamento
    const openTags = allOpenTags.filter(tag => !tag.endsWith('/>'));
    
    // Tags de fechamento
    const closeTags = xml.match(/<\/[^>]+>/g) || [];
    
    // Declarações XML e comentários (não precisam de fechamento)
    const declarations = xml.match(/<\?[^>]+\?>/g) || [];
    const comments = xml.match(/<!--[\s\S]*?-->/g) || [];
    
    if (openTags.length !== closeTags.length) {
      return {
        valid: false,
        error: `Número de tags de abertura (${openTags.length}) não corresponde ao de fechamento (${closeTags.length}). Tags auto-fechadas: ${selfClosingTags.length}`,
      };
    }

    // Verifica se há caracteres inválidos antes da declaração XML
    if (xml.trim().startsWith('<?xml') && xml.indexOf('<?xml') > 0) {
      return {
        valid: false,
        error: "Declaração XML deve estar no início do documento",
      };
    }

    return { valid: true };
  } catch (error) {
    return {
      valid: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Extrai informações importantes do XML para análise
 */
export function extractXmlInfo(xml: string): {
  hasXmlDeclaration: boolean;
  rootElement: string | null;
  infDpsId: string | null;
  dpsVersion: string | null;
  hasNamespace: boolean;
  length: number;
} {
  const hasXmlDeclaration = xml.startsWith('<?xml');
  
  // Extrai elemento raiz
  const rootMatch = xml.match(/<(\w+)[\s>]/);
  const rootElement = rootMatch ? rootMatch[1] : null;

  // Extrai Id do infDPS
  const idMatch = xml.match(/Id="([^"]+)"/);
  const infDpsId = idMatch ? idMatch[1] : null;

  // Extrai versão
  const versionMatch = xml.match(/versao="([^"]+)"/);
  const dpsVersion = versionMatch ? versionMatch[1] : null;

  // Verifica namespace
  const hasNamespace = xml.includes('xmlns=');

  return {
    hasXmlDeclaration,
    rootElement,
    infDpsId,
    dpsVersion,
    hasNamespace,
    length: xml.length,
  };
}

/**
 * Valida estrutura básica do DPS
 */
export function validateDpsStructure(xml: string): {
  valid: boolean;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Validações básicas
  if (!xml.startsWith('<?xml')) {
    warnings.push("XML não possui declaração <?xml>");
  }

  if (!xml.includes('<DPS')) {
    errors.push("Elemento raiz <DPS> não encontrado");
  }

  if (!xml.includes('<infDPS')) {
    errors.push("Elemento <infDPS> não encontrado");
  }

  // Valida Id do infDPS (deve ter 45 caracteres)
  const idMatch = xml.match(/Id="([^"]+)"/);
  if (idMatch) {
    const id = idMatch[1];
    if (id.length !== 45) {
      errors.push(`Id do infDPS deve ter 45 caracteres, encontrado: ${id.length}`);
    }
    if (!id.startsWith('DPS')) {
      errors.push(`Id do infDPS deve começar com 'DPS', encontrado: ${id.substring(0, 3)}`);
    }
  } else {
    errors.push("Atributo Id não encontrado no infDPS");
  }

  // Valida versão
  const versionMatch = xml.match(/versao="([^"]+)"/);
  if (versionMatch) {
    const version = versionMatch[1];
    if (version !== "1.00" && version !== "1.01") {
      warnings.push(`Versão do DPS é ${version}, esperado 1.00 ou 1.01`);
    }
  }

  // Valida elementos obrigatórios
  const requiredElements = [
    'tpAmb',
    'dhEmi',
    'verAplic',
    'serie',
    'nDPS',
    'dCompet',
    'tpEmit',
    'cLocEmi',
    'prest',
    'toma',
    'serv',
    'valores',
  ];

  for (const element of requiredElements) {
    if (!xml.includes(`<${element}>`)) {
      errors.push(`Elemento obrigatório <${element}> não encontrado`);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Cria um relatório completo de análise do XML
 */
export function analyzeXml(xml: string, label = "DPS"): void {
  console.log(`\n========== Análise do XML: ${label} ==========`);

  // Informações básicas
  const info = extractXmlInfo(xml);
  console.log("\n[Informações Básicas]");
  console.log(`  Declaração XML: ${info.hasXmlDeclaration ? "✓" : "✗"}`);
  console.log(`  Elemento Raiz: ${info.rootElement || "N/A"}`);
  console.log(`  Versão: ${info.dpsVersion || "N/A"}`);
  console.log(`  Namespace: ${info.hasNamespace ? "Sim" : "Não"}`);
  console.log(`  Id infDPS: ${info.infDpsId || "N/A"}`);
  console.log(`  Tamanho: ${info.length} caracteres`);

  // Validação de estrutura
  const wellFormed = validateXmlWellFormed(xml);
  console.log(`\n[XML Bem Formado]`);
  console.log(`  Status: ${wellFormed.valid ? "✓ Válido" : "✗ Inválido"}`);
  if (!wellFormed.valid) {
    console.log(`  Erro: ${wellFormed.error}`);
  }

  // Validação de estrutura DPS
  const structure = validateDpsStructure(xml);
  console.log(`\n[Estrutura DPS]`);
  console.log(`  Status: ${structure.valid ? "✓ Válida" : "✗ Inválida"}`);
  
  if (structure.errors.length > 0) {
    console.log(`\n  Erros (${structure.errors.length}):`);
    structure.errors.forEach((err, i) => {
      console.log(`    ${i + 1}. ${err}`);
    });
  }

  if (structure.warnings.length > 0) {
    console.log(`\n  Avisos (${structure.warnings.length}):`);
    structure.warnings.forEach((warn, i) => {
      console.log(`    ${i + 1}. ${warn}`);
    });
  }

  // Validação XSD
  const xsdValidation = validateDpsXsdRules(xml);
  console.log(formatValidationResult(xsdValidation));

  console.log("\n" + "=".repeat(50) + "\n");
}
