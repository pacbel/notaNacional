import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import * as authService from '@/services/authService';

export async function POST(request: NextRequest) {
  try {
    const isAuthenticated = await authService.isAuthenticated(request);
    if (!isAuthenticated) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const contentType = request.headers.get('content-type') || '';
    let descricao = '';
    if (contentType.includes('application/json')) {
      const body = await request.json();
      descricao = String(body.descricao || '').trim();
    } else {
      const form = await request.formData();
      descricao = String(form.get('descricao') || '').trim();
    }
    if (!descricao) {
      return NextResponse.json({ error: 'Descrição obrigatória' }, { status: 400 });
    }

    const created = await prisma.natureza.create({
      data: { descricao }
    });

    // Se for formulário (não JSON), redireciona para a lista
    if (!contentType.includes('application/json')) {
      const host = request.headers.get('host') || 'localhost:3000';
      const protocol = request.headers.get('x-forwarded-proto') || 'http';
      return NextResponse.redirect(`${protocol}://${host}/naturezas`);
    }

    // Caso JSON, retorna JSON
    return NextResponse.json({ ok: true, id: created.id });
  } catch (error) {
    console.error('Erro ao criar natureza:', error);
    return NextResponse.json({ error: 'Erro ao criar natureza' }, { status: 500 });
  }
}
