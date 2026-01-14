import { z } from "zod";

import { tomadorCreateSchema } from "./tomador";
import { dpsCreateSchema } from "./dps";

export const publicTomadorCreateSchema = tomadorCreateSchema;

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
