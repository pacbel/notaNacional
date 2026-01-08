import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';
import { getTokenData } from '@/services/authService';
import { logService } from '@/services/logService';
import { randomUUID } from 'crypto';

export async function POST(request: NextRequest) {
  try {
    const userData = await getTokenData(request);
    if (!userData) {
      return NextResponse.json({ message: 'Não autorizado' }, { status: 401 });
    }

    const formData = await request.formData();

    const data = {
      id: randomUUID(),
      codigo: (formData.get('codigo') as string) || '',
      bandeiraCodigo: (formData.get('bandeiraCodigo') as string) || '',
      bandeiraDescricao: (formData.get('bandeiraDescricao') as string) || '',
      descricao: (formData.get('descricao') as string) || '',
      cnpj: (formData.get('cnpj') as string) || '',
      endereco: (formData.get('endereco') as string) || null,
      uf: (formData.get('uf') as string) || null,
      codigoMunicipio: (formData.get('codigoMunicipio') as string) || null,
    } as any;

    const reg = await prisma.operadoraCartao.create({ data });

    await logService.registrarLog({
      usuarioId: userData.id,
      prestadorId: userData.prestadorId,
      acao: 'Criar',
      entidade: 'OperadoraCartao',
      entidadeId: reg.id,
      descricao: `Usuário ${userData.nome} criou a operadora ${reg.codigo} - ${reg.descricao}`,
      tela: 'Operadoras',
    });

    const host = request.headers.get('host') || 'app.nfsebh.com.br';
    const protocol = request.headers.get('x-forwarded-proto') || 'https';
    return NextResponse.redirect(`${protocol}://${host}/operadoras`);
  } catch (error) {
    console.error('Erro ao criar operadora:', error);
    return NextResponse.json({ error: 'Erro ao criar operadora' }, { status: 500 });
  }
}
