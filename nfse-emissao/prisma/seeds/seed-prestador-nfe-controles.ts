// @ts-nocheck
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Definições iniciais
  const DEFAULTS = {
    emitirNfse: true,
    emitirNfe: false,
    nfeAmbiente: 2, // 1=Producao, 2=Homologacao
    numeroNfeAtual: 1,
    nfeSerie: '1',
  } as const;

  const prestadores = await prisma.prestador.findMany({
    select: { id: true },
  });

  for (const p of prestadores) {
    await prisma.prestador.update({
      where: { id: p.id },
      data: {
        emitirNfse: DEFAULTS.emitirNfse,
        emitirNfe: DEFAULTS.emitirNfe,
        nfeAmbiente: DEFAULTS.nfeAmbiente,
        numeroNfeAtual: DEFAULTS.numeroNfeAtual,
        nfeSerie: DEFAULTS.nfeSerie,
      },
    });
  }

  console.log(`Seed concluída. Prestadores atualizados: ${prestadores.length}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
