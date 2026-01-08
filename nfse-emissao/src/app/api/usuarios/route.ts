import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';
import { hash } from 'bcryptjs';
import { randomUUID } from 'crypto';
import { getTokenData } from '@/services/authService';
import { logService } from '@/services/logService';

// GET /api/usuarios - Listar todos os usuários
export async function GET(request: NextRequest) {
  try {
    // Verificar autenticação e permissões
    const userData = await getTokenData(request);
    if (!userData) {
      return NextResponse.json(
        { message: 'Não autorizado' },
        { status: 401 }
      );
    }
    
    const { searchParams } = new URL(request.url);
    const prestadorId = searchParams.get('prestadorId');
    
    // Definir filtros com base no papel do usuário
    const where: any = {};
    
    // Se não for Master, só pode ver usuários do seu próprio prestador
    if (userData.role !== 'Master') {
      where.prestadorId = userData.prestadorId;
    } 
    // Se for Master e especificou um prestadorId, filtra por esse prestador
    else if (prestadorId) {
      where.prestadorId = prestadorId;
    }

    const usuarios = await prisma.usuario.findMany({
      where,
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
      },
      orderBy: {
        nome: 'asc'
      }
    });

    return NextResponse.json(usuarios);
  } catch (error) {
    console.error('Erro ao listar usuários:', error);
    return NextResponse.json(
      { message: 'Erro ao listar usuários' },
      { status: 500 }
    );
  }
}

// POST /api/usuarios - Criar novo usuário
export async function POST(request: NextRequest) {
  try {
    // Verificar autenticação e permissões
    const userData = await getTokenData(request);
    if (!userData) {
      return NextResponse.json(
        { message: 'Não autorizado' },
        { status: 401 }
      );
    }
    
    const data = await request.json();
    
    // Apenas usuários Master podem criar outros usuários Master
    if (data.role === 'Master' && userData.role !== 'Master') {
      return NextResponse.json(
        { message: 'Você não tem permissão para criar usuários Master' },
        { status: 403 }
      );
    }
    
    // Se não for Master, só pode criar usuários para o seu próprio prestador
    if (userData.role !== 'Master' && data.prestadorId !== userData.prestadorId) {
      return NextResponse.json(
        { message: 'Você só pode criar usuários para o seu próprio prestador' },
        { status: 403 }
      );
    }

    // Validar dados do usuário
    if (!data.nome || !data.email || !data.username || !data.password || !data.role || !data.prestadorId) {
      return NextResponse.json(
        { error: 'Todos os campos são obrigatórios' },
        { status: 400 }
      );
    }
    
    // Não permitir a criação de usuários com role Master
    if (data.role === 'Master') {
      return NextResponse.json(
        { error: 'Não é permitido criar usuários com perfil Master' },
        { status: 403 }
      );
    }

    // Verificar se já existe usuário com o mesmo email ou username
    const existingUser = await prisma.usuario.findFirst({
      where: {
        OR: [
          { email: data.email },
          { username: data.username }
        ]
      }
    });

    if (existingUser) {
      return NextResponse.json(
        { message: 'Já existe um usuário com este email ou nome de usuário' },
        { status: 400 }
      );
    }

    // Verificar se o prestador existe
    const prestador = await prisma.prestador.findUnique({
      where: { id: data.prestadorId }
    });

    if (!prestador) {
      return NextResponse.json(
        { message: 'Prestador não encontrado' },
        { status: 404 }
      );
    }

    // Criptografar a senha
    const hashedPassword = await hash(data.password, 10);

    // Criar o usuário
    const usuario = await prisma.usuario.create({
      data: {
        id: randomUUID(),
        nome: data.nome,
        email: data.email,
        username: data.username,
        password: hashedPassword,
        role: data.role,
        ativo: data.ativo,
        prestadorId: data.prestadorId,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
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
      }
    });

    // Registrar log de criação de usuário
    await logService.registrarLog({
      usuarioId: userData.id,
      prestadorId: data.prestadorId,
      acao: 'Criar',
      entidade: 'Usuário',
      entidadeId: usuario.id,
      descricao: `Usuário ${userData.nome} criou o usuário ${usuario.nome} (${usuario.username}) com perfil ${usuario.role}`,
      tela: 'Usuários',
    });

    return NextResponse.json(usuario, { status: 201 });
  } catch (error) {
    console.error('Erro ao criar usuário:', error);
    return NextResponse.json(
      { message: 'Erro ao criar usuário' },
      { status: 500 }
    );
  }
}
