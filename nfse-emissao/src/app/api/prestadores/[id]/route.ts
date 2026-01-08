import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';
import { getTokenData, verifyJwt } from '@/services/authService';
import { logService } from '@/services/logService';

// GET /api/prestadores/[id] - Obter um prestador específico
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Verificar autenticação e permissões
    const userData = await getTokenData(request);
    if (!userData) {
      return NextResponse.json(
        { message: 'Não autorizado' },
        { status: 401 }
      );
    }
    
    // Aguardar os parâmetros antes de usar
    const { id } = await params;
    
    // Buscar o prestador selecionando apenas colunas existentes
    const prestador = await prisma.prestador.findUnique({
      where: { id },
      select: {
        id: true,
        razaoSocial: true,
        cnpj: true,
        nomeFantasia: true,
        inscricaoMunicipal: true,
        email: true,
        telefone: true,
        endereco: true,
        numero: true,
        complemento: true,
        bairro: true,
        cep: true,
        uf: true,
        codigoMunicipio: true,
        serie: true,
        ambiente: true,
        optanteSimplesNacional: true,
        incentivadorCultural: true,
        exibirConstrucaoCivil: true,
        numeroRpsAtual: true,
        regimeEspecialTributacao: true,
        integrado_asaas: true,
        customer_id_asaas: true,
        emitirNfse: true,
        emitirNfe: true,
        nfeAmbiente: true,
        numeroNfeAtual: true,
        nfeSerie: true,
        ativo: true,
        logoPath: true,
        // Novos campos tributários migrados
        codigoTributacao: true,
        itemListaServico: true,
        aliquota: true,
        codigoTribNacional: true,
        exigibilidadeIss: true,
        issRetido: true,
        tipoImunidade: true,
        valorTribFederal: true,
        valorTribEstadual: true,
        totalTribMunicipal: true,
      }
    });
    
    if (!prestador) {
      return NextResponse.json(
        { message: 'Prestador não encontrado' },
        { status: 404 }
      );
    }
    
    // Verificar permissões: apenas Master pode ver qualquer prestador
    // Outros usuários só podem ver seu próprio prestador
    if (userData.role !== 'Master' && prestador.id !== userData.prestadorId) {
      return NextResponse.json(
        { message: 'Você não tem permissão para visualizar este prestador' },
        { status: 403 }
      );
    }

    console.log('GET /api/prestadores/[id] - prestador carregado:', {
      id: prestador.id,
      codigoTributacao: (prestador as any).codigoTributacao,
      itemListaServico: (prestador as any).itemListaServico,
      aliquota: (prestador as any).aliquota,
      codigoTribNacional: (prestador as any).codigoTribNacional,
      exigibilidadeIss: (prestador as any).exigibilidadeIss,
      issRetido: (prestador as any).issRetido,
      tipoImunidade: (prestador as any).tipoImunidade,
      valorTribFederal: (prestador as any).valorTribFederal,
      valorTribEstadual: (prestador as any).valorTribEstadual,
      totalTribMunicipal: (prestador as any).totalTribMunicipal,
    });

    return NextResponse.json(prestador);
  } catch (error) {
    return NextResponse.json(
      { message: 'Erro ao buscar prestador' },
      { status: 500 }
    );
  }
}

// DELETE /api/prestadores/[id] - Excluir um prestador
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Verificar autenticação e permissões
    const userData = await getTokenData(request);
    if (!userData) {
      return NextResponse.json(
        { message: 'Não autorizado' },
        { status: 401 }
      );
    }
    
    // Apenas Master pode excluir prestadores
    if (userData.role !== 'Master') {
      return NextResponse.json(
        { message: 'Apenas usuários Master podem excluir prestadores' },
        { status: 403 }
      );
    }
    
    // Aguardar os paru00e2metros antes de usar
    const { id } = await params;
    
    // Buscar o prestador antes de excluir para o log
    const prestador = await prisma.prestador.findUnique({
      where: { id }
    });
    
    if (!prestador) {
      return NextResponse.json(
        { message: 'Prestador não encontrado' },
        { status: 404 }
      );
    }
    
    // Guardar informações do prestador para o log
    const prestadorInfo = {
      razaoSocial: prestador.razaoSocial,
      cnpj: prestador.cnpj
    };
    
    // Excluir o prestador
    await prisma.prestador.delete({
      where: { id }
    });
    
    // Registrar log de exclusão do prestador
    await logService.registrarLog({
      usuarioId: userData.id,
      prestadorId: userData.prestadorId,
      acao: 'Excluir',
      entidade: 'Prestador',
      entidadeId: id,
      descricao: `Usuário ${userData.nome} excluiu o prestador ${prestadorInfo.razaoSocial} (CNPJ: ${prestadorInfo.cnpj})`,
      tela: 'Prestadores',
    });
    
    return NextResponse.json({ message: 'Prestador excluído com sucesso' });
  } catch (error) {
    return NextResponse.json(
      { message: 'Erro ao excluir prestador' },
      { status: 500 }
    );
  }
}
