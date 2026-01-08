import { NextRequest, NextResponse } from 'next/server';
import { compare } from 'bcrypt';
import { signJwt } from '@/services/authService';
import { logService } from '@/services/logService';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json();

    // Validação básica
    if (!username || !password) {
      return NextResponse.json(
        { error: 'Usuário e senha são obrigatórios' },
        { status: 400 }
      );
    }

    // Busca o usuário pelo username
    const user = await prisma.usuario.findUnique({
      where: { username },
      include: {
        prestador: {
          select: {
            id: true,
            razaoSocial: true,
            nomeFantasia: true,
            cnpj: true,
            logoPath: true,
            integrado_asaas: true,
            customer_id_asaas: true,
          },
        },
      },
    });

    // Verifica se o usuário existe e está ativo
    if (!user || !user.ativo) {
      return NextResponse.json(
        { error: 'Usuário não encontrado ou inativo!' },
        { status: 401 }
      );
    }

    // Verifica a senha
    const passwordMatch = await compare(password, user.password);
    if (!passwordMatch) {
      return NextResponse.json(
        { error: 'Senha incorreta' },
        { status: 401 }
      );
    }

    // Atualiza o último acesso
    await prisma.usuario.update({
      where: { id: user.id },
      data: { last_access: new Date() },
    });
    
    // Registra o log de login
    await logService.registrarLog({
      usuarioId: user.id,
      prestadorId: user.prestadorId,
      acao: 'Login',
      entidade: 'Usuário',
      entidadeId: user.id,
      descricao: `Usuário ${user.nome} (${user.username}) realizou login no sistema`,
      tela: 'Login',
    });

    // Cria o token JWT
    const token = await signJwt({
      id: user.id,
      nome: user.nome,
      email: user.email,
      username: user.username,
      role: user.role,
      prestadorId: user.prestadorId,
    });

    // Prepara os dados do usuário para retornar (sem a senha)
    const userData = {
      id: user.id,
      nome: user.nome,
      email: user.email,
      username: user.username,
      role: user.role,
      prestadorId: user.prestadorId,
      prestador: {
        id: user.prestador.id,
        razaoSocial: user.prestador.razaoSocial,
        nomeFantasia: user.prestador.nomeFantasia,
        cnpj: user.prestador.cnpj,
        logoPath: user.prestador.logoPath,
        integrado_asaas: user.prestador.integrado_asaas,
        customer_id_asaas: user.prestador.customer_id_asaas
      }
    };

    // Configura a resposta com o cookie
    const response = NextResponse.json({ user: userData, token });
    
    // Define o cookie com o token JWT
    response.cookies.set({
      name: 'auth-token',
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 4, // 4 horas em segundos
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('Erro na autenticação:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  } finally {
    // Verificar se o método $disconnect existe antes de chamá-lo
    if (prisma && typeof prisma.$disconnect === 'function') {
      await prisma.$disconnect();
    }
  }
}

// Rota para logout
export async function DELETE() {
  const response = NextResponse.json({ success: true });
  response.cookies.delete('auth-token');
  return response;
}
