import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { hash } from 'bcryptjs';
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
    
    const formData = await request.formData();
    
    // Usar o Prisma para criar o prestador
    // O Prisma vai gerar um ID automaticamente com o @default(uuid())
    // Criar o prestador com transação para garantir que o usuário também seja criado
    const prestadorId = randomUUID();
    const now = new Date();
    
    const opSimpNac = parseInt((formData.get('opSimpNac') as string) || '1');
    const prestadorData: any = {
      cnpj: formData.get('cnpj') as string,
      razaoSocial: formData.get('razaoSocial') as string,
      nomeFantasia: formData.get('nomeFantasia') as string || null,
      inscricaoMunicipal: formData.get('inscricaoMunicipal') as string,
      inscricaoEstadual: (formData.get('inscricaoEstadual') as string) || null,
      email: formData.get('email') as string,
      telefone: formData.get('telefone') as string,
      endereco: formData.get('endereco') as string,
      numero: formData.get('numero') as string,
      complemento: formData.get('complemento') as string || null,
      bairro: formData.get('bairro') as string,
      codigoMunicipio: formData.get('codigoMunicipio') as string,
      uf: formData.get('uf') as string,
      cep: formData.get('cep') as string,
      serie: formData.get('serie') as string || '1',
      ambiente: parseInt(formData.get('ambiente') as string) || 2,
      // Legado: hidden field do form converte o combo em boolean (1->false, 2/3->true)
      optanteSimplesNacional: formData.get('optanteSimplesNacional') === 'true',
      // Novo: situação perante o Simples Nacional
      opSimpNac,
      incentivadorCultural: formData.get('incentivadorCultural') === 'true',
      exibirConstrucaoCivil: formData.has('exibirConstrucaoCivil'),
      tpRetIssqn: parseInt((formData.get('tpRetIssqn') as string) || '1'),
      // Novos controles de emissão
      emitirNfse: formData.has('emitirNfse'),
      emitirNfe: formData.has('emitirNfe'),
      nfeAmbiente: parseInt((formData.get('nfeAmbiente') as string) || '2'),
      numeroNfeAtual: parseInt((formData.get('numeroNfeAtual') as string) || '1'),
      nfeSerie: (formData.get('nfeSerie') as string) || '1',
      customer_id_asaas: null,
      integrado_asaas: false
    };
    
    // Tentar criar com opSimpNac; se a coluna não existir, tentar novamente sem ela.
    const runCreate = async (tx: any) => {
      return tx.prestador.create({
        data: {
          id: prestadorId,
          ...prestadorData,
          createdAt: now,
          updatedAt: now,
        },
      });
    };

    await prisma.$transaction(async (tx) => {
      // 1. Criar o prestador
      let prestador;
      try {
        prestador = await runCreate(tx);
      } catch (err: any) {
        const msg = String(err?.message || '');
        if (msg.includes('Unknown argument `opSimpNac`')) {
          // Remover campo e tentar novamente
          delete prestadorData.opSimpNac;
          prestador = await runCreate(tx);
        } else {
          throw err;
        }
      }
      
      // 2. Criar um usuário padrão para o prestador
      const senhaHash = await hash('admin', 10);
      await tx.usuario.create({
        data: {
          id: randomUUID(),
          nome: 'Administrador',
          email: formData.get('email') as string, // Usar o mesmo email do prestador
          username: 'admin',
          password: senhaHash,
          role: 'Administrador',
          ativo: true,
          prestadorId: prestador.id,
          createdAt: now,
          updatedAt: now
        }
      });
      
      // 3. Registrar log de criação do prestador
      await logService.registrarLog({
        usuarioId: userData.id,
        prestadorId: userData.prestadorId || prestadorId, // Usar o prestadorId do usuário logado ou do novo prestador se for Master
        acao: 'Criar',
        entidade: 'Prestador',
        entidadeId: prestadorId,
        descricao: `Usuário ${userData.nome} criou o prestador ${prestadorData.razaoSocial} (CNPJ: ${prestadorData.cnpj})`,
        tela: 'Prestadores',
      });
    });

    // Obter o host e protocolo da requisição para criar uma URL absoluta correta
    const host = request.headers.get('host') || 'app.nfsebh.com.br';
    const protocol = request.headers.get('x-forwarded-proto') || 'https';
    return NextResponse.redirect(`${protocol}://${host}/prestadores`);
  } catch (error) {
    console.error('Erro ao criar prestador:', error);
    return NextResponse.json(
      { error: 'Erro ao criar prestador e usuário padrão' },
      { status: 500 }
    );
  }
}
