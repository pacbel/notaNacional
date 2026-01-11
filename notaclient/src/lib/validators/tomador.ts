import { z } from "zod";

const cpfRegex = /^\d{11}$/;
const cnpjRegex = /^\d{14}$/;
const cepRegex = /^\d{8}$/;
const ufRegex = /^[A-Z]{2}$/;
const codigoMunicipioRegex = /^\d{7}$/;

const tomadorFieldsSchema = z.object({
  tipoDocumento: z.enum(["CPF", "CNPJ"]),
  documento: z.string().transform((value) => value.replace(/\D/g, "")),
  nomeRazaoSocial: z.string().min(1, "Informe o nome ou razão social"),
  email: z.string().email("E-mail inválido"),
  telefone: z
    .string()
    .optional()
    .or(z.literal(""))
    .transform((value) => {
      if (!value) {
        return undefined;
      }

      const digits = value.replace(/\D/g, "");
      return digits === "" ? undefined : digits;
    }),
  inscricaoMunicipal: z
    .string()
    .optional()
    .or(z.literal(""))
    .transform((value) => {
      if (!value) {
        return undefined;
      }

      const trimmed = value.trim();
      return trimmed === "" ? undefined : trimmed;
    }),
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
    .transform((value) => {
      if (!value) {
        return undefined;
      }

      const trimmed = value.trim();
      return trimmed === "" ? undefined : trimmed;
    }),
  bairro: z.string().min(1, "Informe o bairro"),
});

function withDocumentoValidation<T extends z.ZodTypeAny>(schema: T) {
  return schema.superRefine((data, ctx) => {
    const documento = (data as { documento?: string | null })?.documento;
    const tipoDocumento = (data as { tipoDocumento?: "CPF" | "CNPJ" | undefined })?.tipoDocumento;

    if (!documento || !tipoDocumento) {
      return;
    }

    const valido = tipoDocumento === "CPF" ? cpfRegex.test(documento) : cnpjRegex.test(documento);

    if (!valido) {
      ctx.addIssue({
        path: ["documento"],
        code: z.ZodIssueCode.custom,
        message: "Documento inválido para o tipo selecionado",
      });
    }
  });
}

export const tomadorBaseSchema = withDocumentoValidation(tomadorFieldsSchema);

export const tomadorCreateSchema = tomadorBaseSchema;

export const tomadorUpdateSchema = withDocumentoValidation(tomadorFieldsSchema.partial()).extend({
  ativo: z.boolean().optional(),
});

export type TomadorFormValues = z.input<typeof tomadorCreateSchema>;
export type TomadorCreateInput = z.infer<typeof tomadorCreateSchema>;
export type TomadorUpdateInput = z.infer<typeof tomadorUpdateSchema>;
