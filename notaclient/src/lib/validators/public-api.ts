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
  dps: publicDpsCreateSchema.omit({ tomadorId: true }).extend({
    observacoes: publicDpsCreateSchema.shape.observacoes.optional(),
  }),
});

export type PublicTomadorCreateInput = z.infer<typeof publicTomadorCreateSchema>;
export type PublicDpsCreateInput = z.infer<typeof publicDpsCreateSchema>;
export type PublicTomadorWithDpsInput = z.infer<typeof publicTomadorWithDpsSchema>;
