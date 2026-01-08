"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var child_process_1 = require("child_process");
function run(command) {
  const path = require('path');
  const projectRoot = path.join(__dirname, '..');
  try {
    console.log(`Executando: ${command}`);
    require('child_process').execSync(command, { stdio: 'inherit', cwd: projectRoot });
  } catch (error) {
    console.error(`Erro ao executar comando: ${command}`);
    process.exit(1);
  }
}

const fs = require('fs');
const path = require('path');

function removeMigrationsFolder() {
  const migrationsPath = path.join(__dirname, 'migrations');
  if (fs.existsSync(migrationsPath)) {
    console.log('Removendo pasta de migrations antiga...');
    fs.rmSync(migrationsPath, { recursive: true, force: true });
  }
}

function main() {
  try {
    removeMigrationsFolder();

    console.log('\n=== Gerar o Prisma Client ===');
    run('npx prisma generate');
    console.log('✅ Prisma Client gerado com sucesso!');

    console.log('\n=== Criar as tabelas diretamente a partir do schema ===');

    run('npx prisma db push --accept-data-loss');
    console.log('✅ Tabelas criadas com sucesso!');

    console.log('\n=== Executar o seed para popular as tabelas ===');
    run('npx prisma db seed');
    console.log('✅ Tabelas populadas com sucesso!');

    console.log('\n=== Executando seed de lista de serviços ===');
    run('npx ts-node ./prisma/seed-lista-servicos.ts');
    console.log('✅ Seed de lista de serviços concluído com sucesso!');

    console.log('\nBanco resetado, migrado e populado com sucesso!');
  } catch (error) {
    console.error('Erro no processo de reset/migration/seed:', error);
    process.exit(1);
  }
}
main();
