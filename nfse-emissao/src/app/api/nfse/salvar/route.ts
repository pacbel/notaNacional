import { prisma } from '@/lib/prisma';
import { NextResponse, NextRequest } from 'next/server';
import crypto from 'crypto';
import { getTokenData } from '@/services/authService';
import { logService } from '@/services/logService';

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
    
    // Processar o FormData
    const formData = await request.formData();
    
    // Extrair dados do formulário
    const prestadorId = formData.get('prestadorId') as string;
    const tomadorId = formData.get('tomadorId') as string;

    // Validação de campos obrigatórios
    if (!prestadorId) {
      return NextResponse.json({ message: 'O campo prestador é obrigatório.' }, { status: 400 });
    }
    if (!tomadorId) {
      return NextResponse.json({ message: 'O campo tomador é obrigatório.' }, { status: 400 });
    }

    // Buscar dados do prestador para obter a série
    const prestador = await prisma.prestador.findUnique({
      where: { id: prestadorId },
      select: { serie: true }
    });

    if (!prestador) {
      return NextResponse.json({ message: 'Prestador não encontrado.' }, { status: 404 });
    }

    const serie = prestador.serie || '1'; // Usar a série do prestador ou um fallback

    // O campo numero é obrigatório no modelo Prisma
    // Gerar um número temporário se não for fornecido
    const numeroFormulario = formData.get('numero') as string;
    // Usar um valor fixo para garantir que não seja null
    const numero = numeroFormulario && numeroFormulario.trim() !== '' ? numeroFormulario : `TEMP-${Date.now()}`;
    // Se a data de emissão não for fornecida, usar a data atual
    const dataEmissaoStr = formData.get('dataEmissao') as string;
    const dataEmissao = dataEmissaoStr && dataEmissaoStr !== '' ? dataEmissaoStr : new Date().toISOString().split('T')[0];
    const competencia = formData.get('competencia') as string || dataEmissao;
    const naturezaOperacao = parseInt(formData.get('naturezaOperacao') as string) || 1; // Valor padrão 1 se não for um número válido
    // Verificar se existe um campo observacao no formulário e usar como discriminacao
    const observacao = formData.get('observacao') as string;
    const discriminacao = observacao || 'Prestação de serviços'; // Usar observacao ou valor padrão
    
    // Converter valores formatados com vírgula para ponto decimal
    const converterValor = (valor: string | null): number => {
      if (!valor) return 0;
      return parseFloat(valor.replace(',', '.')) || 0;
    };
    
    // Extrair valores principais
    const valorServicos = converterValor(formData.get('valorServicos') as string);
    const baseCalculo = converterValor(formData.get('baseCalculo') as string);
    const aliquota = converterValor(formData.get('aliquota') as string);
    const issRetido = formData.get('issRetido') as string;
    const exigibilidadeIss = parseInt(formData.get('exigibilidadeIss') as string) || 1;
    
    // Extrair valores de retenções e descontos
    const valorDeducoes = converterValor(formData.get('valorDeducoes') as string);
    const descontoCondicionado = converterValor(formData.get('descontoCondicionado') as string);
    const descontoIncondicionado = converterValor(formData.get('descontoIncondicionado') as string);
    const valorPis = converterValor(formData.get('valorPis') as string);
    const valorCofins = converterValor(formData.get('valorCofins') as string);
    const valorInss = converterValor(formData.get('valorInss') as string);
    const valorIr = converterValor(formData.get('valorIr') as string);
    const valorCsll = converterValor(formData.get('valorCsll') as string);
    const outrasRetencoes = converterValor(formData.get('outrasRetencoes') as string);
    const valorLiquidoNfse = converterValor(formData.get('valorLiquidoNfse') as string);
    
    // Extrair dados do intermediário
    const tipoIntermediario = formData.get('tipoIntermediario') as string;
    const temIntermediario = tipoIntermediario !== 'naoExiste';
    const intermediarioRazaoSocial = temIntermediario ? (formData.get('intermediarioRazaoSocial') as string) : '';
    const intermediarioCpfCnpj = temIntermediario ? (formData.get('intermediarioCpfCnpj') as string) : '';
    const intermediarioInscricaoMunicipal = temIntermediario ? (formData.get('intermediarioInscricaoMunicipal') as string) : '';
    
    // Extrair dados da construção civil
    const construcaoCivilNumeroMatricula = formData.get('construcaoCivilNumeroMatricula') as string;
    const construcaoCivilNumeroArt = formData.get('construcaoCivilNumeroArt') as string;
    const ambiente = parseInt(formData.get('ambiente') as string);
    const optanteSimplesNacional = formData.get('optanteSimplesNacional') === '1';
    const incentivadorCultural = formData.get('incentivadorCultural') === '1';
    
    // Extrair arrays de serviços
    const servicoIds = formData.getAll('servicoId[]') as string[];
    const quantidades = formData.getAll('quantidades[]').map(q => parseFloat(q as string));
    const valoresUnitarios = formData.getAll('valoresUnitarios[]').map(v => parseFloat(v as string));
    const valoresTotais = formData.getAll('valorTotal[]').map(v => parseFloat(v as string));
    
    // Criar o objeto de dados para a nota fiscal
    // Usando uma variável temporária para evitar erros de tipo
    const notaFiscalData: any = {
      id: crypto.randomUUID(),
      updatedAt: new Date(),
      numero,
      serie,
      dataEmissao: new Date(dataEmissao || new Date()),
      competencia: new Date(competencia),
      naturezaOperacao,
      discriminacao,
      valorServicos,
      valorLiquidoNfse,
      valorDeducoes,
      valorPis,
      valorCofins,
      valorInss,
      valorIr,
      valorCsll,
      outrasRetencoes,
      ambiente,
      optanteSimplesNacional,
      incentivadorCultural,
      status: '0', // Não transmitida
    };
    
    // Adicionar os novos campos
    notaFiscalData.baseCalculo = baseCalculo;
    notaFiscalData.aliquota = aliquota;
    notaFiscalData.issRetido = issRetido === '1';
    notaFiscalData.descontoCondicionado = descontoCondicionado;
    notaFiscalData.descontoIncondicionado = descontoIncondicionado;
    notaFiscalData.exigibilidadeIss = exigibilidadeIss;
    
    // Adicionar campos do intermediário (apenas se não for "Não existe" e tiver razão social preenchida)
    if (temIntermediario && intermediarioRazaoSocial) {
      notaFiscalData.intermediarioRazaoSocial = intermediarioRazaoSocial;
      notaFiscalData.intermediarioCpfCnpj = intermediarioCpfCnpj;
      notaFiscalData.intermediarioInscricaoMunicipal = intermediarioInscricaoMunicipal;
    }
    
    // Adicionar campos da construção civil (apenas se tiver número de matrícula preenchido)
    if (construcaoCivilNumeroMatricula) {
      notaFiscalData.construcaoCivilNumeroMatricula = construcaoCivilNumeroMatricula;
      notaFiscalData.construcaoCivilNumeroArt = construcaoCivilNumeroArt;
    }
    
    // Mapear e validar os itens da nota fiscal
    const itensNotaFiscal = (servicoIds as string[])
      .map((servicoId, index) => {
        // Converte explicitamente para string para garantir a segurança dos tipos
        const quantidadeStr = String(quantidades[index] || '0');
        const valorUnitarioStr = String(valoresUnitarios[index] || '0');

        // Pula o item se o serviço não estiver selecionado ou a quantidade for inválida
        if (!servicoId || parseFloat(quantidadeStr.replace(',', '.')) <= 0) {
          return null;
        }

        const quantidade = parseFloat(quantidadeStr.replace(',', '.'));
        const valorUnitario = parseFloat(valorUnitarioStr.replace(',', '.'));
        const valorTotal = quantidade * valorUnitario;

        return {
          id: crypto.randomUUID(),
          quantidade,
          valorUnitario,
          valorTotal,
          discriminacao: 'Item de serviço',
          updatedAt: new Date(),
          servico: { // Conecta a relação com o serviço em cada item
            connect: { id: servicoId },
          },
        };
      })
      .filter((item): item is NonNullable<typeof item> => item !== null);

    // Validar se há pelo menos um item de serviço válido
    if (itensNotaFiscal.length === 0) {
      return NextResponse.json(
        { success: false, message: 'A nota fiscal deve ter pelo menos um serviço válido.' },
        { status: 400 }
      );
    }

    // Adicionar os itens da nota fiscal ao objeto de dados
    notaFiscalData.itemnotafiscal = {
      create: itensNotaFiscal,
    };
    
    // Adicionar a relação com o prestador
    notaFiscalData.prestador = {
      connect: { id: prestadorId }
    };
    
    // Adicionar a relação com o tomador
    notaFiscalData.tomador = {
      connect: { id: tomadorId }
    };
    
    // Criar a nota fiscal
    const notaFiscal = await prisma.notafiscal.create({
      data: notaFiscalData
    });
    
    // Buscar dados do tomador para o log
    const tomador = await prisma.tomador.findUnique({
      where: { id: tomadorId },
      select: {
        razaoSocial: true,
        cpfCnpj: true
      }
    });
    
    // Registrar log de salvamento da NFS-e
    await logService.registrarLog({
      usuarioId: userData.id,
      prestadorId: prestadorId,
      acao: 'Criar',
      entidade: 'NFS-e',
      entidadeId: notaFiscal.id,
      descricao: `Usuário ${userData.nome} salvou a NFS-e número ${numero} para o tomador ${tomador?.razaoSocial || 'Não identificado'}`,
      tela: 'NFS-e',
    });
    
    return NextResponse.json({ 
      success: true, 
      message: 'Nota fiscal salva com sucesso',
      id: notaFiscal.id 
    });
  } catch (error) {
    console.error('Erro ao salvar nota fiscal:', error);
    return NextResponse.json(
      { success: false, message: 'Erro ao salvar nota fiscal', error: String(error) },
      { status: 500 }
    );
  } finally {
    // Verificar se o método $disconnect existe antes de chamá-lo
    if (prisma && typeof prisma.$disconnect === 'function') {
      await prisma.$disconnect();
    }
  }
}
