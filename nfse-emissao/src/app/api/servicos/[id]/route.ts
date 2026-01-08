import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

const prisma = new PrismaClient();

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verificar autenticação usando as opções de autenticação definidas
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }

    const { id } = params;

    if (!id) {
      return NextResponse.json(
        { error: 'ID do serviço não fornecido' },
        { status: 400 }
      );
    }

    // Buscar serviço no banco de dados com todos os campos necessários
    const servico = await prisma.servico.findUnique({
      where: { id },
      select: {
        id: true,
        descricao: true,
        valorUnitario: true,
        issRetido: true,
        valorDeducoes: true,
        descontoCondicionado: true,
        descontoIncondicionado: true,
        valorPis: true,
        valorCofins: true,
        valorInss: true,
        valorIr: true,
        valorCsll: true,
        outrasRetencoes: true,
        baseCalculo: true,
        valorIss: true,
        valorLiquido: true,
        ativo: true,
        createdAt: true,
        updatedAt: true
      }
    });

    if (!servico) {
      return NextResponse.json(
        { error: 'Serviço não encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json(servico);
  } catch (error) {
    console.error('Erro ao buscar serviço:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar serviço' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
