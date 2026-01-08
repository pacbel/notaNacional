import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Verificando usu\u00e1rios no banco de dados...');
  
  try {
    // Buscar todos os usu\u00e1rios
    const users = await prisma.usuario.findMany({
      include: {
        prestador: true
      }
    });
    
    console.log(`Total de usu\u00e1rios: ${users.length}`);
    
    if (users.length === 0) {
      console.log('Nenhum usu\u00e1rio encontrado. Criando usu\u00e1rio master...');
      
      // Verificar se existe pelo menos um prestador
      const prestador = await prisma.prestador.findFirst();
      
      if (!prestador) {
        console.log('Nenhum prestador encontrado. Crie um prestador antes de criar um usu\u00e1rio master.');
        return;
      }
      
      // Criar usu\u00e1rio master
      const hashedPassword = await bcrypt.hash('master123', 10);
      
      const newUser = await prisma.usuario.create({
        data: {
          nome: 'Administrador Master',
          email: 'master@example.com',
          username: 'master',
          password: hashedPassword,
          role: 'Master',
          ativo: true,
          prestadorId: prestador.id
        }
      });
      
      console.log('Usu\u00e1rio master criado com sucesso:', {
        id: newUser.id,
        nome: newUser.nome,
        username: newUser.username,
        role: newUser.role,
        prestadorId: newUser.prestadorId
      });
    } else {
      // Listar usu\u00e1rios existentes
      users.forEach(user => {
        console.log('-----------------------------------');
        console.log(`ID: ${user.id}`);
        console.log(`Nome: ${user.nome}`);
        console.log(`Username: ${user.username}`);
        console.log(`Email: ${user.email}`);
        console.log(`Role: ${user.role}`);
        console.log(`Ativo: ${user.ativo}`);
        console.log(`Prestador: ${user.prestador?.razaoSocial} (${user.prestadorId})`);
        console.log('-----------------------------------');
      });
    }
  } catch (error) {
    console.error('Erro ao verificar usu\u00e1rios:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
