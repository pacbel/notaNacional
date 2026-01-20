/**
 * Validador XSD para XMLs da SEFIN Nacional
 * 
 * Este módulo fornece validação básica de estrutura XML contra as regras
 * do schema da SEFIN Nacional para DPS (Declaração de Prestação de Serviços).
 */

interface ValidationError {
  field: string;
  message: string;
  value?: string;
}

interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: string[];
}

/**
 * Valida o XML DPS contra as regras do schema da SEFIN Nacional
 */
export function validateDpsXsdRules(xml: string): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: string[] = [];

  // Extrai valores do XML para validação
  const extractValue = (tag: string): string | null => {
    const match = xml.match(new RegExp(`<${tag}>([^<]+)</${tag}>`));
    return match ? match[1] : null;
  };

  const extractAttribute = (tag: string, attr: string): string | null => {
    const match = xml.match(new RegExp(`<${tag}[^>]*${attr}="([^"]+)"`));
    return match ? match[1] : null;
  };

  // 1. Validação do Id do infDPS (45 caracteres)
  const infDpsId = extractAttribute("infDPS", "Id");
  if (infDpsId) {
    if (infDpsId.length !== 45) {
      errors.push({
        field: "infDPS@Id",
        message: `Id deve ter exatamente 45 caracteres`,
        value: `${infDpsId.length} caracteres`,
      });
    }
    if (!infDpsId.startsWith("DPS")) {
      errors.push({
        field: "infDPS@Id",
        message: "Id deve começar com 'DPS'",
        value: infDpsId.substring(0, 3),
      });
    }
  } else {
    errors.push({
      field: "infDPS@Id",
      message: "Atributo Id é obrigatório",
    });
  }

  // 2. Validação da versão
  const versao = extractAttribute("DPS", "versao");
  if (versao) {
    if (!["1.00", "1.01"].includes(versao)) {
      warnings.push(`Versão ${versao} pode não ser suportada. Esperado: 1.00 ou 1.01`);
    }
  }

  // 3. Validação do tpAmb (1=Produção, 2=Homologação)
  const tpAmb = extractValue("tpAmb");
  if (tpAmb) {
    if (!["1", "2"].includes(tpAmb)) {
      errors.push({
        field: "tpAmb",
        message: "Tipo de ambiente deve ser 1 (Produção) ou 2 (Homologação)",
        value: tpAmb,
      });
    }
  } else {
    errors.push({ field: "tpAmb", message: "Campo obrigatório não encontrado" });
  }

  // 4. Validação do CNPJ (14 dígitos)
  const cnpjPrest = extractValue("CNPJ");
  if (cnpjPrest) {
    if (!/^\d{14}$/.test(cnpjPrest)) {
      errors.push({
        field: "prest/CNPJ",
        message: "CNPJ deve ter exatamente 14 dígitos numéricos",
        value: cnpjPrest,
      });
    }
  } else {
    errors.push({ field: "prest/CNPJ", message: "Campo obrigatório não encontrado" });
  }

  // 5. Validação da série (5 dígitos)
  const serie = extractValue("serie");
  if (serie) {
    if (!/^\d{5}$/.test(serie)) {
      errors.push({
        field: "serie",
        message: "Série deve ter exatamente 5 dígitos numéricos",
        value: serie,
      });
    }
  } else {
    errors.push({ field: "serie", message: "Campo obrigatório não encontrado" });
  }

  // 6. Validação do nDPS (15 dígitos)
  const nDPS = extractValue("nDPS");
  if (nDPS) {
    if (!/^\d{15}$/.test(nDPS)) {
      errors.push({
        field: "nDPS",
        message: "Número do DPS deve ter exatamente 15 dígitos numéricos",
        value: nDPS,
      });
    }
  } else {
    errors.push({ field: "nDPS", message: "Campo obrigatório não encontrado" });
  }

  // 7. Validação do código de município (7 dígitos)
  const cLocEmi = extractValue("cLocEmi");
  if (cLocEmi) {
    if (!/^\d{7}$/.test(cLocEmi)) {
      errors.push({
        field: "cLocEmi",
        message: "Código do município deve ter exatamente 7 dígitos",
        value: cLocEmi,
      });
    }
  } else {
    errors.push({ field: "cLocEmi", message: "Campo obrigatório não encontrado" });
  }

  // 8. Validação da data de competência (formato YYYY-MM-DD)
  const dCompet = extractValue("dCompet");
  if (dCompet) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dCompet)) {
      errors.push({
        field: "dCompet",
        message: "Data de competência deve estar no formato YYYY-MM-DD",
        value: dCompet,
      });
    }
  } else {
    errors.push({ field: "dCompet", message: "Campo obrigatório não encontrado" });
  }

  // 9. Validação da data/hora de emissão (formato ISO 8601)
  const dhEmi = extractValue("dhEmi");
  if (dhEmi) {
    if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}[+-]\d{2}:\d{2}$/.test(dhEmi)) {
      errors.push({
        field: "dhEmi",
        message: "Data/hora de emissão deve estar no formato ISO 8601 com timezone",
        value: dhEmi,
      });
    }
  } else {
    errors.push({ field: "dhEmi", message: "Campo obrigatório não encontrado" });
  }

  // 10. Validação de valores monetários (formato decimal com 2 casas)
  const vServ = extractValue("vServ");
  if (vServ) {
    if (!/^\d+\.\d{2}$/.test(vServ)) {
      warnings.push(`Valor do serviço (${vServ}) deve ter exatamente 2 casas decimais`);
    }
  } else {
    errors.push({ field: "valores/vServPrest/vServ", message: "Campo obrigatório não encontrado" });
  }

  // 11. Validação do código de tributação nacional
  const cTribNac = extractValue("cTribNac");
  if (cTribNac) {
    // SEFIN aceita apenas dígitos: 4 ou 6 dígitos sem pontos
    if (!/^\d{4}$|^\d{6}$/.test(cTribNac)) {
      warnings.push(`Código de tributação nacional (${cTribNac}) deve ter 4 ou 6 dígitos numéricos (ex: 0103 ou 010301)`);
    }
  } else {
    errors.push({ field: "serv/cServ/cTribNac", message: "Campo obrigatório não encontrado" });
  }

  // 12. Validação de elementos obrigatórios
  const requiredElements = [
    { tag: "tpEmit", name: "Tipo de emissão" },
    { tag: "verAplic", name: "Versão da aplicação" },
    { tag: "opSimpNac", name: "Opção pelo Simples Nacional" },
    { tag: "regEspTrib", name: "Regime especial de tributação" },
    { tag: "tribISSQN", name: "Tributação do ISSQN" },
    { tag: "tpRetISSQN", name: "Tipo de retenção do ISSQN" },
    { tag: "cLocPrestacao", name: "Código do local de prestação" },
    { tag: "cTribMun", name: "Código de tributação municipal" },
    { tag: "xDescServ", name: "Descrição do serviço" },
  ];

  for (const { tag, name } of requiredElements) {
    if (!xml.includes(`<${tag}>`)) {
      errors.push({
        field: tag,
        message: `${name} é obrigatório`,
      });
    }
  }

  // 13. Validação de namespace (não deve ter xmlns na versão 1.00)
  const hasXmlns = xml.includes('xmlns=');
  const version = extractAttribute("DPS", "versao");
  if (hasXmlns && version === "1.00") {
    warnings.push("Versão 1.00 não deve incluir namespace xmlns");
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Formata o resultado da validação para exibição
 */
export function formatValidationResult(result: ValidationResult): string {
  const lines: string[] = [];
  
  lines.push("\n========== Validação XSD ==========");
  lines.push(`Status: ${result.valid ? "✓ VÁLIDO" : "✗ INVÁLIDO"}`);
  
  if (result.errors.length > 0) {
    lines.push(`\nErros encontrados (${result.errors.length}):`);
    result.errors.forEach((error, i) => {
      lines.push(`  ${i + 1}. [${error.field}] ${error.message}`);
      if (error.value) {
        lines.push(`     Valor: ${error.value}`);
      }
    });
  }
  
  if (result.warnings.length > 0) {
    lines.push(`\nAvisos (${result.warnings.length}):`);
    result.warnings.forEach((warning, i) => {
      lines.push(`  ${i + 1}. ${warning}`);
    });
  }
  
  if (result.valid && result.warnings.length === 0) {
    lines.push("\n✓ XML está em conformidade com as regras do schema da SEFIN");
  }
  
  lines.push("=".repeat(35) + "\n");
  
  return lines.join("\n");
}
