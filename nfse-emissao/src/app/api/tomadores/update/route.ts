import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';
import { getTokenData } from '@/services/authService';
import { logService } from '@/services/logService';

// Método PUT para atualizar apenas o status ativo/inativo
export async function PUT(request: NextRequest) {
  try {
    // Obter dados do usuário logado para o log
    const userData = await getTokenData(request);
    if (!userData) {
      return NextResponse.json(
        { message: 'Não autorizado' },
        { status: 401 }
      );
    }
    
    // Obter dados do corpo da requisição
    const data = await request.json();
    const { id, ativo } = data;
    
    if (!id) {
      return NextResponse.json(
        { error: 'ID do tomador não fornecido' },
        { status: 400 }
      );
    }
    
    // Buscar dados do tomador antes da atualização para o log
    const tomadorAntes = await prisma.tomador.findUnique({
      where: { id }
    });
    
    if (!tomadorAntes) {
      return NextResponse.json(
        { error: 'Tomador não encontrado' },
        { status: 404 }
      );
    }
    
    // Atualizar apenas o status ativo/inativo
    const tomador = await prisma.tomador.update({
      where: { id },
      data: {
        ativo: ativo
      } as any, // Usar tipagem flexível para resolver o erro de tipo
    });
    
    // Usar tipagem flexível para acessar o campo ativo
    const statusAnterior = (tomadorAntes as any).ativo ? 'ativo' : 'inativo';
    const novoStatus = ativo ? 'ativo' : 'inativo';
    
    // Registrar log de atualização do status
    await logService.registrarLog({
      usuarioId: userData.id,
      prestadorId: userData.prestadorId,
      acao: 'Editar',
      entidade: 'Tomador',
      entidadeId: id,
      descricao: `Usuário ${userData.nome} alterou o status do tomador ${tomador.razaoSocial} de ${statusAnterior} para ${novoStatus}`,
      tela: 'Tomadores',
    });

    return NextResponse.json({ success: true, tomador });
  } catch (error) {
    console.error('Erro ao atualizar status do tomador:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { error: `Erro ao atualizar status do tomador: ${errorMessage}` },
      { status: 500 }
    );
  }
}

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
    const id = formData.get('id') as string;
    
    if (!id) {
      return NextResponse.json(
        { error: 'ID do tomador não fornecido' },
        { status: 400 }
      );
    }
    
    // Buscar dados do tomador antes da atualização para o log
    const tomadorAntes = await prisma.tomador.findUnique({
      where: { id },
      select: {
        razaoSocial: true,
        cpfCnpj: true,
        tipo: true
      }
    });
    
    if (!tomadorAntes) {
      return NextResponse.json(
        { error: 'Tomador não encontrado' },
        { status: 404 }
      );
    }
    
    const tomador = await prisma.tomador.update({
      where: { id },
      data: {
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
        updatedAt: new Date()
      },
    });
    
    // Registrar log de atualização do tomador
    await logService.registrarLog({
      usuarioId: userData.id,
      prestadorId: userData.prestadorId,
      acao: 'Editar',
      entidade: 'Tomador',
      entidadeId: id,
      descricao: `Usuário ${userData.nome} atualizou o tomador ${tomador.razaoSocial} (${tomador.tipo === 'PF' ? 'CPF' : 'CNPJ'}: ${tomador.cpfCnpj})`,
      tela: 'Tomadores',
    });

    // Obter o host e protocolo da requisição para criar uma URL absoluta correta
    const host = request.headers.get('host') || 'app.nfsebh.com.br';
    const protocol = request.headers.get('x-forwarded-proto') || 'https';
    return NextResponse.redirect(`${protocol}://${host}/tomadores`);
  } catch (error) {
    console.error('Erro ao atualizar tomador:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { error: `Erro ao atualizar tomador: ${errorMessage}` },
      { status: 500 }
    );
  }
}
