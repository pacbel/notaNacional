import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import * as authService from '@/services/authService';

export async function GET(request: NextRequest) {
  try {
    // Verificar autenticação
    const isAuthenticated = await authService.isAuthenticated(request);
    if (!isAuthenticated) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }
    
    // Obter parâmetro de filtro da URL
    const url = new URL(request.url);
    const filtro = url.searchParams.get('filtro') || 'ativos';
    
    // Definir condição de filtro
    let where = {};
    if (filtro === 'ativos') {
      where = { ativo: true };
    } else if (filtro === 'inativos') {
      where = { ativo: false };
    }
    
    // Buscar prestadores do banco de dados com filtro
    const prestadores = await prisma.prestador.findMany({
      where,
      orderBy: {
        razaoSocial: 'asc'
      },
      select: {
        id: true,
        cnpj: true,
        razaoSocial: true,
        inscricaoMunicipal: true,
        nomeFantasia: true,
        email: true,
        telefone: true,
        ativo: true,
        customer_id_asaas: true,
        integrado_asaas: true
      }
    });
    
    // Garantir que os campos de integração com ASAAS estejam com os tipos corretos
    const prestadoresFormatados = prestadores.map(p => ({
      ...p,
      // Garantir que integrado_asaas seja sempre um booleano
      integrado_asaas: Boolean(p.integrado_asaas),
      // Garantir que customer_id_asaas seja uma string ou null
      customer_id_asaas: p.customer_id_asaas || null
    }));
    
    // Log para depurar os dados dos prestadores
    console.log('Prestadores encontrados:', prestadoresFormatados.length);
    prestadoresFormatados.forEach(p => {
      console.log(`Prestador ${p.id} - ${p.razaoSocial}:`, {
        customer_id_asaas: p.customer_id_asaas,
        tipo_customer_id: typeof p.customer_id_asaas,
        integrado_asaas: p.integrado_asaas,
        tipo_integrado: typeof p.integrado_asaas
      });
    });

    return NextResponse.json(prestadoresFormatados);
  } catch (error) {
    console.error('Erro ao listar prestadores:', error);
    return NextResponse.json({ error: 'Erro ao listar prestadores' }, { status: 500 });
  }
}
