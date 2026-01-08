import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';
import { getTokenData } from '@/services/authService';
import { logService } from '@/services/logService';

// Método PUT para atualizar apenas o status ativo/inativo
export async function PUT(request: NextRequest) {
  try {
    // Obter dados do usuário logado para o log
    const userData = await getTokenData(request);
    if (!userData) {
      return NextResponse.json(
        { message: 'Não autorizado' },
        { status: 401 }
      );
    }
    
    // Obter dados do corpo da requisição
    const data = await request.json();
    const { id, ativo } = data;
    
    if (!id) {
      return NextResponse.json(
        { error: 'ID do prestador não fornecido' },
        { status: 400 }
      );
    }
    
    // Buscar dados do prestador antes da atualização para o log
    const prestadorAntes = await prisma.prestador.findUnique({
      where: { id }
    });
    
    if (!prestadorAntes) {
      return NextResponse.json(
        { error: 'Prestador não encontrado' },
        { status: 404 }
      );
    }
    
    // Atualizar apenas o status ativo/inativo
    const prestador = await prisma.prestador.update({
      where: { id },
      data: {
        ativo: ativo
      } as any, // Usar tipagem flexível para resolver o erro de tipo
    });
    
    // Usar tipagem flexível para acessar o campo ativo
    const statusAnterior = (prestadorAntes as any).ativo ? 'ativo' : 'inativo';
    const novoStatus = ativo ? 'ativo' : 'inativo';
    
    // Registrar log de atualização do status
    await logService.registrarLog({
      usuarioId: userData.id,
      prestadorId: userData.prestadorId,
      acao: 'Editar',
      entidade: 'Prestador',
      entidadeId: id,
      descricao: `Usuário ${userData.nome} alterou o status do prestador ${prestador.razaoSocial} de ${statusAnterior} para ${novoStatus}`,
      tela: 'Prestadores',
    });

    return NextResponse.json({ success: true, prestador });
  } catch (error) {
    console.error('Erro ao atualizar status do prestador:', error);
    return NextResponse.json(
      { error: 'Erro ao atualizar status do prestador' },
      { status: 500 }
    );
  }
}

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
    const id = formData.get('id') as string;
    
    // Log para depuração
    console.log('Dados do formulário:', {
      id,
      optanteSimplesNacional: formData.get('optanteSimplesNacional'),
      incentivadorCultural: formData.get('incentivadorCultural'),
      exibirConstrucaoCivil: formData.get('exibirConstrucaoCivil'),
      regimeEspecialTributacao: formData.get('regimeEspecialTributacao'),
      customer_id_asaas: formData.get('customer_id_asaas'),
      integrado_asaas: formData.get('integrado_asaas')
    });
    
    // Log de todas as chaves do formData para verificar o que está sendo enviado
    const formDataEntries = Array.from(formData.entries());
    console.log('Todas as entradas do formData:', formDataEntries);
    
    if (!id) {
      return NextResponse.json(
        { error: 'ID do prestador não fornecido' },
        { status: 400 }
      );
    }
    
    // Buscar dados do prestador antes da atualização para o log
    const prestadorAntes = await prisma.prestador.findUnique({
      where: { id },
      select: {
        razaoSocial: true,
        cnpj: true,
        exibirConstrucaoCivil: true,
        optanteSimplesNacional: true,
        incentivadorCultural: true
      }
    });
    
    console.log('Dados do prestador antes da atualização:', prestadorAntes);
    
    if (!prestadorAntes) {
      return NextResponse.json(
        { error: 'Prestador não encontrado' },
        { status: 404 }
      );
    }
    
    // Verificar campos booleanos. Para optanteSimplesNacional, priorizar valor explícito do hidden ('true'|'false').
    const optanteSimplesNacionalField = formData.get('optanteSimplesNacional');
    const optanteSimplesNacional = optanteSimplesNacionalField !== null
      ? String(optanteSimplesNacionalField) === 'true'
      : formData.has('optanteSimplesNacional');
    const incentivadorCultural = formData.has('incentivadorCultural');
    const exibirConstrucaoCivil = formData.has('exibirConstrucaoCivil');
    
    // Processar campos de integração com ASAAS
    const integradoAsaas = formData.get('integrado_asaas') === 'true';
    const customerIdAsaas = formData.get('customer_id_asaas') as string || null;
    
    console.log('Valores processados:', {
      optanteSimplesNacional,
      incentivadorCultural,
      exibirConstrucaoCivil,
      integradoAsaas,
      customerIdAsaas
    });
    
    const baseData = {
      cnpj: formData.get('cnpj') as string,
      razaoSocial: formData.get('razaoSocial') as string,
      nomeFantasia: formData.get('nomeFantasia') as string || null,
      inscricaoMunicipal: formData.get('inscricaoMunicipal') as string,
      email: formData.get('email') as string,
      telefone: formData.get('telefone') as string,
      endereco: formData.get('endereco') as string,
      numero: formData.get('numero') as string,
      complemento: formData.get('complemento') as string || null,
      bairro: formData.get('bairro') as string,
      codigoMunicipio: formData.get('codigoMunicipio') as string,
      uf: formData.get('uf') as string,
      cep: formData.get('cep') as string,
      inscricaoEstadual: (formData.get('inscricaoEstadual') as string) || null,
      serie: formData.get('serie') as string,
      ambiente: parseInt(formData.get('ambiente') as string),
      optanteSimplesNacional: optanteSimplesNacional,
      incentivadorCultural: incentivadorCultural,
      exibirConstrucaoCivil: exibirConstrucaoCivil,
      regimeEspecialTributacao: parseInt(formData.get('regimeEspecialTributacao') as string) || 0,
      numeroRpsAtual: parseInt(formData.get('numeroRpsAtual') as string) || 100,
      customer_id_asaas: customerIdAsaas,
      integrado_asaas: integradoAsaas,
      // Novos campos de controle
      emitirNfse: formData.has('emitirNfse'),
      emitirNfe: formData.has('emitirNfe'),
      nfeAmbiente: parseInt((formData.get('nfeAmbiente') as string) || '2'),
      numeroNfeAtual: parseInt((formData.get('numeroNfeAtual') as string) || '1'),
      nfeSerie: (formData.get('nfeSerie') as string) || '1',
      ativo: ((formData.get('ativo') as string) === 'true')
    } as const;

    // Campos novos suscetíveis a falhar enquanto a migration não foi aplicada
    function deriveCodigoNacionalFromItem(codigoItem?: string): string | null {
      const raw = String(codigoItem || '').trim();
      if (!raw) return null;
      const onlyDigits = raw.replace(/\D+/g, '');
      if (onlyDigits.length === 6) return onlyDigits;
      if (onlyDigits.length === 4) return `${onlyDigits.slice(0,2)}${onlyDigits.slice(2)}00`;
      if (onlyDigits.length === 2) return `${onlyDigits}0000`;
      return null;
    }

    const advancedTaxData = {
      // Campos migrados de Serviço para Prestador
      codigoTributacao: (formData.get('codigoTributacao') as string) || null,
      itemListaServico: (formData.get('itemListaServico') as string) || null,
      aliquota: ((formData.get('aliquota') as string) ? (parseFloat((formData.get('aliquota') as string).replace(',', '.')) / 100) : 0),
      // Campos adicionais de tributação avançada
      codigoTribNacional: ((formData.get('codigoTribNacional') as string) || null),
      exigibilidadeIss: parseInt((formData.get('exigibilidadeIss') as string) || '2'),
      issRetido: ((formData.get('issRetido') as string) === '1'),
      tpRetIssqn: parseInt((formData.get('tpRetIssqn') as string) || '1'),
      tipoImunidade: parseInt((formData.get('tipoImunidade') as string) || '3'),
      valorTribFederal: parseFloat(((formData.get('valorTribFederal') as string) || '0').replace('.', '').replace(',', '.')) || 0,
      valorTribEstadual: parseFloat(((formData.get('valorTribEstadual') as string) || '0').replace('.', '').replace(',', '.')) || 0,
      totalTribMunicipal: parseFloat(((formData.get('totalTribMunicipal') as string) || '0').replace('.', '').replace(',', '.')) || 0,
      // Novo campo: situação perante o Simples Nacional (1 Não Optante, 2 MEI, 3 ME/EPP)
      opSimpNac: parseInt((formData.get('opSimpNac') as string) || '1'),
    } as const;

    // Se codigoTribNacional veio vazio/ inválido, derivar do itemListaServico
    let codigoTribNacionalEfetivo = (advancedTaxData as any).codigoTribNacional as string | null;
    if (!codigoTribNacionalEfetivo || !/^\d{6}$/.test(codigoTribNacionalEfetivo)) {
      const derivado = deriveCodigoNacionalFromItem((advancedTaxData as any).itemListaServico as string | undefined);
      if (derivado) {
        console.log('API /prestadores/update - Derivando codigoTribNacional a partir de itemListaServico:', derivado);
        (advancedTaxData as any).codigoTribNacional = derivado;
      }
    }

    let dataToUpdate = { ...baseData, ...advancedTaxData } as any;
    
    console.log('Dados que serão enviados para atualização:', dataToUpdate);
    
    let prestador;
    try {
      prestador = await prisma.prestador.update({
        where: { id },
        data: dataToUpdate,
        // Seleciona apenas colunas existentes para evitar P2022 quando houver campos novos não migrados
        select: { id: true }
      });
    } catch (err: any) {
      // Se o client ainda não tem a coluna (migration pendente), aplicar fallback em cascata
      const msg = String(err?.message || '');
      if (msg.includes('Unknown argument `tpRetIssqn`')) {
        console.warn('Campo tpRetIssqn ausente no schema Prisma (migration pendente). Atualizando sem este campo.');
        delete (dataToUpdate as any).tpRetIssqn;
        try {
          prestador = await prisma.prestador.update({
            where: { id },
            data: dataToUpdate,
            select: { id: true }
          });
        } catch (innerErr: any) {
          const msg2 = String(innerErr?.message || '');
          if (msg2.includes('Unknown argument `opSimpNac`')) {
            console.warn('Campo opSimpNac ausente no schema Prisma (migration pendente). Atualizando sem este campo.');
            delete (dataToUpdate as any).opSimpNac;
            prestador = await prisma.prestador.update({
              where: { id },
              data: dataToUpdate,
              select: { id: true }
            });
          } else {
            throw innerErr;
          }
        }
      } else if (msg.includes('Unknown argument `opSimpNac`')) {
        console.warn('Campo opSimpNac ausente no schema Prisma (migration pendente). Atualizando sem este campo.');
        delete (dataToUpdate as any).opSimpNac;
        prestador = await prisma.prestador.update({
          where: { id },
          data: dataToUpdate,
          select: { id: true }
        });
      } else if (err?.code === 'P2022') {
        // Se a coluna não existir, tentar novamente apenas com os campos base para não bloquear a atualização
        console.warn('Coluna ausente detectada ao atualizar prestador. Fazendo retry com UPDATE manual apenas com colunas existentes.', err?.meta);
        const sql = `
          UPDATE prestador SET
            cnpj = ?,
            razaoSocial = ?,
            nomeFantasia = ?,
            inscricaoMunicipal = ?,
            email = ?,
            telefone = ?,
            endereco = ?,
            numero = ?,
            complemento = ?,
            bairro = ?,
            codigoMunicipio = ?,
            uf = ?,
            cep = ?,
            inscricaoEstadual = ?,
            serie = ?,
            ambiente = ?,
            optanteSimplesNacional = ?,
            incentivadorCultural = ?,
            exibirConstrucaoCivil = ?,
            regimeEspecialTributacao = ?,
            numeroRpsAtual = ?,
            customer_id_asaas = ?,
            integrado_asaas = ?,
            emitirNfse = ?,
            emitirNfe = ?,
            nfeAmbiente = ?,
            numeroNfeAtual = ?,
            nfeSerie = ?,
            ativo = ?
          WHERE id = ?
        `;
        await prisma.$executeRawUnsafe(
          sql,
          baseData.cnpj,
          baseData.razaoSocial,
          baseData.nomeFantasia,
          baseData.inscricaoMunicipal,
          baseData.email,
          baseData.telefone,
          baseData.endereco,
          baseData.numero,
          baseData.complemento,
          baseData.bairro,
          baseData.codigoMunicipio,
          baseData.uf,
          baseData.cep,
          (baseData as any).inscricaoEstadual ?? null,
          (baseData as any).serie,
          (baseData as any).ambiente,
          (baseData as any).optanteSimplesNacional,
          (baseData as any).incentivadorCultural,
          (baseData as any).exibirConstrucaoCivil,
          (baseData as any).regimeEspecialTributacao,
          (baseData as any).numeroRpsAtual,
          (baseData as any).customer_id_asaas,
          (baseData as any).integrado_asaas,
          (baseData as any).emitirNfse,
          (baseData as any).emitirNfe,
          (baseData as any).nfeAmbiente,
          (baseData as any).numeroNfeAtual,
          (baseData as any).nfeSerie,
          (baseData as any).ativo,
          id
        );
        // Buscar minimalmente para compor resposta
        prestador = await prisma.prestador.findUnique({
          where: { id },
          select: { id: true }
        });
      } else {
        throw err;
      }
    }
    
    // Verificar se a atualização foi bem-sucedida
    const prestadorAtualizado = await prisma.prestador.findUnique({
      where: { id },
      select: {
        exibirConstrucaoCivil: true,
        optanteSimplesNacional: true,
        incentivadorCultural: true,
        regimeEspecialTributacao: true
      }
    });
    
    console.log('Dados do prestador após a atualização:', prestadorAtualizado);
    
    // Registrar log de atualização do prestador
    await logService.registrarLog({
      usuarioId: userData.id,
      prestadorId: userData.prestadorId,
      acao: 'Editar',
      entidade: 'Prestador',
      entidadeId: id,
      descricao: `Usuário ${userData.nome} atualizou o prestador ${prestadorAntes?.razaoSocial ?? ''} (CNPJ: ${prestadorAntes?.cnpj ?? ''})`,
      tela: 'Prestadores',
    });

    // Obter o host e protocolo da requisição para criar uma URL absoluta correta
    const host = request.headers.get('host') || 'app.nfsebh.com.br';
    const protocol = request.headers.get('x-forwarded-proto') || 'https';
    return NextResponse.redirect(`${protocol}://${host}/prestadores`);
  } catch (error) {
    console.error('Erro ao atualizar prestador:', error);
    return NextResponse.json(
      { error: 'Erro ao atualizar prestador' },
      { status: 500 }
    );
  }
}
