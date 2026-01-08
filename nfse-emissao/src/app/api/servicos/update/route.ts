import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';
import { getTokenData } from '@/services/authService';
import { logService } from '@/services/logService';
import { converterParaNumero } from '@/utils/formatters';

interface Aliquota {
  aliquota: number;
  inicioVigencia: string;
  fimVigencia: string | null;
}

interface CodigoTributacao {
  codigo: string;
  descricao: string;
  aliquotas: Aliquota[];
}

// Interface para validação dos dados do serviço
interface ServicoValidacaoResult {
  isValid: boolean;
  erros: string[];
  baseCalculo: number;
  valorIss: number;
  valorLiquido: number;
}

// Função para validar e calcular valores do serviço
function validarECalcularServico(servicoData: any): ServicoValidacaoResult {
  const erros: string[] = [];

  // Validação dos campos obrigatórios
  if (!servicoData.descricao || servicoData.descricao.trim() === '') {
    erros.push('Descrição do serviço é obrigatória');
  }

  // Campos CTISS/ItemLista/Alíquota migrados para Prestador — não validar mais aqui

  if (!servicoData.valorUnitario || servicoData.valorUnitario <= 0) {
    erros.push('Valor dos serviços é obrigatório e deve ser maior que zero');
  }

  // Validação das deduções
  if (servicoData.valorDeducoes > servicoData.valorUnitario) {
    erros.push('Valor das deduções não pode ser maior que o valor total');
  }

  // Validação do desconto incondicionado
  if (
    servicoData.descontoIncondicionado >
    servicoData.valorUnitario - servicoData.valorDeducoes
  ) {
    erros.push(
      'Desconto incondicionado não pode ser maior que (Valor Total - Deduções)'
    );
  }

  // Cálculo da base de cálculo do ISS
  const baseCalculo = Math.max(
    0,
    servicoData.valorUnitario -
      servicoData.valorDeducoes -
      servicoData.descontoIncondicionado
  );

  // Cálculo do valor do ISS (se não for retido)
  const valorIss = 0;

  // Cálculo do valor líquido
  let valorLiquido = servicoData.valorUnitario;
  valorLiquido -= servicoData.valorDeducoes;
  valorLiquido -= servicoData.descontoIncondicionado;
  valorLiquido -= servicoData.descontoCondicionado;
  valorLiquido -= servicoData.valorPis;
  valorLiquido -= servicoData.valorCofins;
  valorLiquido -= servicoData.valorInss;
  valorLiquido -= servicoData.valorIr;
  valorLiquido -= servicoData.valorCsll;
  valorLiquido -= servicoData.outrasRetencoes;

  // Validação da base de cálculo
  if (baseCalculo <= 0) {
    erros.push('Base de cálculo do ISS deve ser maior que zero');
  }

  // Validação do valor líquido
  if (valorLiquido <= 0) {
    erros.push('Valor líquido deve ser maior que zero');
  }

  // Validação da soma das retenções
  const totalRetencoes =
    servicoData.valorPis +
    servicoData.valorCofins +
    servicoData.valorInss +
    servicoData.valorIr +
    servicoData.valorCsll +
    servicoData.outrasRetencoes;

  if (totalRetencoes > valorLiquido) {
    erros.push('A soma das retenções não pode ser maior que o valor líquido');
  }

  return {
    isValid: erros.length === 0,
    erros,
    baseCalculo,
    valorIss,
    valorLiquido,
  };
}

// Método PUT para atualizar apenas o status ativo/inativo
export async function PUT(request: NextRequest) {
  try {
    // Obter dados do usuário logado para o log
    const userData = await getTokenData(request);
    if (!userData) {
      return NextResponse.json({ message: 'Não autorizado' }, { status: 401 });
    }

    // Obter dados do corpo da requisição
    const data = await request.json();
    const { id, ativo } = data;

    if (!id) {
      return NextResponse.json(
        { error: 'ID do serviço não fornecido' },
        { status: 400 }
      );
    }

    // Buscar dados do serviço antes da atualização para o log
    const servicoAntes = await prisma.servico.findUnique({
      where: { id },
    });

    if (!servicoAntes) {
      return NextResponse.json(
        { error: 'Serviço não encontrado' },
        { status: 404 }
      );
    }

    // Atualizar apenas o status ativo/inativo
    const servico = await prisma.servico.update({
      where: { id },
      data: {
        ativo: ativo,
      } as any, // Usar tipagem flexível para resolver o erro de tipo
    });

    // Usar tipagem flexível para acessar o campo ativo
    const statusAnterior = (servicoAntes as any).ativo ? 'ativo' : 'inativo';
    const novoStatus = ativo ? 'ativo' : 'inativo';

    // Registrar log de atualização do status
    await logService.registrarLog({
      usuarioId: userData.id,
      prestadorId: userData.prestadorId,
      acao: 'Editar',
      entidade: 'Serviço',
      entidadeId: id,
      descricao: `Usuário ${userData.nome} alterou o status do serviço ${servico.descricao} de ${statusAnterior} para ${novoStatus}`,
      tela: 'Serviços',
    });

    return NextResponse.json({ success: true, servico });
  } catch (error) {
    console.error('Erro ao atualizar status do serviço:', error);
    return NextResponse.json(
      { error: 'Erro ao atualizar status do serviço' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Obter dados do usuário logado para o log
    const userData = await getTokenData(request);
    if (!userData) {
      return NextResponse.json({ message: 'Não autorizado' }, { status: 401 });
    }

    // Verificar se é uma requisição JSON ou FormData
    let servicoData: any;
    let id: string;

    if (request.headers.get('content-type')?.includes('application/json')) {
      // Se for JSON, parse diretamente
      const jsonData = await request.json();
      id = jsonData.id;
      servicoData = {
        ...jsonData,
        updatedAt: new Date(),
      };
    } else {
      // Se for FormData, extrair os campos
      const formData = await request.formData();
      id = formData.get('id') as string;

      servicoData = {
        descricao: formData.get('descricao') as string,
        valorUnitario: converterParaNumero(
          formData.get('valorUnitario') as string
        ),
        issRetido:
          formData.get('issRetido') === 'true' ||
          formData.get('issRetido') === '1',
        valorDeducoes: converterParaNumero(
          (formData.get('valorDeducoes') as string) || '0'
        ),
        descontoCondicionado: converterParaNumero(
          (formData.get('descontoCondicionado') as string) || '0'
        ),
        descontoIncondicionado: converterParaNumero(
          (formData.get('descontoIncondicionado') as string) || '0'
        ),
        valorPis: converterParaNumero(
          (formData.get('valorPis') as string) || '0'
        ),
        valorCofins: converterParaNumero(
          (formData.get('valorCofins') as string) || '0'
        ),
        valorInss: converterParaNumero(
          (formData.get('valorInss') as string) || '0'
        ),
        valorIr: converterParaNumero(
          (formData.get('valorIr') as string) || '0'
        ),
        valorCsll: converterParaNumero(
          (formData.get('valorCsll') as string) || '0'
        ),
        outrasRetencoes: converterParaNumero(
          (formData.get('outrasRetencoes') as string) || '0'
        ),
        updatedAt: new Date(),
      };
    }

    if (!id) {
      return NextResponse.json(
        { error: 'ID do serviço não fornecido' },
        { status: 400 }
      );
    }

    // Buscar dados do serviço antes da atualização para o log
    const servicoAntes = await prisma.servico.findUnique({
      where: { id },
      select: {
        descricao: true,
      },
    });

    if (!servicoAntes) {
      return NextResponse.json(
        { error: 'Serviço não encontrado' },
        { status: 404 }
      );
    }

    // Validar e calcular valores do serviço
    const { isValid, erros, baseCalculo, valorIss, valorLiquido } =
      validarECalcularServico(servicoData);

    if (!isValid) {
      return NextResponse.json(
        {
          message: 'Dados do serviço inválidos',
          erros,
        },
        { status: 400 }
      );
    }

    // Adicionar os valores calculados
    servicoData.baseCalculo = baseCalculo;
    servicoData.valorIss = valorIss;
    servicoData.valorLiquido = valorLiquido;

    const dadosParaSalvar = servicoData;

    // Atualizar o serviço no banco de dados
    const servico = await prisma.servico.update({
      where: { id },
      data: dadosParaSalvar,
    });

    // Registrar log de atualização do serviço
    await logService.registrarLog({
      usuarioId: userData.id,
      prestadorId: userData.prestadorId,
      acao: 'Editar',
      entidade: 'Serviço',
      entidadeId: id,
      descricao: `Usuário ${userData.nome} atualizou o serviço ${servico.descricao}`,
      tela: 'Serviços',
    });

    // Responder com os dados do serviço atualizado ou redirecionar
    if (request.headers.get('content-type')?.includes('application/json')) {
      return NextResponse.json({
        message: 'Serviço atualizado com sucesso',
        servico,
      });
    } else {
      // Obter o host e protocolo da requisição para criar uma URL absoluta correta
      const host = request.headers.get('host') || 'app.nfsebh.com.br';
      const protocol = request.headers.get('x-forwarded-proto') || 'https';
      return NextResponse.redirect(`${protocol}://${host}/servicos`);
    }
  } catch (error) {
    console.error('Erro ao atualizar serviço:', error);
    return NextResponse.json(
      { error: 'Erro ao atualizar serviço', message: (error as Error).message },
      { status: 500 }
    );
  }
}
