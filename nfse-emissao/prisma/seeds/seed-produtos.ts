// @ts-nocheck
module.exports = {};
const { PrismaClient } = require('@prisma/client');
const { randomUUID } = require('crypto');

const prisma = new PrismaClient();

async function main() {
  const exemplos = [
    {
      codigo: '1010',
      codigoBarras: '7891234567890',
      descricao: 'AGREGADO HIDRÁULICO 60HZ GROB',
      ncm: '85015290',
      cfop: '5916',
      unComercial: 'PC',
      unTributaria: 'UN',
      qtdComercial: 1,
      qtdTributaria: 1,
      precoVenda: 14764.66,
      informacoesAdicionais: 'Produto de exemplo para testes',
      crt: 'SN',
      ativo: true,
      // ICMS
      icmsCodigo: '400',
      icmsOrigem: '0',
      icmsAliquota: 0,
      // IPI
      ipiCst: '53',
      ipiClasseEnquadramento: null,
      ipiCodigoEnquadramento: '999',
      ipiCnpjProdutor: null,
      ipiQtdeSelo: 0,
      ipiAliquota: 0,
      // PIS/COFINS
      pisCst: '09',
      pisAliquota: 0,
      pisStAliquota: 0,
      cofinsCst: '09',
      cofinsAliquota: 0,
      cofinsStAliquota: 0,
      // OUTROS
      cest: '0103500',
      escala: 'industrial',
      cnpjFabricante: null,
      codigoBeneficioFiscal: null,
    },
    {
      codigo: '2001',
      descricao: 'PARAFUSO AÇO INOX 10MM',
      ncm: '73181500',
      cfop: '5102',
      unComercial: 'UN',
      unTributaria: 'UN',
      qtdComercial: 1,
      qtdTributaria: 1,
      precoVenda: 2.5,
      crt: 'SN',
      ativo: true,
      icmsCodigo: '000',
      icmsOrigem: '0',
      icmsAliquota: 0.18,
      pisCst: '01',
      pisAliquota: 0.0065,
      cofinsCst: '01',
      cofinsAliquota: 0.03,
    }
  ];

  for (const p of exemplos) {
    await prisma.produto.upsert({
      where: { codigo: p.codigo },
      update: p,
      create: { id: randomUUID(), ...p },
    });
  }

  console.log('Seed de produtos concluída.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
