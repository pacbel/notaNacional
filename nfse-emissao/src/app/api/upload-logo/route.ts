import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { writeFile, mkdir } from 'fs/promises';
import { join, dirname } from 'path';
import { existsSync } from 'fs';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const prestadorId = formData.get('prestadorId') as string;
    const cnpj = formData.get('cnpj') as string;

    if (!file) {
      return NextResponse.json({ error: 'Nenhum arquivo enviado' }, { status: 400 });
    }

    if (!prestadorId && !cnpj) {
      return NextResponse.json({ error: 'ID do prestador ou CNPJ é necessário' }, { status: 400 });
    }

    // Verificar se o arquivo é uma imagem JPG ou PNG
    const fileType = file.type;
    if (!['image/jpeg', 'image/png'].includes(fileType)) {
      return NextResponse.json({ error: 'Apenas imagens JPG ou PNG são permitidas' }, { status: 400 });
    }

    // Obter o prestador pelo ID ou CNPJ
    let prestador;
    if (prestadorId) {
      prestador = await prisma.prestador.findUnique({
        where: { id: prestadorId }
      });
    } else if (cnpj) {
      // Remover caracteres não numéricos do CNPJ
      const cnpjLimpo = cnpj.replace(/\D/g, '');
      prestador = await prisma.prestador.findUnique({
        where: { cnpj: cnpjLimpo }
      });
    }

    if (!prestador) {
      return NextResponse.json({ error: 'Prestador não encontrado' }, { status: 404 });
    }

    // Criar diretório para armazenar a logo se não existir
    const cnpjLimpo = prestador.cnpj.replace(/\D/g, '');
    const logoDir = join(process.cwd(), 'public', 'logos', cnpjLimpo);
    
    if (!existsSync(logoDir)) {
      await mkdir(logoDir, { recursive: true });
    }

    // Determinar a extensão do arquivo
    const extensao = fileType === 'image/jpeg' ? '.jpg' : '.png';
    const logoFilename = `logo${extensao}`;
    const logoPath = join(logoDir, logoFilename);
    
    // Converter o arquivo para um buffer e salvar
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(logoPath, buffer);
    
    // Caminho relativo para ser armazenado no banco de dados e usado no frontend
    const relativeLogoPath = `/logos/${cnpjLimpo}/${logoFilename}`;
    
    // Atualizar o caminho da logo no banco de dados
    await prisma.prestador.update({
      where: { id: prestador.id },
      data: { logoPath: relativeLogoPath } as any
    });

    return NextResponse.json({ 
      message: 'Logomarca enviada com sucesso', 
      logoPath: relativeLogoPath 
    });
  } catch (error: any) {
    console.error('Erro ao processar upload da logomarca:', error);
    return NextResponse.json({ error: error.message || 'Erro interno do servidor' }, { status: 500 });
  }
}
