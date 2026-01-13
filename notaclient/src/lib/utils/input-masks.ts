export function normalizeCep(value: string): string {
  return value.replace(/\D/g, "").slice(0, 8);
}

export function formatCepInput(value: string): string {
  const digits = normalizeCep(value);

  if (digits.length <= 5) {
    return digits;
  }

  return `${digits.slice(0, 5)}-${digits.slice(5)}`;
}

export function normalizePhone(value: string): string {
  return value.replace(/\D/g, "").slice(0, 11);
}

export function formatPhoneInput(value: string): string {
  const digits = normalizePhone(value);

  if (digits.length === 0) {
    return "";
  }

  const ddd = digits.slice(0, 2);

  if (digits.length <= 2) {
    return `(${ddd}`;
  }

  if (digits.length <= 7) {
    return `(${ddd}) ${digits.slice(2)}`;
  }

  if (digits.length <= 10) {
    return `(${ddd}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  }

  return `(${ddd}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

export function normalizeDocumento(value: string, tipo: "CPF" | "CNPJ"): string {
  const limit = tipo === "CPF" ? 11 : 14;
  return value.replace(/\D/g, "").slice(0, limit);
}

export function formatDocumentoInput(value: string, tipo: "CPF" | "CNPJ"): string {
  const digits = normalizeDocumento(value, tipo);

  if (tipo === "CPF") {
    if (digits.length <= 3) {
      return digits;
    }

    if (digits.length <= 6) {
      return `${digits.slice(0, 3)}.${digits.slice(3)}`;
    }

    if (digits.length <= 9) {
      return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
    }

    return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
  }

  if (digits.length <= 2) {
    return digits;
  }

  if (digits.length <= 5) {
    return `${digits.slice(0, 2)}.${digits.slice(2)}`;
  }

  if (digits.length <= 8) {
    return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5)}`;
  }

  if (digits.length <= 12) {
    return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8)}`;
  }

  return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8, 12)}-${digits.slice(12)}`;
}
