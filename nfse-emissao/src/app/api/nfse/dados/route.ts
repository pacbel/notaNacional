import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const [prestadores, tomadores, servicos] = await Promise.all([
      prisma.prestador.findMany({
        orderBy: { razaoSocial: 'asc' },
        select: {
          id: true,
          razaoSocial: true,
          cnpj: true,
          inscricaoMunicipal: true,
          serie: true,
          ambiente: true,
          optanteSimplesNacional: true,
          incentivadorCultural: true,
          exibirConstrucaoCivil: true
        }
      }),
      prisma.tomador.findMany({
        orderBy: { razaoSocial: 'asc' }
      }),
      prisma.servico.findMany({
        where: { ativo: true },
        orderBy: { descricao: 'asc' }
      })
    ]);

    return NextResponse.json({
      prestadores,
      tomadores,
      servicos
    });
  } catch (error) {
    console.error('Erro ao buscar dados:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar dados' },
      { status: 500 }
    );
  }
}
