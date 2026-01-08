import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  if (!params) {
    console.error('[NFSe API] Parâmetros não encontrados');
    return NextResponse.json({ error: 'Parâmetros não encontrados' }, { status: 400 });
  }
  // Resolver os parâmetros de forma assíncrona
  const { id } = await Promise.resolve(params);
  try {
    // Buscar a nota fiscal com suas relações, incluindo os itens
    const nota = await prisma.notafiscal.findUnique({
      where: { id },
      include: {
        prestador: {
          select: {
            id: true,
            cnpj: true,
            razaoSocial: true,
            codigoMunicipio: true,
            uf: true,
            cep: true,
            endereco: true,
            numero: true,
            complemento: true,
            bairro: true,
            telefone: true,
            email: true,
            serie: true,
            numeroRpsAtual: true,
            ambiente: true,
            optanteSimplesNacional: true,
            regimeEspecialTributacao: true,
            itemListaServico: true,
            codigoTributacao: true,
            aliquota: true,
            codigoTribNacional: true,
            exigibilidadeIss: true,
            tipoImunidade: true,
            valorTribFederal: true,
            valorTribEstadual: true,
            totalTribMunicipal: true,
            // opSimpNac intencionalmente omitido para compatibilidade antes da migration
          }
        },
        tomador: true,
        itemnotafiscal: {
          include: {
            servico: true,
          }
        }
      }
    });
    
    
    if (!nota) {
      return NextResponse.json({ error: 'Nota não encontrada' }, { status: 404 });
    }
    
    
    // Buscar todos os campos da nota fiscal para identificar campos personalizados de serviços
    const notaCompleta = await prisma.$queryRaw`
      SELECT * FROM notafiscal WHERE id = ${id}
    `;
    
    
    if (!notaCompleta || !Array.isArray(notaCompleta) || notaCompleta.length === 0) {
      console.warn('[NFSe API] Não foi possível obter os campos personalizados, retornando nota normal');
      return NextResponse.json(nota);
    }
    
    const dadosCompletos = notaCompleta[0];
    
    // Extrair campos personalizados dos serviços
    const camposPersonalizados: Record<string, any> = {};
    for (const [chave, valor] of Object.entries(dadosCompletos)) {
      // Identificar campos personalizados (quantidade_ID, valorUnitario_ID, valorTotal_ID)
      if (
        chave.startsWith('quantidade_') || 
        chave.startsWith('valorUnitario_') || 
        chave.startsWith('valorTotal_') ||
        chave === 'servicoId'
      ) {
        camposPersonalizados[chave] = valor;
      }
    }
    
    // Combinar a nota com os campos personalizados
    const notaComServicos = {
      ...nota,
      ...camposPersonalizados
    };
    
    
    // Usar uma variável separada para o log para evitar problemas de tipagem
    const logInfo = {
      id: notaComServicos.id,
      camposPersonalizados: Object.keys(camposPersonalizados)
    };
    
    // Verificar se existe servicoId antes de tentar acessá-lo
    if ('servicoId' in camposPersonalizados) {
      console.log('[NFSe API] servicoId encontrado nos campos personalizados');
    } else {
      console.log('[NFSe API] servicoId não encontrado nos campos personalizados');
    }
    
    // Garantir que os itens da nota fiscal tenham as informações necessárias
    if (nota.itemnotafiscal && Array.isArray(nota.itemnotafiscal)) {
      console.log(`[NFSe API] Número de itens na nota fiscal: ${nota.itemnotafiscal.length}`);
    } else {
      console.log('[NFSe API] Nota fiscal não possui itens ou itemnotafiscal não é um array');
    }
    
    
    return NextResponse.json(notaComServicos);
  } catch (error) {
    console.error('[NFSe API][GET /api/nfse/:id] Erro ao buscar nota fiscal:', error);
    return NextResponse.json({ error: 'Erro ao buscar nota fiscal', details: String(error) }, { status: 500 });
  }
}

export async function POST() {
  return NextResponse.json({ error: 'Método não permitido' }, { status: 405 });
}

export async function PUT() {
  return NextResponse.json({ error: 'Método não permitido' }, { status: 405 });
}

export async function DELETE() {
  return NextResponse.json({ error: 'Método não permitido' }, { status: 405 });
}