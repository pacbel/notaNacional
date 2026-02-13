/* eslint-disable no-console */
const { PrismaClient } = require("@prisma/client");

async function main() {
  const prisma = new PrismaClient();

  try {
    const registros = await prisma.configuracaoDps.findMany({
      select: {
        prestadorId: true,
        ftpHost: true,
        ftpUsuario: true,
        ftpSenha: true,
        updatedAt: true,
      },
    });

    console.log(JSON.stringify(registros, null, 2));
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
