import { z } from "zod";

const cpfRegex = /^\d{11}$/;
const cnpjRegex = /^\d{14}$/;
const cepRegex = /^\d{8}$/;
const ufRegex = /^[A-Z]{2}$/;
const codigoMunicipioRegex = /^\d{7}$/;

export const tomadorBaseSchema = z
  .object({
    tipoDocumento: z.enum(["CPF", "CNPJ"]),
    documento: z.string().transform((value) => value.replace(/\D/g, "")),
    nomeRazaoSocial: z.string().min(1, "Informe o nome ou razão social"),
    email: z.string().email("E-mail inválido"),
    telefone: z
      .string()
      .transform((value) => value.replace(/\D/g, ""))
      .optional()
      .or(z.literal(""))
      .transform((value) => (value === "" ? null : value)),
    inscricaoMunicipal: z
      .string()
      .transform((value) => value.trim())
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
  })
  .superRefine((data, ctx) => {
    const digits = data.documento;
    const valido = data.tipoDocumento === "CPF" ? cpfRegex.test(digits) : cnpjRegex.test(digits);
    if (!valido) {
      ctx.addIssue({
        path: ["documento"],
        code: z.ZodIssueCode.custom,
        message: "Documento inválido para o tipo selecionado",
      });
    }
  });

export const tomadorCreateSchema = tomadorBaseSchema;

export const tomadorUpdateSchema = tomadorBaseSchema.partial().extend({
  ativo: z.boolean().optional(),
});

export type TomadorCreateInput = z.infer<typeof tomadorCreateSchema>;
export type TomadorUpdateInput = z.infer<typeof tomadorUpdateSchema>;
