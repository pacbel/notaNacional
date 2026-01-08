import { NextRequest, NextResponse } from 'next/server';
import { join } from 'path';
import { readFile } from 'fs/promises';
import { existsSync } from 'fs';

export async function GET(
  request: NextRequest,
  { params }: { params: { cnpj: string; arquivo: string } }
) {
  try {
    // Aguarda a resolução dos parâmetros
    const resolvedParams = await Promise.resolve(params);
    const cnpj = resolvedParams.cnpj;
    const arquivo = resolvedParams.arquivo;
    
    // Caminho do arquivo XML
    const xmlPath = join(process.cwd(), 'nfse', cnpj, arquivo);

    // Verifica se o arquivo existe
    if (!existsSync(xmlPath)) {
      return NextResponse.json(
        { error: 'Arquivo XML não encontrado' },
        { status: 404 }
      );
    }

    // Lê o arquivo XML
    const xmlContent = await readFile(xmlPath);

    // Configura o cabeçalho da resposta
    const headers = new Headers();
    headers.set('Content-Type', 'application/xml');
    headers.set('Content-Disposition', `attachment; filename=${arquivo}`);

    // Retorna o arquivo XML
    return new NextResponse(xmlContent, {
      status: 200,
      headers,
    });
  } catch (error) {
    console.error('Erro ao fazer download do XML:', error);
    return NextResponse.json(
      { error: 'Erro ao fazer download do XML' },
      { status: 500 }
    );
  }
}
