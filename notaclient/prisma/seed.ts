import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // Usuários, Prestadores, Tomadores, Serviços e Configurações são gerenciados pela API externa
  // ou criados automaticamente quando o usuário acessa o sistema
  console.log("Iniciando seed do banco de dados...");
  console.log("Nenhum dado inicial necessário.");
  console.log("Configurações serão criadas automaticamente por prestador no primeiro acesso.");
  console.log("Seed concluído com sucesso!");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
