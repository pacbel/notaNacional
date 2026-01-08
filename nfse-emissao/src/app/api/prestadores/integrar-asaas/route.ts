import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { integrarPrestadorAsaas } from '@/services/asaasClienteService';
import { verifyJwt } from '@/services/authService';
import { v4 as uuidv4 } from 'uuid';

const prisma = new PrismaClient();

// Constantes para a API do ASAAS
const ASAAS_API_URL = process.env.NEXT_PUBLIC_ASAAS_BASE_URL || 'https://api-sandbox.asaas.com/v3';
const ASAAS_API_KEY = process.env.ASAAS_API_KEY || '$aact_hmlg_000MzkwODA2MWY2OGM3MWRlMDU2NWM3MzJlNzZmNGZhZGY6Ojg2NzFlYTE5LWRjMTktNDYyOS1iYWY4LWZjMzQ2ZDNhNmNiYjo6JGFhY2hfMjYxMDU5NDAtZDMwNy00MjI3LWFhYWYtODliNmVlMDdhNWQx';

/**
 * POST - Integrar prestador com o ASAAS
 */
export async function POST(request: NextRequest) {
  try {
    // Verificar autenticação
    const authToken = request.cookies.get('auth-token')?.value;
    if (!authToken) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    // Verificar se o token é válido
    let tokenData;
    try {
      tokenData = await verifyJwt(authToken);
    } catch (error) {
      console.error('Erro ao verificar token:', error);
      return NextResponse.json({ error: 'Token inválido ou expirado' }, { status: 401 });
    }

    // Verificar se o usuário é Master ou Administrador
    if (tokenData.role !== 'Master' && tokenData.role !== 'Administrador') {
      return NextResponse.json({ error: 'Permissão negada' }, { status: 403 });
    }

    // Obter dados do corpo da requisição
    const { prestadorId } = await request.json();

    if (!prestadorId) {
      return NextResponse.json({ error: 'ID do prestador é obrigatório' }, { status: 400 });
    }

    // Buscar prestador no banco de dados
    const prestador = await prisma.prestador.findUnique({
      where: { id: prestadorId }
    });

    if (!prestador) {
      return NextResponse.json({ error: 'Prestador não encontrado' }, { status: 404 });
    }

    // Verificar se o prestador já está integrado
    if (prestador.integrado_asaas && prestador.customer_id_asaas) {
      return NextResponse.json({ 
        message: 'Prestador já está integrado com o ASAAS',
        customerId: prestador.customer_id_asaas
      });
    }

    try {
      // Integrar prestador com o ASAAS
      const customerId = await integrarPrestadorAsaas({
        id: prestador.id,
        cnpj: prestador.cnpj,
        razaoSocial: prestador.razaoSocial,
        email: prestador.email,
        telefone: prestador.telefone || '',
        endereco: prestador.endereco,
        numero: prestador.numero,
        complemento: prestador.complemento || '',
        bairro: prestador.bairro,
        cep: prestador.cep,
        uf: prestador.uf,
        inscricaoMunicipal: prestador.inscricaoMunicipal
      });

      // Atualizar prestador no banco de dados
      await prisma.prestador.update({
        where: { id: prestadorId },
        data: {
          customer_id_asaas: customerId,
          integrado_asaas: true
        }
      });

      // Registrar log da operação
      await prisma.log.create({
        data: {
          id: uuidv4(),
          prestadorId: prestadorId,
          usuarioId: tokenData.id,
          acao: 'Integração',
          entidade: 'Prestador',
          entidadeId: prestadorId,
          descricao: `Prestador integrado com o ASAAS. Customer ID: ${customerId}`,
          tela: 'Prestadores'
        }
      });

      return NextResponse.json({ 
        message: 'Prestador integrado com sucesso',
        customerId
      });
    } catch (integrationError: any) {
      console.error('Erro específico na integração com ASAAS:', integrationError);
      return NextResponse.json(
        { 
          error: 'Erro ao integrar prestador com ASAAS', 
          message: integrationError.message || 'Falha na comunicação com a API do ASAAS'
        },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error('Erro ao integrar prestador com ASAAS:', error);
    return NextResponse.json(
      { error: 'Erro ao integrar prestador', message: error.message },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
