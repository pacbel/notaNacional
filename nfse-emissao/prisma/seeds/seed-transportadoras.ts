// @ts-nocheck
module.exports = {};
const { PrismaClient } = require('@prisma/client');
const { randomUUID } = require('crypto');

const prisma = new PrismaClient();

async function main() {
  const exemplos = [
    {
      codigo: '1',
      razaoSocial: 'AUTOLOG TRANSPORTES LOGISTICA E ARMAZEM LTDA',
      endereco: 'R AMERICO SANTIAGO PIACENZA 750',
      uf: 'MG',
      codigoMunicipio: '3118601', // Contagem
      cpfCnpj: '0887563000783',
      inscricaoEstadual: '0010477840299',
      ufVeiculo: 'MG',
      placaVeiculo: 'ABC1D23',
      ativo: true,
    },
    {
      codigo: '2',
      razaoSocial: 'TRANSPORTES RÁPIDOS LTDA',
      endereco: 'AV BRASIL 1000',
      uf: 'SP',
      codigoMunicipio: '3550308', // São Paulo
      cpfCnpj: '12345678000199',
      inscricaoEstadual: '1122334455',
      ufVeiculo: 'SP',
      placaVeiculo: 'EFG2H34',
      ativo: true,
    }
  ];

  for (const t of exemplos) {
    await prisma.transportadora.upsert({
      where: { codigo: t.codigo },
      update: t,
      create: { id: randomUUID(), ...t },
    });
  }

  console.log('Seed de transportadoras concluída.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
