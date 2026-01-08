import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import * as authService from '@/services/authService';

async function handle(request: NextRequest) {
  try {
    const isAuthenticated = await authService.isAuthenticated(request);
    if (!isAuthenticated) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const contentType = request.headers.get('content-type') || '';
    let body: any = {};
    if (contentType.includes('application/json')) {
      body = await request.json();
    } else {
      const form = await request.formData();
      body = Object.fromEntries(form.entries());
    }

    const id = String(body.id || '');
    if (!id) return NextResponse.json({ error: 'ID não informado' }, { status: 400 });

    const data: any = {};
    if (typeof body.ativo === 'boolean' || body.ativo === 'true' || body.ativo === 'false') {
      data.ativo = typeof body.ativo === 'boolean' ? body.ativo : body.ativo === 'true';
    }
    if (typeof body.descricao === 'string') data.descricao = String(body.descricao).trim();

    if (Object.keys(data).length === 0) {
      return NextResponse.json({ error: 'Nenhuma alteração informada' }, { status: 400 });
    }

    await prisma.natureza.update({ where: { id }, data });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Erro ao atualizar natureza:', error);
    return NextResponse.json({ error: 'Erro ao atualizar natureza' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) { return handle(request); }
export async function POST(request: NextRequest) { return handle(request); }
