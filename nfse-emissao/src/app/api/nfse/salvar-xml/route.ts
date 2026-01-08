import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    
    const body = await request.json();

    const { notaFiscalId, xmlContent } = body;

    if (!notaFiscalId || !xmlContent) {
      console.error('[SalvarXML] Dados obrigatórios faltando');
      return NextResponse.json(
        { error: 'ID da nota fiscal e XML são obrigatórios' },
        { status: 400 }
      );
    }

    // Buscar a nota fiscal
    const notaFiscal = await prisma.notafiscal.findUnique({
      where: { id: notaFiscalId },
      include: { prestador: true }
    });

    if (!notaFiscal || !notaFiscal.prestador) {
      return NextResponse.json(
        { error: 'Nota fiscal ou prestador não encontrado' },
        { status: 404 }
      );
    }

    // Criar diretório para salvar o XML
    const cnpjPrestador = notaFiscal.prestador.cnpj;
    const diretorio = path.join(process.cwd(), 'nfse', cnpjPrestador);
    
    if (!fs.existsSync(diretorio)) {
      fs.mkdirSync(diretorio, { recursive: true });
    }

    // Formatar nome do arquivo
    const ano = new Date().getFullYear();
    const idFormatado = notaFiscalId.padStart(11, '0');
    const nomeArquivo = `nfse_${ano}${idFormatado}.xml`;
    const caminhoArquivo = path.join(diretorio, nomeArquivo);

    // Salvar XML no arquivo
    
    fs.writeFileSync(caminhoArquivo, xmlContent);

    // Atualizar nota fiscal no banco
    await prisma.notafiscal.update({
      where: { id: notaFiscalId },
      data: {
        nfseXML: xmlContent,
        arquivoNfse: nomeArquivo
      }
    });

    return NextResponse.json({
      success: true,
      data: {
        nomeArquivo,
        caminhoArquivo
      }
    });

  } catch (error) {
    console.error('[SalvarXML] Erro:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
