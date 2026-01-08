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

    const antes = await prisma.operadoraCartao.findUnique({ where: { id } });
    if (!antes) return NextResponse.json({ error: 'Operadora não encontrada' }, { status: 404 });

    const reg = await prisma.operadoraCartao.update({ where: { id }, data: { ativo } });

    await logService.registrarLog({
      usuarioId: userData.id,
      prestadorId: userData.prestadorId,
      acao: 'Editar',
      entidade: 'OperadoraCartao',
      entidadeId: id,
      descricao: `Usuário ${userData.nome} alterou o status da operadora ${reg.codigo} - ${reg.descricao} para ${ativo ? 'ativo' : 'inativo'}`,
      tela: 'Operadoras',
    });

    return NextResponse.json({ success: true, operadora: reg });
  } catch (error) {
    console.error('Erro ao atualizar status da operadora:', error);
    return NextResponse.json({ error: 'Erro ao atualizar status da operadora' }, { status: 500 });
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

    const reg = await prisma.operadoraCartao.update({
      where: { id },
      data: {
        codigo: (formData.get('codigo') as string) || '',
        bandeiraCodigo: (formData.get('bandeiraCodigo') as string) || '',
        bandeiraDescricao: (formData.get('bandeiraDescricao') as string) || '',
        descricao: (formData.get('descricao') as string) || '',
        cnpj: (formData.get('cnpj') as string) || '',
        endereco: (formData.get('endereco') as string) || null,
        uf: (formData.get('uf') as string) || null,
        codigoMunicipio: (formData.get('codigoMunicipio') as string) || null,
      },
    });

    await logService.registrarLog({
      usuarioId: userData.id,
      prestadorId: userData.prestadorId,
      acao: 'Editar',
      entidade: 'OperadoraCartao',
      entidadeId: id,
      descricao: `Usuário ${userData.nome} atualizou a operadora ${reg.codigo} - ${reg.descricao}`,
      tela: 'Operadoras',
    });

    const host = request.headers.get('host') || 'app.nfsebh.com.br';
    const protocol = request.headers.get('x-forwarded-proto') || 'https';
    return NextResponse.redirect(`${protocol}://${host}/operadoras`);
  } catch (error) {
    console.error('Erro ao atualizar operadora:', error);
    return NextResponse.json({ error: 'Erro ao atualizar operadora' }, { status: 500 });
  }
}
