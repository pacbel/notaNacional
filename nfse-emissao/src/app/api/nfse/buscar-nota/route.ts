import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    // Valida o token de autenticação
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Token de autenticação não fornecido' },
        { status: 401 }
      );
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      return NextResponse.json(
        { error: 'Token de autenticação inválido' },
        { status: 401 }
      );
    }

    const { notaFiscalId } = await request.json();

    if (!notaFiscalId) {
      return NextResponse.json(
        { error: 'ID da nota fiscal não informado' },
        { status: 400 }
      );
    }

    // Busca a nota fiscal no banco de dados
    const notaFiscal = await prisma.notafiscal.findUnique({
      where: { id: notaFiscalId },
      include: {
        prestador: true
      }
    });

    if (!notaFiscal) {
      return NextResponse.json(
        { error: 'Nota fiscal não encontrada' },
        { status: 404 }
      );
    }

    if (!notaFiscal.protocolo) {
      return NextResponse.json(
        { error: 'Nota fiscal não possui protocolo para consulta' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        ambiente: notaFiscal.ambiente,
        numero: notaFiscal.numero,
        serie: notaFiscal.serie,
        tipo: notaFiscal.tipo,
        cnpjPrestador: notaFiscal.prestador.cnpj,
        inscricaoMunicipalPrestador: notaFiscal.prestador.inscricaoMunicipal
      }
    });
  } catch (error) {
    console.error('Erro ao buscar nota fiscal:', error);
    return NextResponse.json(
      { error: 'Erro ao processar requisição' },
      { status: 500 }
    );
  }
}
