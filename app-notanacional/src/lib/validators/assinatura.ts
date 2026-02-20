import { z } from "zod";

const dateSchema = z
  .union([z.date(), z.string()])
  .transform((value) => {
    if (value instanceof Date) {
      return value.toISOString().split('T')[0];
    }
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      throw new Error("Data inválida");
    }
    return date.toISOString().split('T')[0];
  });

const nullableDateSchema = z
  .union([z.date(), z.string(), z.null(), z.undefined()])
  .transform((value) => {
    if (value == null || value === "") {
      return null;
    }
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return null;
    }
    return date.toISOString().split('T')[0];
  });

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

const numberSchema = z
  .union([z.number(), z.string()])
  .transform((value) => normalizeNumber(value))
  .refine((value) => !Number.isNaN(value), {
    message: "Valor inválido",
  })
  .refine((value) => value >= 0, {
    message: "Valor deve ser maior ou igual a zero",
  });

export const assinaturaBaseSchema = z.object({
  clienteId: z.string().uuid("ID do cliente inválido"),
  intervalo: z.enum(["SEMANAL", "QUINZENAL", "MENSAL", "BIMESTRAL", "TRIMESTRAL", "SEMESTRAL", "ANUAL"]),
  descricao: z
    .string()
    .min(1, "Informe a descrição do serviço")
    .max(1000, "A descrição deve ter no máximo 1000 caracteres")
    .transform((value) => sanitizeString(value) as string),
  valor: numberSchema,
  vencimentoInicial: dateSchema,
  dataFim: nullableDateSchema,
});

export const assinaturaCreateSchema = assinaturaBaseSchema;

export const assinaturaUpdateSchema = assinaturaBaseSchema.partial().extend({
  ativo: z.boolean().optional(),
});

export type AssinaturaCreateInput = z.infer<typeof assinaturaCreateSchema>;
export type AssinaturaUpdateInput = z.infer<typeof assinaturaUpdateSchema>;
