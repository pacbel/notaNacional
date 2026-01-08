import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';
import { getTokenData } from '@/services/authService';
import { logService } from '@/services/logService';
import { randomUUID } from 'crypto';
import { converterParaNumero } from '@/utils/formatters';

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

  // CTISS, Item da Lista e Alíquota migraram para Prestador (padrões municipais)

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
  const valorIss = servicoData.issRetido
    ? 0
    : baseCalculo * (servicoData.aliquota / 100);

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

export async function POST(request: NextRequest) {
  try {
    // Obter dados do usuário logado para o log
    const userData = await getTokenData(request);
    if (!userData) {
      return NextResponse.json({ message: 'Não autorizado' }, { status: 401 });
    }

    // Verificar se é uma requisição JSON ou FormData
    let servicoData: any;

    if (request.headers.get('content-type')?.includes('application/json')) {
      // Se for JSON, parse diretamente
      const jsonData = await request.json();
      servicoData = {
        id: randomUUID(),
        ...jsonData,
        updatedAt: new Date(),
      };
    } else {
      // Se for FormData, extrair os campos
      const formData = await request.formData();

      servicoData = {
        id: randomUUID(),
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

    // Dados a salvar: apenas campos do modelo de Serviço
    const dadosParaSalvar = servicoData;

    // Criar o serviço no banco de dados com os valores calculados
    const servico = await prisma.servico.create({
      data: dadosParaSalvar,
    });

    // Registrar log de criação do serviço
    await logService.registrarLog({
      usuarioId: userData.id,
      prestadorId: userData.prestadorId,
      acao: 'Criar',
      entidade: 'Serviço',
      entidadeId: servico.id,
      descricao: `Usuário ${userData.nome} criou o serviço ${servico.descricao}`,
      tela: 'Serviços',
    });

    // Responder com os dados do serviço criado ou redirecionar
    if (request.headers.get('content-type')?.includes('application/json')) {
      return NextResponse.json(
        {
          message: 'Serviço criado com sucesso',
          servico,
        },
        { status: 201 }
      );
    } else {
      // Obter o host e protocolo da requisição para criar uma URL absoluta correta
      const host = request.headers.get('host') || 'app.nfsebh.com.br';
      const protocol = request.headers.get('x-forwarded-proto') || 'https';
      return NextResponse.redirect(`${protocol}://${host}/servicos`);
    }
  } catch (error) {
    console.error('Erro ao criar serviço:', error);
    return NextResponse.json(
      { error: 'Erro ao criar serviço', message: (error as Error).message },
      { status: 500 }
    );
  }
}
