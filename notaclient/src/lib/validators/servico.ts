import { z } from "zod";

const codigoMunicipioRegex = /^\d{7}$/;

function sanitizeString(value: unknown) {
  if (typeof value !== "string") {
    return value;
  }

  return value.trim();
}

function normalizeNumber(value: unknown) {
  if (typeof value === "number") {
    return value;
  }

  if (typeof value === "string") {
    const normalized = value.replace(/\s/g, "").replace(/\./g, "").replace(/,/g, ".");
    const parsed = Number(normalized);
    return Number.isNaN(parsed) ? Number.NaN : parsed;
  }

  return Number.NaN;
}

const nullableStringSchema = z
  .union([z.string(), z.null(), z.undefined()])
  .transform((value) => {
    if (value == null) {
      return null;
    }

    const sanitized = sanitizeString(value);

    if (typeof sanitized !== "string" || sanitized === "") {
      return null;
    }

    return sanitized;
  });

const nullableNumberSchema = z
  .union([z.number(), z.string(), z.null(), z.undefined()])
  .transform((value) => {
    if (value == null || value === "") {
      return null;
    }

    const parsed = normalizeNumber(value);

    if (Number.isNaN(parsed)) {
      return Number.NaN;
    }

    return parsed;
  })
  .refine((value) => value === null || !Number.isNaN(value), {
    message: "Valor inválido",
  })
  .refine((value) => value === null || value >= 0, {
    message: "Valor deve ser maior ou igual a zero",
  });

const numberSchema = z
  .union([z.number(), z.string()])
  .transform((value) => normalizeNumber(value))
  .refine((value) => !Number.isNaN(value), {
    message: "Valor inválido",
  })
  .refine((value) => value >= 0, {
    message: "Valor deve ser maior ou igual a zero",
  });

const codigoSchema = z
  .union([z.string(), z.null(), z.undefined()])
  .transform((value) => {
    if (value == null) {
      return null;
    }

    const sanitized = sanitizeString(value);

    if (typeof sanitized !== "string" || sanitized === "") {
      return null;
    }

    return sanitized;
  })
  .refine((value) => value === null || value.length <= 20, {
    message: "O código deve ter no máximo 20 caracteres",
  });

export const servicoBaseSchema = z.object({
  codigo: codigoSchema,
  descricao: z
    .string()
    .min(1, "Informe a descrição do serviço")
    .max(1000, "A descrição deve ter no máximo 1000 caracteres")
    .transform((value) => sanitizeString(value) as string),
  codigoTributacaoMunicipal: z
    .string()
    .min(1, "Informe o código de tributação municipal")
    .transform((value) => (sanitizeString(value) as string).toUpperCase()),
  codigoTributacaoNacional: z
    .string()
    .min(1, "Informe o código de tributação nacional")
    .transform((value) => (sanitizeString(value) as string).toUpperCase()),
  codigoNbs: nullableStringSchema,
  valorUnitario: numberSchema,
  aliquotaIss: nullableNumberSchema,
  issRetido: z.boolean(),
});

export const servicoCreateSchema = servicoBaseSchema;

export const servicoUpdateSchema = servicoBaseSchema.partial().extend({
  ativo: z.boolean().optional(),
});

export type ServicoCreateInput = z.infer<typeof servicoCreateSchema>;
export type ServicoUpdateInput = z.infer<typeof servicoUpdateSchema>;
