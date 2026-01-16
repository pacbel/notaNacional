import { z } from "zod";

const ambienteValues = ["PRODUCAO", "HOMOLOGACAO"] as const;

export const tribMunSchema = z.object({
  tribISSQN: z.number().int().min(0).max(9),
  tpImunidade: z.number().int().min(0).max(9),
  tpRetISSQN: z.number().int().min(0).max(9),
});

export const totTribSchema = z.object({
  pTotTribFed: z.number().min(0).optional().nullable(),
  pTotTribEst: z.number().min(0).optional().nullable(),
  pTotTribMun: z.number().min(0).optional().nullable(),
});

export const configuracaoUpdateSchema = z.object({
  nomeSistema: z.string().min(1),
  versaoAplicacao: z.string().min(1),
  ambientePadrao: z.enum(ambienteValues),
  seriePadrao: z.number().int().min(1),
  numeroInicialDps: z.number().int().min(1),
  verAplic: z.string().min(1),
  emailRemetente: z.string().email().nullable(),
  robotClientId: z.string().min(1).nullable(),
  robotClientSecret: z.string().min(1).nullable(),
  robotTokenCacheMinutos: z.number().int().min(1),
  mfaCodigoExpiracaoMinutos: z.number().int().min(1),
  enviarNotificacaoEmailPrestador: z.boolean(),
  ativo: z.boolean(),
  xLocEmi: z.string().min(1),
  xLocPrestacao: z.string().min(1),
  nNFSe: z.string().min(1),
  xTribNac: z.string().min(1),
  xNBS: z.string().min(1),
  tpAmb: z.number().int().min(1).max(2),
  opSimpNac: z.number().int().min(1).max(3),
  regEspTrib: z.number().int().min(0).max(6),
  ambGer: z.number().int().min(0).max(9),
  tpEmis: z.number().int().min(0).max(9),
  procEmi: z.number().int().min(0).max(9),
  cStat: z.number().int().min(0),
  dhProc: z.string().datetime().nullable(),
  nDFSe: z.string().min(1),
  tribMun: tribMunSchema,
  totTrib: totTribSchema,
});

export type ConfiguracaoFormValues = z.infer<typeof configuracaoUpdateSchema>;

export type ConfiguracaoDto = ConfiguracaoFormValues & {
  updatedAt?: string;
};
