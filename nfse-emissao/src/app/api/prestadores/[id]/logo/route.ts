import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const resolvedParams = await Promise.resolve(params);
    const prestadorId = resolvedParams.id;

    if (!prestadorId) {
      return NextResponse.json({ error: 'ID do prestador é necessário' }, { status: 400 });
    }

    // Seleciona apenas campos existentes para evitar P2022 durante migrações pendentes
    const prestador = await prisma.prestador.findUnique({
      where: { id: prestadorId },
      select: { id: true, cnpj: true, logoPath: true }
    });

    if (!prestador) {
      return NextResponse.json({ error: 'Prestador não encontrado' }, { status: 404 });
    }

    // 1) Prioriza o caminho salvo no banco (é o mesmo usado na Sidebar)
    if (prestador.logoPath) {
      return NextResponse.json({ logoPath: prestador.logoPath });
    }

    // 2) Fallback: procura arquivo físico nas pastas conhecidas
    // Upload salva em public/logos/[CNPJ SEM MÁSCARA]/logo.[ext]
    // Alguns registros antigos podem ter pasta com CNPJ formatado
    const publicDir = path.join(process.cwd(), 'public');
    const cnpjLimpo = prestador.cnpj.replace(/\D/g, '');
    const candidatosPastas = [
      path.join(publicDir, 'logos', cnpjLimpo),
      path.join(publicDir, 'logos', prestador.cnpj),
    ];
    const candidates = ['logo.jpg', 'logo.png'];
    let found: string | null = null;
    for (const base of candidatosPastas) {
      for (const file of candidates) {
        const p = path.join(base, file);
        try {
          if (fs.existsSync(p)) {
            // Monta o caminho público correspondente
            const pastaPublica = base.endsWith(cnpjLimpo) ? cnpjLimpo : prestador.cnpj;
            found = `/logos/${pastaPublica}/${file}`;
            break;
          }
        } catch {
          // ignora
        }
      }
      if (found) break;
    }

    return NextResponse.json({ logoPath: found });
  } catch (error: any) {
    console.error('Erro ao buscar logomarca do prestador:', error);
    return NextResponse.json({ error: error.message || 'Erro interno do servidor' }, { status: 500 });
  }
}
