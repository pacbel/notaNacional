// Seed para inicializar controles de emissão de NF-e/NFS-e em prestadores (versão JS)
/* eslint-disable no-console */
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  const DEFAULTS = {
    emitirNfse: true,
    emitirNfe: false,
    nfeAmbiente: 2,
    numeroNfeAtual: 1,
    nfeSerie: '1',
  };

  const prestadores = await prisma.prestador.findMany({ select: { id: true } });

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
