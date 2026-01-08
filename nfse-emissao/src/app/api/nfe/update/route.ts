import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';
import { getTokenData } from '@/services/authService';
import { logService } from '@/services/logService';

export async function POST(request: NextRequest) {
  try {
    const userData = await getTokenData(request);
    if (!userData) {
      return NextResponse.json({ message: 'Não autorizado' }, { status: 401 });
    }

    const contentType = request.headers.get('content-type') || '';

    let body: any = {};
    if (contentType.includes('application/json')) {
      body = await request.json();
    } else {
      const form = await request.formData();
      body = Object.fromEntries(form.entries());
      body.danfeImpresso = String(body.danfeImpresso || '') === 'on';
    }

    const id = String(body.id || '');
    if (!id) return NextResponse.json({ error: 'ID não informado' }, { status: 400 });

    // Número e Série não podem ser alterados na edição: buscar do banco e manter
    const atual = await prisma.nfe.findUnique({ where: { id } });
    if (!atual) return NextResponse.json({ error: 'NFe não encontrada' }, { status: 404 });
    const numero = atual.numero;
    const serie = atual.serie;
    const cnpjCliente = String(body.cnpjCliente || '');
    const nomeCliente = body.nomeCliente ? String(body.nomeCliente) : null;
    const dataEmissao = body.dataEmissao ? new Date(String(body.dataEmissao)) : new Date();
    const status = (body.status as string) || '0';
    const protocolo = body.protocolo ? String(body.protocolo) : null;
    const chaveAcesso = body.chaveAcesso ? String(body.chaveAcesso) : null;
    const danfeImpresso = Boolean(body.danfeImpresso);
    const itens: Array<any> = Array.isArray(body.itens) ? body.itens : [];
    const pagamentos: Array<any> = Array.isArray(body.pagamentos) ? body.pagamentos : [];
    // Transporte
    const modalidadeFrete = body.modalidadeFrete !== undefined ? Number(body.modalidadeFrete) : 0;
    const transportadoraId = body.transportadoraId ? String(body.transportadoraId) : null;
    const ufVeiculo = body.ufVeiculo ? String(body.ufVeiculo) : null;
    const placaVeiculo = body.placaVeiculo ? String(body.placaVeiculo) : null;
    const valorFrete = body.valorFrete !== undefined ? Number(body.valorFrete) : 0;
    const volumes = body.volumes !== undefined ? Number(body.volumes) : 0;
    const tipoVolume = body.tipoVolume ? String(body.tipoVolume) : null;
    const marcaVolume = body.marcaVolume ? String(body.marcaVolume) : null;
    const pesoBruto = body.pesoBruto !== undefined ? Number(body.pesoBruto) : 0;
    const pesoLiquido = body.pesoLiquido !== undefined ? Number(body.pesoLiquido) : 0;

    // Dados da NFe
    const finalidadeEmissao = body.finalidadeEmissao ? String(body.finalidadeEmissao) : 'Normal';
    const natureza = body.natureza ? String(body.natureza) : null;
    const tipoDoc = body.tipoDoc ? String(body.tipoDoc) : null;
    const desconto = body.desconto !== undefined ? Number(body.desconto) : 0;
    const tipoOper = body.tipoOper ? String(body.tipoOper) : null;
    const operacao = body.operacao ? String(body.operacao) : null;
    const formaPgto = body.formaPgto ? String(body.formaPgto) : null;
    const percCreditoSimples = body.percCreditoSimples !== undefined ? Number(body.percCreditoSimples) : 0;
    const cfopAlternativo = body.cfopAlternativo ? String(body.cfopAlternativo) : null;
    const consumidorFinal = body.consumidorFinal !== undefined ? Boolean(body.consumidorFinal) : false;

    // Adicionais
    const numeroPedido = body.numeroPedido ? String(body.numeroPedido) : null;
    const nomeVendedor = body.nomeVendedor ? String(body.nomeVendedor) : null;
    const outrasDespesasAcessorias = body.outrasDespesasAcessorias !== undefined ? Number(body.outrasDespesasAcessorias) : 0;
    const obsAdicionais = body.obsAdicionais ? String(body.obsAdicionais) : null;
    const infAdFisco = body.infAdFisco ? String(body.infAdFisco) : null;

    const valorTotal = itens.reduce((acc, it) => acc + (Number(it.quantidade) * Number(it.valorUnit)), 0);

    await prisma.$transaction(async (tx) => {
      await tx.nfe.update({
        where: { id },
        data: {
          // numero e serie permanecem inalterados
          numero,
          serie,
          cnpjCliente,
          nomeCliente,
          dataEmissao,
          valorTotal,
          status,
          protocolo,
          chaveAcesso,
          danfeImpresso,
          // Transporte
          modalidadeFrete,
          transportadoraId,
          ufVeiculo,
          placaVeiculo,
          valorFrete,
          volumes,
          tipoVolume,
          marcaVolume,
          pesoBruto,
          pesoLiquido,
          // Dados da NFe
          finalidadeEmissao,
          natureza,
          tipoDoc,
          desconto,
          tipoOper,
          operacao,
          formaPgto,
          percCreditoSimples,
          cfopAlternativo,
          consumidorFinal,
          // Adicionais
          numeroPedido,
          nomeVendedor,
          outrasDespesasAcessorias,
          obsAdicionais,
          infAdFisco,
        } as any,
      });

      // Substitui os itens
      await tx.nfeItem.deleteMany({ where: { nfeId: id } });
      if (itens.length > 0) {
        await tx.nfeItem.createMany({
          data: itens.map((it) => ({
            nfeId: id,
            produtoId: it.produtoId ? String(it.produtoId) : null,
            descricao: String(it.descricao || ''),
            quantidade: Number(it.quantidade) || 0,
            valorUnit: Number(it.valorUnit) || 0,
            valorTotal: (Number(it.quantidade) || 0) * (Number(it.valorUnit) || 0),
            ncm: it.ncm ? String(it.ncm) : null,
            cfop: it.cfop ? String(it.cfop) : null,
            cst: it.cst ? String(it.cst) : null,
            ipi: it.ipi !== undefined ? Number(it.ipi) : 0,
            pis: it.pis !== undefined ? Number(it.pis) : 0,
            cofins: it.cofins !== undefined ? Number(it.cofins) : 0,
          })),
        });
      }

      // Substitui os pagamentos
      await tx.nfePagamento.deleteMany({ where: { nfeId: id } });
      if (pagamentos.length > 0) {
        await tx.nfePagamento.createMany({
          data: pagamentos.map((p) => ({
            nfeId: id,
            formaPagamentoCodigo: Number(p.formaPagamentoCodigo),
            formaPagamentoDescricao: String(p.formaPagamentoDescricao || ''),
            numeroParcela: p.numeroParcela !== undefined ? Number(p.numeroParcela) : null,
            numeroDocumento: p.numeroDocumento ? String(p.numeroDocumento) : null,
            dataVencimento: p.dataVencimento ? new Date(String(p.dataVencimento)) : null,
            valor: Number(p.valor) || 0,
            operadoraCartaoId: p.operadoraCartaoId ? String(p.operadoraCartaoId) : null,
            autorizacao: p.autorizacao ? String(p.autorizacao) : null,
          })),
        });
      }
    });

    await logService.registrarLog({
      usuarioId: userData.id,
      prestadorId: userData.prestadorId,
      acao: 'Editar',
      entidade: 'NFe',
      entidadeId: id,
      descricao: `Usuário ${userData.nome} atualizou a NFe nº ${numero}/${serie}`,
      tela: 'NFe',
    });

    return NextResponse.json({ ok: true, id });
  } catch (error) {
    console.error('Erro ao atualizar NFe:', error);
    return NextResponse.json({ error: 'Erro ao atualizar NFe' }, { status: 500 });
  }
}
