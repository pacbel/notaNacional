import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import * as authService from '@/services/authService';

export async function GET(request: NextRequest) {
  try {
    const isAuthenticated = await authService.isAuthenticated(request);
    if (!isAuthenticated) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const url = new URL(request.url);
    const situacao = url.searchParams.get('situacao') || 'todas';
    const cliente = url.searchParams.get('cliente') || '';
    const chave = url.searchParams.get('chave') || '';
    const numeroNfe = url.searchParams.get('numeroNfe') || '';
    const danfeImpresso = url.searchParams.get('danfeImpresso');
    const dataInicio = url.searchParams.get('dataInicio');
    const dataFim = url.searchParams.get('dataFim');

    const where: any = {};

    if (situacao !== 'todas') {
      const map: Record<string, string> = {
        nao_transmitida: '0',
        autorizada: '1',
        cancelada: '2',
        em_espera: '3',
        rejeitada: '4',
        processando: '5',
      };
      where.status = map[situacao] ?? situacao;
    }
    if (cliente) where.nomeCliente = { contains: cliente };
    if (chave) where.chaveAcesso = { contains: chave };
    if (numeroNfe) where.numero = Number(numeroNfe) || -1;
    if (danfeImpresso === 'true') where.danfeImpresso = true;

    // Filtro de datas (inclusivo) — aceita dd/mm/yyyy e yyyy-mm-dd
    if (dataInicio || dataFim) {
      const parseDataLocal = (valor: string): Date | null => {
        if (!valor) return null;
        // dd/mm/yyyy
        if (valor.includes('/')) {
          const [dd, mm, yyyy] = valor.split('/').map((v) => parseInt(v, 10));
          if (!isNaN(dd) && !isNaN(mm) && !isNaN(yyyy)) return new Date(yyyy, mm - 1, dd, 0, 0, 0, 0);
          return null;
        }
        // yyyy-mm-dd
        if (valor.includes('-')) {
          const [yyyy, mm, dd] = valor.split('-').map((v) => parseInt(v, 10));
          if (!isNaN(dd) && !isNaN(mm) && !isNaN(yyyy)) return new Date(yyyy, mm - 1, dd, 0, 0, 0, 0);
          return null;
        }
        return null;
      };

      const inicio = dataInicio ? parseDataLocal(dataInicio) : null;
      const fim = dataFim ? parseDataLocal(dataFim) : null;

      if (inicio || fim) {
        where.dataEmissao = {};
        if (inicio) {
          where.dataEmissao.gte = inicio; // início do dia local
        }
        if (fim) {
          // usar lt do dia seguinte para tornar inclusivo até 23:59:59.999
          const fimExclusivo = new Date(fim);
          fimExclusivo.setDate(fimExclusivo.getDate() + 1);
          where.dataEmissao.lt = fimExclusivo;
        }
      }
    }

    const data = await prisma.nfe.findMany({ where, orderBy: { dataEmissao: 'desc' }, include: { itens: true } });
    return NextResponse.json(data);
  } catch (error) {
    console.error('Erro ao listar NFe:', error);
    return NextResponse.json({ error: 'Erro ao listar NFe' }, { status: 500 });
  }
}

