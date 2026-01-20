export function formatCpfCnpj(value?: string | null): string {
  if (!value) {
    return "-";
  }

  const digits = value.replace(/\D/g, "");

  if (digits.length === 11) {
    return digits.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
  }

  if (digits.length === 14) {
    return digits.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, "$1.$2.$3/$4-$5");
  }

  return value;
}

export function formatInscricaoMunicipal(value?: string | null): string {
  if (!value) return "-";

  return value.replace(/\D/g, "");
}

export function formatPhone(value?: string | null): string {
  if (!value) return "-";

  const digits = value.replace(/\D/g, "");

  if (digits.length === 10) {
    return digits.replace(/(\d{2})(\d{4})(\d{4})/, "($1) $2-$3");
  }

  if (digits.length === 11) {
    return digits.replace(/(\d{2})(\d{1})(\d{4})(\d{4})/, "($1) $2 $3-$4");
  }

  return value;
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 2,
  }).format(value);
}
