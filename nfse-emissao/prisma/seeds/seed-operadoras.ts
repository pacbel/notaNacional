// @ts-nocheck
module.exports = {};
const { PrismaClient } = require('@prisma/client');
const { randomUUID } = require('crypto');

const prisma = new PrismaClient();

async function main() {
  const exemplos = [
    {
      codigo: '01',
      bandeiraCodigo: '01',
      bandeiraDescricao: 'Visa',
      descricao: 'VISA',
      cnpj: '05065736000161',
      endereco: 'RUA EXEMPLO 123',
      uf: 'MG',
      codigoMunicipio: '3106200',
      ativo: true,
    },
    {
      codigo: '02',
      bandeiraCodigo: '02',
      bandeiraDescricao: 'Mastercard',
      descricao: 'MASTERCARD',
      cnpj: '11222333000199',
      endereco: 'AV EXEMPLO 456',
      uf: 'SP',
      codigoMunicipio: '3550308',
      ativo: true,
    }
  ];

  for (const o of exemplos) {
    await prisma.operadoraCartao.upsert({
      where: { codigo: o.codigo },
      update: o,
      create: { id: randomUUID(), ...o },
    });
  }

  console.log('Seed de operadoras concluída.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
