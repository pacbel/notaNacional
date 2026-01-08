import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';
import { getTokenData } from '@/services/authService';
import { logService } from '@/services/logService';

// PUT: alterar status ativo/inativo
export async function PUT(request: NextRequest) {
  try {
    const userData = await getTokenData(request);
    if (!userData) {
      return NextResponse.json({ message: 'Não autorizado' }, { status: 401 });
    }

    const data = await request.json();
    const { id, ativo } = data as { id: string; ativo: boolean };
    if (!id) return NextResponse.json({ error: 'ID não fornecido' }, { status: 400 });

    const antes = await prisma.transportadora.findUnique({ where: { id } });
    if (!antes) return NextResponse.json({ error: 'Transportadora não encontrada' }, { status: 404 });

    const reg = await prisma.transportadora.update({ where: { id }, data: { ativo } });

    await logService.registrarLog({
      usuarioId: userData.id,
      prestadorId: userData.prestadorId,
      acao: 'Editar',
      entidade: 'Transportadora',
      entidadeId: id,
      descricao: `Usuário ${userData.nome} alterou o status da transportadora ${reg.codigo} - ${reg.razaoSocial} para ${ativo ? 'ativo' : 'inativo'}`,
      tela: 'Transportadoras',
    });

    return NextResponse.json({ success: true, transportadora: reg });
  } catch (error) {
    console.error('Erro ao atualizar status da transportadora:', error);
    return NextResponse.json({ error: 'Erro ao atualizar status da transportadora' }, { status: 500 });
  }
}

// POST: atualizar dados
export async function POST(request: NextRequest) {
  try {
    const userData = await getTokenData(request);
    if (!userData) {
      return NextResponse.json({ message: 'Não autorizado' }, { status: 401 });
    }

    const formData = await request.formData();
    const id = formData.get('id') as string;
    if (!id) return NextResponse.json({ error: 'ID não fornecido' }, { status: 400 });

    const reg = await prisma.transportadora.update({
      where: { id },
      data: {
        codigo: (formData.get('codigo') as string) || '',
        razaoSocial: (formData.get('razaoSocial') as string) || '',
        endereco: (formData.get('endereco') as string) || '',
        uf: (formData.get('uf') as string) || '',
        codigoMunicipio: (formData.get('codigoMunicipio') as string) || '',
        cpfCnpj: (formData.get('cpfCnpj') as string) || '',
        inscricaoEstadual: (formData.get('inscricaoEstadual') as string) || null,
        ufVeiculo: (formData.get('ufVeiculo') as string) || null,
        placaVeiculo: (formData.get('placaVeiculo') as string) || null,
      },
    });

    await logService.registrarLog({
      usuarioId: userData.id,
      prestadorId: userData.prestadorId,
      acao: 'Editar',
      entidade: 'Transportadora',
      entidadeId: id,
      descricao: `Usuário ${userData.nome} atualizou a transportadora ${reg.codigo} - ${reg.razaoSocial}`,
      tela: 'Transportadoras',
    });

    const host = request.headers.get('host') || 'app.nfsebh.com.br';
    const protocol = request.headers.get('x-forwarded-proto') || 'https';
    return NextResponse.redirect(`${protocol}://${host}/transportadoras`);
  } catch (error) {
    console.error('Erro ao atualizar transportadora:', error);
    return NextResponse.json({ error: 'Erro ao atualizar transportadora' }, { status: 500 });
  }
}
