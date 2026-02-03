import { z } from "zod";

export const dpsCreateSchema = z
  .object({
    prestadorId: z.string().uuid({ message: "Prestador inválido" }),
    tomadorId: z
      .string()
      .uuid({ message: "Tomador inválido" })
      .nullable()
      .optional()
      .or(z.literal(""))
      .transform((value) => (value === "" ? null : value)),
    tomadorNaoIdentificado: z.boolean().optional(),
    servicoId: z.string().uuid({ message: "Serviço inválido" }),
    competencia: z.string().datetime({ message: "Competência inválida" }),
    dataEmissao: z.string().datetime({ message: "Data de emissão inválida" }),
    tipoEmissao: z.number().int().min(0).max(9).default(1),
    observacoes: z.union([z.string(), z.literal("")]).optional(),
  })
  .superRefine((data, ctx) => {
    if (data.tomadorNaoIdentificado === false && !data.tomadorId) {
      ctx.addIssue({
        path: ["tomadorId"],
        code: z.ZodIssueCode.custom,
        message: "Selecione um tomador ou marque como não identificado",
      });
    }
  });

export type DpsCreateInput = z.infer<typeof dpsCreateSchema>;
