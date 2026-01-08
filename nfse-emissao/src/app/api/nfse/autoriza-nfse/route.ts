import { NextRequest, NextResponse } from 'next/server';
import { gunzipSync } from 'zlib';
import { prisma } from '@/lib/prisma';
import { getTokenData } from '@/services/authService';
import { logService } from '@/services/logService';

/**
 * Endpoint para autorização da NFSe e incremento do número do RPS
 * 
 * Este endpoint só deve ser chamado após a confirmação de que a NFSe
 * foi processada com sucesso pela prefeitura. Em caso de rejeição ou
 * erro no processamento, o número do RPS não deve ser incrementado.
 */

export async function POST(request: NextRequest) {
  console.log('[API:AutorizaNFSe] Iniciando processo de autorização da NFSe e incremento do número do RPS');
  try {
    // Obter dados do usuário logado para o log
    console.log('[API:AutorizaNFSe] Verificando autenticação do usuário');
    const userData = await getTokenData(request);
    if (!userData) {
      console.error('[API:AutorizaNFSe] Usuário não autenticado');
      return NextResponse.json(
        { message: 'Não autorizado' },
        { status: 401 }
      );
    }
    console.log(`[API:AutorizaNFSe] Usuário autenticado: ${userData.email} (ID: ${userData.id})`);

    const { notaFiscalId, retornoEmissao } = await request.json();
    console.log(`[API:AutorizaNFSe] ID da nota fiscal recebido: ${notaFiscalId}`);
    if (retornoEmissao) {
      console.log('[API:AutorizaNFSe] retornoEmissao (preview):', JSON.stringify(retornoEmissao).slice(0, 1000))
    }

    if (!notaFiscalId) {
      console.error('[API:AutorizaNFSe] ID da nota fiscal não informado');
      return NextResponse.json(
        { error: 'ID da nota fiscal não informado' },
        { status: 400 }
      );
    }

    // Buscar dados da nota fiscal para o log
    console.log(`[API:AutorizaNFSe] Buscando dados da nota fiscal ${notaFiscalId}`);
    const notaFiscal = await prisma.notafiscal.findUnique({
      where: { id: notaFiscalId },
      include: {
        prestador: true,
        tomador: true
      }
    });
    
    if (!notaFiscal) {
      console.error(`[API:AutorizaNFSe] Nota fiscal ${notaFiscalId} não encontrada`);
      return NextResponse.json(
        { error: 'Nota fiscal não encontrada' },
        { status: 404 }
      );
    }
    
    console.log(`[API:AutorizaNFSe] Nota fiscal encontrada: ${notaFiscalId}`);
    console.log(`[API:AutorizaNFSe] Status atual: ${notaFiscal.status}`);
    console.log(`[API:AutorizaNFSe] Prestador: ${notaFiscal.prestador.razaoSocial} (ID: ${notaFiscal.prestadorId})`);
    console.log(`[API:AutorizaNFSe] Número RPS atual do prestador: ${notaFiscal.prestador.numeroRpsAtual}`);
    console.log(`[API:AutorizaNFSe] Tomador: ${notaFiscal.tomador.razaoSocial} (ID: ${notaFiscal.tomadorId})`);
    
    // Verificar se a nota já está autorizada
    if (notaFiscal.status === '1') {
      console.warn(`[API:AutorizaNFSe] Nota fiscal ${notaFiscalId} já está autorizada. Não será incrementado o número do RPS novamente.`);
      return NextResponse.json({ 
        success: true,
        message: 'Nota fiscal já autorizada anteriormente'
      });
    }
    
    // Iniciar transação para garantir consistência dos dados
    console.log(`[API:AutorizaNFSe] Iniciando transação para autorizar a nota fiscal ${notaFiscalId} e incrementar o número do RPS`);
    const resultado = await prisma.$transaction(async (tx) => {
      console.log(`[API:AutorizaNFSe] Atualizando status da nota fiscal ${notaFiscalId} para "1" (Autorizada)`);
      // 1. Atualiza o status da nota fiscal para "1" (Autorizada)
      await tx.notafiscal.update({
        where: { id: notaFiscalId },
        data: { status: "1" },
      });

      console.log(`[API:AutorizaNFSe] Incrementando o contador de RPS do prestador ${notaFiscal.prestadorId}`);
      // 2. Incrementa o contador de RPS do prestador e obtém o novo valor
      const prestadorAtualizado = await tx.prestador.update({
        where: { id: notaFiscal.prestadorId },
        data: {
          numeroRpsAtual: {
            increment: 1
          }
        },
        select: {
          numeroRpsAtual: true,
          razaoSocial: true
        }
      });
      console.log(`[API:AutorizaNFSe] Número do RPS incrementado para: ${prestadorAtualizado.numeroRpsAtual}`);

      console.log(`[API:AutorizaNFSe] Atualizando o número da nota fiscal ${notaFiscalId} com o novo número do RPS`);
      // 3. Atualiza o número da nota fiscal com o número do RPS incrementado
      // Isso garante que o número do RPS seja atribuído corretamente à nota fiscal
      // 3. Atualiza o número e, se disponíveis, dados retornados (chave, protocolo, xml)
      const atualizacoesNota: any = {
        numero: prestadorAtualizado.numeroRpsAtual.toString()
      };
      if (retornoEmissao) {
        // tentar mapear campos comuns do retorno
        if (typeof retornoEmissao.chaveAcesso === 'string' && retornoEmissao.chaveAcesso.length >= 44) {
          atualizacoesNota.chaveAcesso = retornoEmissao.chaveAcesso;
        }
        if (typeof retornoEmissao.protocolo === 'string') {
          atualizacoesNota.protocolo = retornoEmissao.protocolo;
        }
        if (typeof retornoEmissao.xmlNFSe === 'string' && retornoEmissao.xmlNFSe.length > 50) {
          atualizacoesNota.nfseXML = retornoEmissao.xmlNFSe;
          const chaveFromXml = tryExtractChave(retornoEmissao.xmlNFSe);
          if (chaveFromXml) atualizacoesNota.chaveAcesso = chaveFromXml;
        }
        if (typeof retornoEmissao.nfse_base64_gzip === 'string' && retornoEmissao.nfse_base64_gzip.length > 0) {
          try {
            const buf = Buffer.from(retornoEmissao.nfse_base64_gzip, 'base64');
            const xmlUngz = gunzipSync(buf).toString('utf-8');
            // salvar XML se ainda não salvo
            if (!atualizacoesNota.nfseXML && xmlUngz) atualizacoesNota.nfseXML = xmlUngz;
            const chaveFromGzip = tryExtractChave(xmlUngz);
            if (chaveFromGzip) atualizacoesNota.chaveAcesso = chaveFromGzip;
          } catch (e) {
            console.warn('[API:AutorizaNFSe] Falha ao abrir nfse_base64_gzip:', (e as any)?.message || String(e))
          }
        }
        if (typeof retornoEmissao.url_nfse === 'string') {
          atualizacoesNota.arquivoNfse = retornoEmissao.url_nfse;
          // tentar extrair chave da URL (parâmetro chave/chaveAcesso)
          try {
            const u = new URL(retornoEmissao.url_nfse);
            const chaveParam = u.searchParams.get('chave') || u.searchParams.get('chaveAcesso') || '';
            if (chaveParam && /^\d{44,60}$/.test(chaveParam)) {
              atualizacoesNota.chaveAcesso = chaveParam;
            }
          } catch { /* ignore */ }
        }
      }
      const notaAtualizada = await tx.notafiscal.update({
        where: { id: notaFiscalId },
        data: atualizacoesNota,
      });
      console.log(`[API:AutorizaNFSe] Número da nota fiscal atualizado para: ${notaAtualizada.numero}`);

      return {
        prestadorAtualizado,
        notaAtualizada
      };
    });
    console.log(`[API:AutorizaNFSe] Transação concluída com sucesso`);
    
    // 4. Registrar log de autorização da NFS-e com o novo número do RPS
    await logService.registrarLog({
      usuarioId: userData.id,
      prestadorId: notaFiscal.prestadorId,
      acao: 'Transmitir', // Usando valor válido para LogAction
      entidade: 'NFS-e',
      entidadeId: notaFiscalId,
      descricao: `NFS-e número ${resultado.notaAtualizada.numero} autorizada para o tomador ${notaFiscal.tomador.razaoSocial}. RPS incrementado para ${resultado.prestadorAtualizado.numeroRpsAtual}`,
      tela: 'NFS-e',
    });
    
    console.log(`[API:AutorizaNFSe] Nota fiscal ${notaFiscalId} autorizada com sucesso. RPS incrementado para ${resultado.prestadorAtualizado.numeroRpsAtual} para o prestador ${resultado.prestadorAtualizado.razaoSocial}`);

    // 5. Persistir retorno bruto opcionalmente na tabela nFSe para suporte a cancelamento (recuperação do infPedReg.Id)
    try {
      if (retornoEmissao) {
        const payload: any = {
          numeroGuia: Number(retornoEmissao.numero_guia) || undefined,
          status: Number(retornoEmissao.status) || 1,
          nfseId: retornoEmissao.nfse_id ? String(retornoEmissao.nfse_id) : undefined,
          nNfse: retornoEmissao.numero ? String(retornoEmissao.numero) : undefined,
          codigoVerificacao: retornoEmissao.codigoVerificacao ? String(retornoEmissao.codigoVerificacao) : undefined,
          chaveAcesso: retornoEmissao.chaveAcesso ? String(retornoEmissao.chaveAcesso) : (resultado.notaAtualizada.chaveAcesso || undefined),
          urlNfse: retornoEmissao.url_nfse || undefined,
          xmlNfse: retornoEmissao.xmlNFSe || undefined,
          nfseBase64Gzip: retornoEmissao.nfse_base64_gzip ? Buffer.from(String(retornoEmissao.nfse_base64_gzip), 'base64') : undefined,
          rawResponse: typeof retornoEmissao === 'string' ? retornoEmissao : JSON.stringify(retornoEmissao),
          ambiente: resultado.notaAtualizada.ambiente || undefined,
        }
        // limpa undefined
        Object.keys(payload).forEach((k) => payload[k] === undefined && delete payload[k])
        await (prisma as any).nFSe.create({ data: payload }).catch(() => {})
      }
    } catch (e) {
      console.warn('[API:AutorizaNFSe] Falha ao persistir retorno em nFSe:', (e as any)?.message || String(e))
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[API:AutorizaNFSe] Erro ao processar requisição de autorização da NFSe:', error);
    console.error('[API:AutorizaNFSe] Detalhes do erro:', error instanceof Error ? error.message : 'Erro desconhecido');
    console.error('[API:AutorizaNFSe] Stack trace:', error instanceof Error && error.stack ? error.stack : 'Sem stack trace');
    
    return NextResponse.json(
      { 
        error: 'Erro ao processar requisição de autorização da NFSe',
        message: error instanceof Error ? error.message : 'Erro desconhecido'
      },
      { status: 500 }
    );
  }
}

// Helper: extrai a chave de acesso (44 a 60 dígitos) de um XML de NFSe
function tryExtractChave(xml: string): string | null {
  if (!xml) return null;
  try {
    const patterns: RegExp[] = [
      /<chaveAcesso>\s*(\d{44,60})\s*<\/chaveAcesso>/i,
      /<ChaveAcesso>\s*(\d{44,60})\s*<\/ChaveAcesso>/,
      /chaveAcesso\s*=\s*"(\d{44,60})"/i,
      /ChaveAcesso\s*=\s*"(\d{44,60})"/,
      /(\d{44,60})/,
    ];
    for (const rx of patterns) {
      const m = xml.match(rx);
      if (m && m[1]) return m[1];
    }
  } catch {}
  return null;
}
