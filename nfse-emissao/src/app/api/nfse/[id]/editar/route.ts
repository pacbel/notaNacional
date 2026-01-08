import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";
import { getTokenData } from "@/services/authService";
import { logService } from "@/services/logService";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Obter o ID da nota fiscal a partir dos parâmetros da rota
  const { id } = await params;
  
  try {
    // Obter dados do usuário logado para o log
    const userData = await getTokenData(request);
    if (!userData) {
      return NextResponse.json(
        { message: 'Não autorizado' },
        { status: 401 }
      );
    }
    
    // Detectar e processar o tipo de Content-Type
    const contentType = request.headers.get('content-type') || '';
    let formData: FormData | null = null;
    let body: any = {};

    if (contentType.includes('application/json')) {
      body = await request.json();
      // Função compatível com o restante do código
      formData = null;
    } else if (contentType.includes('multipart/form-data') || contentType.includes('application/x-www-form-urlencoded')) {
      formData = await request.formData();
      // Converter FormData para objeto para facilitar o uso
      body = Object.fromEntries(formData.entries());
    } else {
      return NextResponse.json(
        { success: false, error: 'Content-Type inválido. Envie como multipart/form-data, application/x-www-form-urlencoded ou application/json.' },
        { status: 400 }
      );
    }

    // Função utilitária para converter valores formatados com vírgula para ponto decimal
    const converterValor = (valor: string | null | undefined): number => {
      if (!valor) return 0;
      return Number((valor || '').replace(/\./g, '').replace(',', '.')) || 0;
    };


    // Extrair campos principais
    const prestadorId = body['prestadorId'] as string;
    const tomadorId = body['tomadorId'] as string;
    const competencia = body['competencia'] as string;
    const observacao = body['observacao'] as string;
    const discriminacao = observacao || 'Prestação de serviços';

    // Valores financeiros
    const valorServicos = converterValor(body['valorServicos']);
    const baseCalculo = converterValor(body['baseCalculo']);
    const aliquota = converterValor(body['aliquota']);
    const issRetido = body['issRetido'] === 'true' || body['issRetido'] === '1';
    const exigibilidadeIss = Number(body['exigibilidadeIss']) || 1;
    const valorDeducoes = converterValor(body['valorDeducoes']);
    const descontoCondicionado = converterValor(body['descontoCondicionado']);
    const descontoIncondicionado = converterValor(body['descontoIncondicionado']);
    const valorPis = converterValor(body['valorPis']);
    const valorCofins = converterValor(body['valorCofins']);
    const valorInss = converterValor(body['valorInss']);
    const valorIr = converterValor(body['valorIr']);
    const valorCsll = converterValor(body['valorCsll']);
    const outrasRetencoes = converterValor(body['outrasRetencoes']);
    const valorLiquidoNfse = converterValor(body['valorLiquidoNfse']);

    // Intermediário
    const tipoIntermediario = body['tipoIntermediario'] as string;
    const temIntermediario = tipoIntermediario === 'existe';
    const intermediarioRazaoSocial = temIntermediario ? (body['intermediarioRazaoSocial'] as string) : null;
    const intermediarioCpfCnpj = temIntermediario ? (body['intermediarioCpfCnpj'] as string) : null;
    const intermediarioInscricaoMunicipal = temIntermediario ? (body['intermediarioInscricaoMunicipal'] as string) : null;

    // Construção civil
    const construcaoCivilNumeroMatricula = body['construcaoCivilNumeroMatricula'] as string;
    const construcaoCivilNumeroArt = body['construcaoCivilNumeroArt'] as string;

    // Verificar se a nota fiscal existe
    const notaExistente = await prisma.notafiscal.findUnique({
      where: { id }
    });
    
    if (!notaExistente) {
      console.error("[NFSe Editar API] Nota fiscal não encontrada:", id);
      return NextResponse.json(
        { success: false, message: "Nota fiscal não encontrada" },
        { status: 404 }
      );
    }
    
    // Verificar se a nota já foi transmitida
    if (notaExistente.status !== '0') {
      console.error("[NFSe Editar API] Tentativa de editar nota já transmitida:", id);
      return NextResponse.json(
        { success: false, message: "Apenas notas não transmitidas podem ser editadas" },
        { status: 400 }
      );
    }
    
    // Extrair os dados dos serviços (compatível com JSON e formulário)
    const normalizeArray = (field: any): string[] => {
      if (Array.isArray(field)) return field;
      if (field === undefined || field === null) return [];
      return [field];
    };
    const servicoIds = normalizeArray(body['servicoId[]']);
    const quantidades = normalizeArray(body['quantidade[]']).map(q => parseFloat(q as string));
    const valoresUnitarios = normalizeArray(body['valorUnitario[]']).map(v => parseFloat(v as string));
    const valoresTotais = normalizeArray(body['valorTotal[]']).map(v => parseFloat(v as string));
    
    // Remover os itens existentes da nota fiscal
    await prisma.itemnotafiscal.deleteMany({
      where: { notaFiscalId: id }
    });

    // Criar novos itens para a nota fiscal
    for (let i = 0; i < servicoIds.length; i++) {
      if (!servicoIds[i]) {
        console.warn('[NFSe Editar API] Item sem servicoId, ignorando:', i);
        continue;
      }
      await prisma.itemnotafiscal.create({
        data: {
          id: crypto.randomUUID(),
          notaFiscalId: id,
          servicoId: servicoIds[i],
          quantidade: quantidades[i] !== undefined ? quantidades[i] : 1,
          valorUnitario: valoresUnitarios[i] !== undefined ? valoresUnitarios[i] : 0,
          valorTotal: valoresTotais[i] !== undefined ? valoresTotais[i] : 0,
          discriminacao: 'Item de serviço',
          updatedAt: new Date()
        }
      });
    }
    console.log('[NFSe Editar API] Itens da nota fiscal atualizados com sucesso');

    // Preparar os dados para atualização da nota fiscal
    const dadosAtualizacao: any = {
      prestadorId,
      tomadorId,
      discriminacao,
      valorServicos,
      baseCalculo,
      aliquota,
      issRetido,
      valorDeducoes,
      descontoCondicionado,
      descontoIncondicionado,
      valorPis,
      valorCofins,
      valorInss,
      valorIr,
      valorCsll,
      outrasRetencoes,
      valorLiquidoNfse,
      exigibilidadeIss,
      updatedAt: new Date()
    };

    // Adicionar campo de competência se estiver presente e válido
    if (competencia && typeof competencia === 'string' && /^\d{4}-\d{2}$/.test(competencia)) {
      // Adicionar o dia 01 para ter uma data válida, considerando UTC para evitar problemas de fuso horário
      const [year, month] = competencia.split('-').map(Number);
      // O mês em JavaScript Date é 0-indexado (0 para Janeiro, 11 para Dezembro)
      dadosAtualizacao.competencia = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0)); 
    } else if (competencia) {
      // Se competencia existir mas não for válida, logar um aviso e não incluir no update
      console.warn(`[NFSe Editar API] Formato de competência inválido recebido: ${competencia}. O campo não será atualizado.`);
      // Considerar retornar um erro 400 aqui se a competência for obrigatória e inválida
      // return NextResponse.json({ success: false, error: `Formato de competência inválido: ${competencia}` }, { status: 400 });
    }

    // Adicionar campos do intermediário apenas se houver intermediário
    if (temIntermediario && intermediarioRazaoSocial) {
      dadosAtualizacao.intermediarioRazaoSocial = intermediarioRazaoSocial;
      dadosAtualizacao.intermediarioCpfCnpj = intermediarioCpfCnpj;
      dadosAtualizacao.intermediarioInscricaoMunicipal = intermediarioInscricaoMunicipal;
    } else {
      // Limpar os campos do intermediário se não houver
      dadosAtualizacao.intermediarioRazaoSocial = null;
      dadosAtualizacao.intermediarioCpfCnpj = null;
      dadosAtualizacao.intermediarioInscricaoMunicipal = null;
    }

    // Adicionar campos da construção civil apenas se tiver número de matrícula preenchido
    if (construcaoCivilNumeroMatricula) {
      dadosAtualizacao.construcaoCivilNumeroMatricula = construcaoCivilNumeroMatricula;
      dadosAtualizacao.construcaoCivilNumeroArt = construcaoCivilNumeroArt;
    } else {
      // Limpar os campos da construção civil se não houver
      dadosAtualizacao.construcaoCivilNumeroMatricula = null;
      dadosAtualizacao.construcaoCivilNumeroArt = null;
    }

    // Atualizar a nota fiscal com os dados processados
    const notaAtualizada = await prisma.notafiscal.update({
      where: { id },
      data: dadosAtualizacao
    });

    // Buscar dados do tomador para o log
    const tomador = await prisma.tomador.findUnique({
      where: { id: tomadorId },
      select: { razaoSocial: true, cpfCnpj: true }
    });

    // Registrar log de atualização da NFS-e
    await logService.registrarLog({
      usuarioId: userData.id,
      prestadorId: prestadorId,
      acao: 'Editar',
      entidade: 'NFS-e',
      entidadeId: id,
      descricao: `Usuário ${userData.nome} editou a NFS-e para o tomador ${tomador?.razaoSocial || 'Não identificado'}`,
      tela: 'NFS-e',
    });

    // Resposta final
    return NextResponse.json({
      success: true,
      message: "Nota fiscal atualizada com sucesso",
      data: notaAtualizada
    });
  } catch (error) {
    console.error("[NFSe Editar API] Erro:", error);
    return NextResponse.json(
      { success: false, error: "Erro ao editar NFSe", details: String(error) },
      { status: 500 }
    );
  } finally {
    // Verificar se o método $disconnect existe antes de chamá-lo
    if (prisma && typeof prisma.$disconnect === 'function') {
      await prisma.$disconnect();
    }
  }
}
