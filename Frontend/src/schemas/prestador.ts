import { z } from "zod";

export const prestadorSchema = z.object({
  cnpj: z
    .string()
    .min(14, "CNPJ deve conter 14 dígitos")
    .max(14, "CNPJ deve conter 14 dígitos"),
  razaoSocial: z.string().min(3, "Informe a razão social"),
  nomeFantasia: z.string().min(3, "Informe o nome fantasia"),
  inscricaoMunicipal: z
    .string()
    .min(3, "Informe ao menos 3 caracteres")
    .optional()
    .or(z.literal("")),
  inscricaoEstadual: z.string().optional().or(z.literal("")),
  telefone: z.string().optional().or(z.literal("")),
  email: z.string().email("Informe um e-mail válido").optional().or(z.literal("")),
  website: z.string().url("Informe uma URL válida").optional().or(z.literal("")),
  endereco: z.object({
    logradouro: z.string().min(3, "Informe o logradouro"),
    numero: z.string().min(1, "Informe o número"),
    complemento: z.string().optional().or(z.literal("")),
    bairro: z.string().min(2, "Informe o bairro"),
    cidade: z.string().optional().or(z.literal("")),
    codigoMunicipioIbge: z
      .string()
      .min(7, "Código IBGE deve conter 7 dígitos")
      .max(7, "Código IBGE deve conter 7 dígitos"),
    uf: z
      .string()
      .max(2, "UF deve conter 2 caracteres")
      .optional()
      .or(z.literal("")),
    cep: z.string().min(8, "CEP deve conter 8 dígitos").max(8).optional().or(z.literal("")),
  }),
});

export type PrestadorSchema = typeof prestadorSchema;
export type PrestadorFormValues = z.infer<typeof prestadorSchema>;
