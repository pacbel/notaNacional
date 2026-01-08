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
      razaoSocial: (formData.get('razaoSocial') as string) || '',
      endereco: (formData.get('endereco') as string) || '',
      uf: (formData.get('uf') as string) || '',
      codigoMunicipio: (formData.get('codigoMunicipio') as string) || '',
      cpfCnpj: (formData.get('cpfCnpj') as string) || '',
      inscricaoEstadual: (formData.get('inscricaoEstadual') as string) || null,
      ufVeiculo: (formData.get('ufVeiculo') as string) || null,
      placaVeiculo: (formData.get('placaVeiculo') as string) || null,
    } as any;

    const transportadora = await prisma.transportadora.create({ data });

    await logService.registrarLog({
      usuarioId: userData.id,
      prestadorId: userData.prestadorId,
      acao: 'Criar',
      entidade: 'Transportadora',
      entidadeId: transportadora.id,
      descricao: `Usuário ${userData.nome} criou a transportadora ${transportadora.codigo} - ${transportadora.razaoSocial}`,
      tela: 'Transportadoras',
    });

    const host = request.headers.get('host') || 'app.nfsebh.com.br';
    const protocol = request.headers.get('x-forwarded-proto') || 'https';
    return NextResponse.redirect(`${protocol}://${host}/transportadoras`);
  } catch (error) {
    console.error('Erro ao criar transportadora:', error);
    return NextResponse.json({ error: 'Erro ao criar transportadora' }, { status: 500 });
  }
}
