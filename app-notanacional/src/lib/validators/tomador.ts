import { z } from "zod";

const codigoMunicipioRegex = /^\d{7}$/;
const cepRegex = /^\d{8}$/;
const ufRegex = /^[A-Z]{2}$/;

const tomadorTipoEnum = z.enum(["NACIONAL", "ESTRANGEIRO", "ANONIMO"]);

const trimmedString = () =>
  z
    .string()
    .optional()
    .or(z.literal(""))
    .transform((value) => {
      if (!value) {
        return undefined;
      }

      const trimmed = value.trim();
      return trimmed === "" ? undefined : trimmed;
    });

const digitsString = () =>
  z
    .string()
    .optional()
    .or(z.literal(""))
    .transform((value) => {
      if (!value) {
        return undefined;
      }

      const digits = value.replace(/\D/g, "");
      return digits === "" ? undefined : digits;
    });

const upperString = () =>
  trimmedString().transform((value) => (value ? value.toUpperCase() : undefined));

const baseTomadorSchema = z.object({
  tipoTomador: tomadorTipoEnum,
  tipoDocumento: z.enum(["CPF", "CNPJ"]).nullable().optional(),
  documento: trimmedString(),
  nomeRazaoSocial: z.string().min(1, "Informe o nome ou razão social"),
  email: z
    .string()
    .email("E-mail inválido")
    .transform((value) => value.toLowerCase()),
  telefone: digitsString(),
  inscricaoMunicipal: trimmedString(),
  codigoMunicipio: digitsString(),
  cidade: trimmedString(),
  estado: upperString(),
  cep: digitsString(),
  logradouro: trimmedString(),
  numero: trimmedString(),
  complemento: trimmedString(),
  bairro: trimmedString(),
  codigoPais: upperString(),
  codigoPostalExterior: trimmedString(),
  cidadeExterior: trimmedString(),
  estadoExterior: trimmedString(),
});

function validateTomador(data: z.infer<typeof baseTomadorSchema>, ctx: z.RefinementCtx) {
  if (data.tipoTomador === "NACIONAL") {
    if (!data.tipoDocumento) {
      ctx.addIssue({
        path: ["tipoDocumento"],
        code: z.ZodIssueCode.custom,
        message: "Selecione o tipo de documento",
      });
    }

    const documentoDigits = (data.documento ?? "").replace(/\D/g, "");
    if (data.tipoDocumento === "CPF" && documentoDigits.length !== 11) {
      ctx.addIssue({
        path: ["documento"],
        code: z.ZodIssueCode.custom,
        message: "CPF deve conter 11 dígitos",
      });
    }

    if (data.tipoDocumento === "CNPJ" && documentoDigits.length !== 14) {
      ctx.addIssue({
        path: ["documento"],
        code: z.ZodIssueCode.custom,
        message: "CNPJ deve conter 14 dígitos",
      });
    }

    data.tipoDocumento = data.tipoDocumento ?? null;
    data.documento = documentoDigits ? documentoDigits : undefined;

    if (!data.codigoMunicipio || !codigoMunicipioRegex.test(data.codigoMunicipio)) {
      ctx.addIssue({
        path: ["codigoMunicipio"],
        code: z.ZodIssueCode.custom,
        message: "Código do município deve conter 7 dígitos",
      });
    }

    if (!data.cidade) {
      ctx.addIssue({
        path: ["cidade"],
        code: z.ZodIssueCode.custom,
        message: "Informe a cidade",
      });
    }

    if (!data.estado || !ufRegex.test(data.estado)) {
      ctx.addIssue({
        path: ["estado"],
        code: z.ZodIssueCode.custom,
        message: "UF inválida",
      });
    }

    if (!data.cep || !cepRegex.test(data.cep)) {
      ctx.addIssue({
        path: ["cep"],
        code: z.ZodIssueCode.custom,
        message: "CEP inválido",
      });
    }

    if (!data.logradouro) {
      ctx.addIssue({
        path: ["logradouro"],
        code: z.ZodIssueCode.custom,
        message: "Informe o logradouro",
      });
    }

    if (!data.numero) {
      ctx.addIssue({
        path: ["numero"],
        code: z.ZodIssueCode.custom,
        message: "Informe o número",
      });
    }

    if (!data.bairro) {
      ctx.addIssue({
        path: ["bairro"],
        code: z.ZodIssueCode.custom,
        message: "Informe o bairro",
      });
    }

    data.codigoPais = undefined;
    data.codigoPostalExterior = undefined;
    data.cidadeExterior = undefined;
    data.estadoExterior = undefined;
  }

  if (data.tipoTomador === "ESTRANGEIRO") {
    data.tipoDocumento = null;

    const trimmedDocumento = data.documento?.trim() ?? "";
    if (!data.documento) {
      ctx.addIssue({
        path: ["documento"],
        code: z.ZodIssueCode.custom,
        message: "Informe o documento do tomador estrangeiro",
      });
    } else if (trimmedDocumento.length > 40) {
      ctx.addIssue({
        path: ["documento"],
        code: z.ZodIssueCode.custom,
        message: "Documento deve conter no máximo 40 caracteres",
      });
    }
    data.documento = trimmedDocumento ? trimmedDocumento : undefined;

    if (!data.codigoPais) {
      ctx.addIssue({
        path: ["codigoPais"],
        code: z.ZodIssueCode.custom,
        message: "Informe o código do país",
      });
    }

    if (!data.cidadeExterior) {
      ctx.addIssue({
        path: ["cidadeExterior"],
        code: z.ZodIssueCode.custom,
        message: "Informe a cidade no exterior",
      });
    }
  }
}

export const tomadorBaseSchema = baseTomadorSchema.superRefine(validateTomador);

export const tomadorCreateSchema = tomadorBaseSchema;

export const tomadorUpdateSchema = tomadorBaseSchema.extend({
  ativo: z.boolean().optional(),
});

export type TomadorFormValues = z.input<typeof tomadorCreateSchema>;
export type TomadorCreateInput = z.infer<typeof tomadorCreateSchema>;
export type TomadorUpdateInput = z.infer<typeof tomadorUpdateSchema>;
