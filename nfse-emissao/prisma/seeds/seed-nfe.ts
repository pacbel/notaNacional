// @ts-nocheck
module.exports = {};
const { PrismaClient } = require('@prisma/client');
const { randomUUID } = require('crypto');

const prisma = new PrismaClient();

async function main() {
  const exemplo = {
    numero: 1001,
    serie: 1,
    cnpjCliente: '18565382000382',
    nomeCliente: 'ANGLOGOLD',
    dataEmissao: new Date(),
    valorTotal: 4304.95,
    status: '1', // autorizada
    protocolo: '1312501509838100',
    chaveAcesso: '31250919228592000215500100000000191592000124',
    danfeImpresso: false,
  };

  await prisma.nfe.upsert({
    where: { chaveAcesso: exemplo.chaveAcesso },
    update: exemplo,
    create: { id: randomUUID(), ...exemplo },
  });

  const seeded = await prisma.nfe.findUnique({ where: { chaveAcesso: exemplo.chaveAcesso } });
  if (seeded) {
    await prisma.nfeItem.deleteMany({ where: { nfeId: seeded.id } });
    await prisma.nfeItem.createMany({
      data: [
        {
          nfeId: seeded.id,
          produtoId: null,
          descricao: 'MOTOBOMBA CENTR MULTIETAPAS',
          quantidade: 1,
          valorUnit: 4304.95,
          valorTotal: 4304.95,
          ncm: '84137080',
          cfop: '5102',
          cst: '060',
          ipi: 0,
          pis: 0,
          cofins: 0,
        },
      ],
    });
  }

  console.log('Seed de NF-e concluída.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
