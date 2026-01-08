const fs = require('fs');
const path = require('path');
const { parse } = require('csv-parse/sync');
const { randomUUID } = require('crypto');

// Caminho do arquivo CSV de origem
const csvFilePath = path.join(__dirname, '../../public/docs/tributacao/codigos_servicos.csv');

// Caminho do arquivo de seed de saída
const outputFilePath = path.join(__dirname, '../seed-lista-servicos.ts');

// Lê o conteúdo do arquivo CSV
const fileContent = fs.readFileSync(csvFilePath, 'utf8');

// Converte o CSV para um array de objetos
const records = parse(fileContent, {
  columns: true,
  skip_empty_lines: true,
  trim: true,
  delimiter: ',',
  quote: '"',
  skip_records_with_empty_values: true,
});

// Gera o conteúdo do arquivo de seed
const seedContent = `// @ts-nocheck
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Iniciando seed da lista de serviços...');

  // Verifica se já existem registros
  const count = await prisma.listaServicos.count();
  
  if (count === 0) {
    console.log('Inserindo serviços na tabela listaServicos...');
    
    // Insere todos os registros
    await prisma.listaServicos.createMany({
      data: [
${records.map(record => {
        const id = randomUUID();
        // Faz o split da descrição para separar o código do item
        const descricaoCompleta = record.descricao;
        const match = descricaoCompleta.match(/^(\d+\.?\d*)\s*-\s*(.*)$/);
        let codigoItem = '';
        let descricao = descricaoCompleta;
        
        if (match && match[1] && match[2]) {
          codigoItem = match[1].trim();
          descricao = match[2].trim();
        }
        
        return `        {
          id: '${id}',
          codigo: '${record.codigo.replace(/'/g, "\\'")}',
          ${codigoItem ? `codigoItem: '${codigoItem.replace(/'/g, "\\'")}',` : ''}
          descricao: '${descricao.replace(/'/g, "\\'").replace(/\n/g, ' ')}',
          categoria: '${(record.categoria || '').replace(/'/g, "\\'")}'
        }`;
      }).join(',\n')}
      ],
      skipDuplicates: true,
    });
    
    console.log('✅ Lista de serviços inserida com sucesso!');
  } else {
    console.log('ℹ️  A tabela listaServicos já contém registros. Nenhum dado foi inserido.');
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
`;

// Escreve o arquivo de seed
fs.writeFileSync(outputFilePath, seedContent, 'utf8');
console.log(`✅ Arquivo de seed gerado com sucesso em: ${outputFilePath}`);
console.log(`✅ Total de registros processados: ${records.length}`);
