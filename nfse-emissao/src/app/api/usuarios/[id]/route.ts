import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';
import { hash } from 'bcryptjs';
import { getTokenData } from '@/services/authService';
import { logService } from '@/services/logService';

// GET /api/usuarios/[id] - Obter um usuário específico
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Verificar autenticação e permissões
    const userData = await getTokenData(request);
    if (!userData) {
      return NextResponse.json(
        { message: 'Não autorizado' },
        { status: 401 }
      );
    }
    
    // Aguardar os parâmetros antes de usar
    const { id } = await params;
    
    // Buscar o usuário
    const usuarioBasico = await prisma.usuario.findUnique({
      where: { id },
      include: { prestador: true }
    });
    
    if (!usuarioBasico) {
      return NextResponse.json(
        { message: 'Usuário não encontrado' },
        { status: 404 }
      );
    }
    
    // Verificar permissões: apenas Master pode ver qualquer usuário
    // Outros usuários só podem ver usuários do seu próprio prestador
    if (userData.role !== 'Master' && usuarioBasico.prestadorId !== userData.prestadorId) {
      return NextResponse.json(
        { message: 'Você não tem permissão para visualizar este usuário' },
        { status: 403 }
      );
    }

    // Buscar dados completos do usuário
    const usuario = await prisma.usuario.findUnique({
      where: { id },
      select: {
        id: true,
        nome: true,
        email: true,
        username: true,
        role: true,
        ativo: true,
        last_access: true,
        prestadorId: true,
        createdAt: true,
        updatedAt: true,
        prestador: {
          select: {
            razaoSocial: true,
            cnpj: true
          }
        }
      }
    });

    if (!usuario) {
      return NextResponse.json(
        { message: 'Usuário não encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json(usuario);
  } catch (error) {
    console.error('Erro ao buscar usuário:', error);
    return NextResponse.json(
      { message: 'Erro ao buscar usuário' },
      { status: 500 }
    );
  }
}

// PUT /api/usuarios/[id] - Atualizar um usuário
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Verificar autenticação e permissões
    const userData = await getTokenData(request);
    if (!userData) {
      return NextResponse.json(
        { message: 'Não autorizado' },
        { status: 401 }
      );
    }
    
    // Aguardar os parâmetros antes de usar
    const { id } = await params;
    const data = await request.json();

    // Verificar se o usuu00e1rio existe
    const existingUser = await prisma.usuario.findUnique({
      where: { id }
    });

    if (!existingUser) {
      return NextResponse.json(
        { message: 'Usuu00e1rio nu00e3o encontrado' },
        { status: 404 }
      );
    }

    // Verificar se o email ou username já está em uso por outro usuário
    if (data.email !== existingUser.email || data.username !== existingUser.username) {
      const duplicateUser = await prisma.usuario.findFirst({
        where: {
          OR: [
            { email: data.email },
            { username: data.username }
          ],
          NOT: {
            id
          }
        }
      });

      if (duplicateUser) {
        return NextResponse.json(
          { message: 'Já existe um usuário com este email ou nome de usuário' },
          { status: 400 }
        );
      }
    }

    // Não permitir a alteração para role Master
    if (data.role === 'Master' && existingUser.role !== 'Master') {
      return NextResponse.json(
        { message: 'Não é permitido alterar o perfil para Master' },
        { status: 403 }
      );
    }
    
    // Preparar dados para atualização
    const updateData: any = {
      nome: data.nome,
      email: data.email,
      username: data.username,
      role: data.role,
      ativo: data.ativo,
      updatedAt: new Date()
    };

    // Se uma nova senha for fornecida, criptografá-la
    if (data.password) {
      updateData.password = await hash(data.password, 10);
    }

    // Atualizar o usuário
    const updatedUser = await prisma.usuario.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        nome: true,
        email: true,
        username: true,
        role: true,
        ativo: true,
        last_access: true,
        prestadorId: true,
        createdAt: true,
        updatedAt: true
      }
    });
    
    // Registrar log de atualização de usuário
    await logService.registrarLog({
      usuarioId: userData.id,
      prestadorId: existingUser.prestadorId,
      acao: 'Editar',
      entidade: 'Usuário',
      entidadeId: id,
      descricao: `Usuário ${userData.nome} atualizou o usuário ${updatedUser.nome} (${updatedUser.username})`,
      tela: 'Usuários',
    });

    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error('Erro ao atualizar usuário:', error);
    return NextResponse.json(
      { message: 'Erro ao atualizar usuário' },
      { status: 500 }
    );
  }
}

// DELETE /api/usuarios/[id] - Excluir um usuário
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Verificar autenticação e permissões
    const userData = await getTokenData(request);
    if (!userData) {
      return NextResponse.json(
        { message: 'Não autorizado' },
        { status: 401 }
      );
    }
    
    // Aguardar os parâmetros antes de usar
    const { id } = await params;

    // Verificar se o usuu00e1rio existe
    const existingUser = await prisma.usuario.findUnique({
      where: { id }
    });

    if (!existingUser) {
      return NextResponse.json(
        { message: 'Usuu00e1rio nu00e3o encontrado' },
        { status: 404 }
      );
    }

    // Guardar informações do usuário antes de excluir para o log
    const usuarioInfo = {
      nome: existingUser.nome,
      username: existingUser.username,
      prestadorId: existingUser.prestadorId
    };
    
    // Excluir o usuário
    await prisma.usuario.delete({
      where: { id }
    });
    
    // Registrar log de exclusão de usuário
    await logService.registrarLog({
      usuarioId: userData.id,
      prestadorId: usuarioInfo.prestadorId,
      acao: 'Excluir',
      entidade: 'Usuário',
      entidadeId: id,
      descricao: `Usuário ${userData.nome} excluiu o usuário ${usuarioInfo.nome} (${usuarioInfo.username})`,
      tela: 'Usuários',
    });

    return NextResponse.json({ message: 'Usuário excluído com sucesso' });
  } catch (error) {
    console.error('Erro ao excluir usuu00e1rio:', error);
    return NextResponse.json(
      { message: 'Erro ao excluir usuu00e1rio' },
      { status: 500 }
    );
  }
}
