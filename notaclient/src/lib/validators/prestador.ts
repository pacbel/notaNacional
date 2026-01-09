import { z } from "zod";

const cnpjRegex = /^\d{14}$/;
const cepRegex = /^\d{8}$/;
const ufRegex = /^[A-Z]{2}$/;
const codigoMunicipioRegex = /^\d{7}$/;

export const prestadorBaseSchema = z.object({
  nomeFantasia: z.string().min(1, "Informe o nome fantasia"),
  razaoSocial: z.string().min(1, "Informe a razão social"),
  cnpj: z
    .string()
    .transform((value) => value.replace(/\D/g, ""))
    .refine((value) => cnpjRegex.test(value), {
      message: "CNPJ inválido",
    }),
  inscricaoMunicipal: z
    .string()
    .transform((value) => value.trim())
    .optional()
    .or(z.literal(""))
    .transform((value) => (value === "" ? null : value)),
  email: z.string().email("E-mail inválido"),
  telefone: z
    .string()
    .transform((value) => value.replace(/\D/g, ""))
    .optional()
    .or(z.literal(""))
    .transform((value) => (value === "" ? null : value)),
  codigoMunicipio: z
    .string()
    .transform((value) => value.replace(/\D/g, ""))
    .refine((value) => codigoMunicipioRegex.test(value), {
      message: "Código do município deve conter 7 dígitos",
    }),
  cidade: z.string().min(1, "Informe a cidade"),
  estado: z
    .string()
    .transform((value) => value.toUpperCase())
    .refine((value) => ufRegex.test(value), {
      message: "UF inválida",
    }),
  cep: z
    .string()
    .transform((value) => value.replace(/\D/g, ""))
    .refine((value) => cepRegex.test(value), {
      message: "CEP inválido",
    }),
  logradouro: z.string().min(1, "Informe o logradouro"),
  numero: z.string().min(1, "Informe o número"),
  complemento: z
    .string()
    .optional()
    .or(z.literal(""))
    .transform((value) => (value === "" ? null : value)),
  bairro: z.string().min(1, "Informe o bairro"),
  observacoes: z
    .string()
    .optional()
    .or(z.literal(""))
    .transform((value) => (value === "" ? null : value)),
});

export const prestadorCreateSchema = prestadorBaseSchema;

export const prestadorUpdateSchema = prestadorBaseSchema.partial().extend({
  ativo: z.boolean().optional(),
});

export type PrestadorCreateInput = z.infer<typeof prestadorCreateSchema>;
export type PrestadorUpdateInput = z.infer<typeof prestadorUpdateSchema>;
