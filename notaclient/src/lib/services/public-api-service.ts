import { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { AppError } from "@/lib/errors";
import {
  type PublicTomadorCreateInput,
  type PublicDpsCreateInput,
  type PublicTomadorWithDpsInput,
  publicTomadorCreateSchema,
  publicDpsCreateSchema,
  publicTomadorWithDpsSchema,
} from "@/lib/validators/public-api";
import { createDps } from "@/lib/nfse/service";

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
