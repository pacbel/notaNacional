import { Prisma, DpsStatus } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { AppError } from "@/lib/errors";
import {
  type PublicTomadorCreateInput,
  type PublicDpsCreateInput,
  type PublicTomadorWithDpsInput,
  type PublicProcessDpsInput,
  publicTomadorCreateSchema,
  publicDpsCreateSchema,
  publicTomadorWithDpsSchema,
  publicProcessDpsSchema,
} from "@/lib/validators/public-api";
import {
  createDps,
  assinarDps,
  emitirNotaFiscal,
} from "@/lib/nfse/service";
import { runWithRobotContext } from "@/lib/robot-context";

export async function createTomadorPublic(data: PublicTomadorCreateInput) {
  const payload = publicTomadorCreateSchema.parse(data);

  try {
    const tomador = await prisma.tomador.create({
      data: payload,
      select: { id: true },
    });

    return tomador.id;
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      throw new AppError("Documento já cadastrado", 409);
    }

    throw error;
  }
}

interface PublicProcessDpsResult {
  dpsId: string;
  steps: { step: "assinatura" | "emissao"; success: boolean; response?: unknown; error?: unknown }[];
}

function serializeStepError(error: unknown) {
  if (error instanceof AppError) {
    return {
      message: error.message,
      statusCode: error.statusCode,
      details: error.details ?? null,
    };
  }

  if (error instanceof Error) {
    return {
      message: error.message,
    };
  }

  return {
    message: "Erro desconhecido",
  };
}

async function ensureDpsBelongsToPrestador(dpsId: string, prestadorId: string) {
  const dps = await prisma.dps.findUnique({
    where: { id: dpsId },
    select: { prestadorId: true, status: true },
  });

  if (!dps || dps.prestadorId !== prestadorId) {
    throw new AppError("DPS não encontrada para o prestador informado", 404);
  }

  return dps;
}

export async function processarDpsPublic(data: PublicProcessDpsInput) {
  const payload = publicProcessDpsSchema.parse(data);

  const dpsIds =
    payload.dpsIds ??
    (
      await prisma.dps
        .findMany({
          where: {
            prestadorId: payload.prestadorId,
            status: {
              in: [DpsStatus.RASCUNHO, DpsStatus.ASSINADO],
            },
          },
          select: { id: true },
          orderBy: { createdAt: "asc" },
        })
    ).map((item) => item.id);

  const results: PublicProcessDpsResult[] = [];

  for (const dpsId of dpsIds) {
    const steps: PublicProcessDpsResult["steps"] = [];

    try {
      const dps = await ensureDpsBelongsToPrestador(dpsId, payload.prestadorId);

      await runWithRobotContext(payload.prestadorId, async () => {
        if (dps.status !== DpsStatus.ASSINADO && dps.status !== DpsStatus.ENVIADO) {
          try {
            const signedXml = await assinarDps({
              dpsId,
              tag: payload.tag ?? "infDPS",
              certificateId: payload.certificateId,
            });

            steps.push({ step: "assinatura", success: true, response: signedXml });
          } catch (error) {
            steps.push({ step: "assinatura", success: false, error: serializeStepError(error) });
            throw error;
          }
        }

        try {
          const emissionResponse = await emitirNotaFiscal({
            dpsId,
            certificateId: payload.certificateId,
            ambiente: payload.ambiente,
          });

          steps.push({ step: "emissao", success: true, response: emissionResponse });
        } catch (error) {
          steps.push({ step: "emissao", success: false, error: serializeStepError(error) });
          throw error;
        }
      });

      results.push({ dpsId, steps });
    } catch (error) {
      steps.push({ step: "assinatura", success: false, error: serializeStepError(error) });
      results.push({ dpsId, steps });
    }
  }

  return results;
}

export async function createDpsPublic(data: PublicDpsCreateInput) {
  const payload = publicDpsCreateSchema.parse(data);

  const dps = await createDps(payload);

  return dps.id;
}

export async function createTomadorComDpsPublic(data: PublicTomadorWithDpsInput) {
  const payload = publicTomadorWithDpsSchema.parse(data);

  const tomadorId = await createTomadorPublic(payload.tomador);

  try {
    const dps = await createDps({ ...payload.dps, tomadorId });

    return {
      tomadorId,
      dpsId: dps.id,
    };
  } catch (error) {
    await prisma.tomador.delete({ where: { id: tomadorId } }).catch(() => undefined);
    throw error;
  }
}
