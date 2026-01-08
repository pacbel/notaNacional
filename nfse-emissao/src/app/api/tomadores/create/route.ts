import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';
import { getTokenData } from '@/services/authService';
import { logService } from '@/services/logService';
import { randomUUID } from 'crypto';

export async function POST(request: NextRequest) {
  try {
    // Obter dados do usuário logado para o log
    const userData = await getTokenData(request);
    if (!userData) {
      return NextResponse.json(
        { message: 'Não autorizado' },
        { status: 401 }
      );
    }
    
    const formData = await request.formData();
    
    // Preparar dados do tomador
    const tomadorData = {
      id: randomUUID(), // Adicionar ID único
      cpfCnpj: formData.get('cpfCnpj') as string,
      tipo: formData.get('tipo') as string,
      razaoSocial: formData.get('razaoSocial') as string,
      inscricaoMunicipal: formData.get('inscricaoMunicipal') as string || null,
      inscricaoEstadual: (formData.get('inscricaoEstadual') as string) || null,
      email: formData.get('email') as string,
      telefone: formData.get('telefone') ? (formData.get('telefone') as string) : null,
      endereco: formData.get('endereco') as string,
      numero: formData.get('numero') as string,
      complemento: formData.get('complemento') as string || null,
      bairro: formData.get('bairro') as string,
      codigoMunicipio: formData.get('codigoMunicipio') as string,
      uf: formData.get('uf') as string,
      cep: formData.get('cep') as string,
      // Adicionar campos obrigatórios que estavam faltando
      updatedAt: new Date()
    };
    
    const tomador = await prisma.tomador.create({
      data: tomadorData,
    });
    
    // Registrar log de criação do tomador
    await logService.registrarLog({
      usuarioId: userData.id,
      prestadorId: userData.prestadorId,
      acao: 'Criar',
      entidade: 'Tomador',
      entidadeId: tomador.id,
      descricao: `Usuário ${userData.nome} criou o tomador ${tomador.razaoSocial} (${tomador.tipo === 'PF' ? 'CPF' : 'CNPJ'}: ${tomador.cpfCnpj})`,
      tela: 'Tomadores',
    });

    // Obter o host e protocolo da requisição para criar uma URL absoluta correta
    const host = request.headers.get('host') || 'app.nfsebh.com.br';
    const protocol = request.headers.get('x-forwarded-proto') || 'https';
    return NextResponse.redirect(`${protocol}://${host}/tomadores`);
  } catch (error) {
    console.error('Erro ao criar tomador:', error);
    return NextResponse.json(
      { error: 'Erro ao criar tomador' },
      { status: 500 }
    );
  }
}
