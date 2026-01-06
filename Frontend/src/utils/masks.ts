export function onlyDigits(value: string): string {
  return value.replace(/\D+/g, "");
}

function applyPattern(value: string, pattern: string): string {
  let index = 0;
  return pattern
    .split("")
    .map((char) => {
      if (char !== "#") {
        return char;
      }

      const digit = value[index];
      index += 1;
      return digit ?? "";
    })
    .join("")
    .replace(/([\.-\/ ])+$/g, "");
}

export function formatCnpj(value: string): string {
  const digits = onlyDigits(value).slice(0, 14);
  return applyPattern(digits, "##.###.###/####-##");
}

export function formatCep(value: string): string {
  const digits = onlyDigits(value).slice(0, 8);
  return applyPattern(digits, "#####-###");
}

function formatGrouped(value: string, groupSize: number): string {
  const digits = onlyDigits(value);
  const limited = digits.slice(0, 15);
  const regex = new RegExp(`\\B(?=(\\d{${groupSize}})+(?!\\d))`, "g");
  return limited.replace(regex, ".");
}

export function formatInscricaoEstadual(value: string): string {
  return formatGrouped(value, 3);
}

export function formatInscricaoMunicipal(value: string): string {
  return formatGrouped(value, 3);
}

export function formatTelefone(value: string): string {
  const digits = onlyDigits(value).slice(0, 11);
  if (digits.length <= 10) {
    return applyPattern(digits, "(##) ####-####");
  }

  return applyPattern(digits, "(##) #####-####");
}
