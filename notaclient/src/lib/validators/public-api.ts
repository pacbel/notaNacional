import { z } from "zod";

import { tomadorCreateSchema } from "./tomador";
import { dpsCreateSchema } from "./dps";

// API pública requer prestadorId explícito
export const publicTomadorCreateSchema = tomadorCreateSchema.extend({
  prestadorId: z.string().uuid({ message: "Prestador inválido" }),
});

export const publicDpsCreateSchema = dpsCreateSchema;

export const publicTomadorWithDpsSchema = z.object({
  tomador: publicTomadorCreateSchema,
  dps: z
    .object({
      prestadorId: publicDpsCreateSchema.shape.prestadorId,
      tomadorId: publicDpsCreateSchema.shape.tomadorId.optional(),
      servicoId: publicDpsCreateSchema.shape.servicoId,
      competencia: publicDpsCreateSchema.shape.competencia,
      dataEmissao: publicDpsCreateSchema.shape.dataEmissao,
      tipoEmissao: publicDpsCreateSchema.shape.tipoEmissao,
      tomadorNaoIdentificado: publicDpsCreateSchema.shape.tomadorNaoIdentificado,
      observacoes: publicDpsCreateSchema.shape.observacoes.optional(),
    })
    .superRefine((data, ctx) => {
      const tomadorObrigatorio = !(data.tomadorNaoIdentificado ?? false);

      if (tomadorObrigatorio) {
        ctx.addIssue({
          path: ["tomadorNaoIdentificado"],
          code: z.ZodIssueCode.custom,
          message: "Informe o tomador ou marque como não identificado",
        });
      }
    }),
});

export const publicProcessDpsSchema = z.object({
  prestadorId: z.string().uuid({ message: "Prestador inválido" }),
  dpsIds: z.array(z.string().uuid({ message: "DPS inválida" })).min(1, "Informe ao menos uma DPS").optional(),
  certificateId: z.string().optional(),
  ambiente: z.number().int().min(1).max(2).optional(),
  tag: z.string().min(1).optional(),
});

export type PublicTomadorCreateInput = z.infer<typeof publicTomadorCreateSchema>;
export type PublicDpsCreateInput = z.infer<typeof publicDpsCreateSchema>;
export type PublicTomadorWithDpsInput = z.infer<typeof publicTomadorWithDpsSchema>;
export type PublicProcessDpsInput = z.infer<typeof publicProcessDpsSchema>;
