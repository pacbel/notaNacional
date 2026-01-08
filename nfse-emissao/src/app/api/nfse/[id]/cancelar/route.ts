import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';

// Função para registrar logs em arquivo
async function logToFile(message: string, data?: any) {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] ${message} ${data ? JSON.stringify(data, null, 2) : ''}`;
  
  console.log(logMessage);
  
  try {
    const logDir = path.join(process.cwd(), 'logs');
    
    // Verificar se o diretório de logs existe e criar se não existir
    if (!existsSync(logDir)) {
      await mkdir(logDir, { recursive: true });
      console.log(`Diretório de logs criado: ${logDir}`);
    }
    
    const logFile = path.join(logDir, 'cancelamento-nfse.log');
    await writeFile(logFile, logMessage + '\n', { flag: 'a' });
  } catch (logError) {
    console.error('Erro ao escrever log:', logError);
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  await logToFile('Iniciando processo de cancelamento de NFSe');
  
  // Resolver os parâmetros da rota
  const resolvedParams = await params;
  await logToFile('Parâmetros recebidos', resolvedParams);
  
  if (!resolvedParams?.id) {
    await logToFile('Erro: Número da nota fiscal não informado');
    return NextResponse.json({ error: 'Número da nota fiscal não informado' }, { status: 400 });
  }

  try {
    const body = await req.json();
    await logToFile('Body da requisição recebido', body);
    
    const { codigoCancelamento, motivoCancelamento, xmlCancelamento } = body;
    
    // Extrair o conteúdo XML do objeto (se for um objeto com propriedade data)
    let xmlConteudo = null;
    
    if (xmlCancelamento) {
      if (typeof xmlCancelamento === 'string') {
        // Se já for uma string, usa diretamente
        xmlConteudo = xmlCancelamento;
        await logToFile('XML já está em formato string');
      } else if (typeof xmlCancelamento === 'object') {
        // Se for um objeto, extrai a propriedade data
        if ('data' in xmlCancelamento && typeof xmlCancelamento.data === 'string') {
          xmlConteudo = xmlCancelamento.data;
          await logToFile('XML extraído da propriedade data do objeto');
        } else {
          // Tenta converter o objeto inteiro para string
          try {
            xmlConteudo = JSON.stringify(xmlCancelamento);
            await logToFile('XML convertido de objeto para string JSON');
          } catch (jsonError) {
            await logToFile('Erro ao converter XML para string', jsonError);
            xmlConteudo = null;
          }
        }
      }
    }
    
    await logToFile('XML processado', { 
      xmlPresente: !!xmlConteudo,
      tipoXml: typeof xmlConteudo,
      tamanho: xmlConteudo ? xmlConteudo.length : 0
    });
    
    await logToFile('Dados de cancelamento extraídos', { 
      codigoCancelamento, 
      motivoCancelamento, 
      xmlPresente: !!xmlConteudo,
      tipoXml: typeof xmlConteudo
    });

    // Atualizar a nota fiscal
    await logToFile(`Buscando nota fiscal com número: ${resolvedParams.id}`);
    const notaAtualizada = await prisma.notafiscal.findFirst({
      where: {
        numero: resolvedParams.id
      }
    });

    if (!notaAtualizada) {
      await logToFile(`Erro: Nota fiscal com número ${resolvedParams.id} não encontrada`);
      return NextResponse.json({ error: 'Nota fiscal não encontrada' }, { status: 404 });
    }
    
    await logToFile('Nota fiscal encontrada', { 
      id: notaAtualizada.id, 
      numero: notaAtualizada.numero, 
      status: notaAtualizada.status 
    });

    await logToFile('Iniciando atualização da nota fiscal para status cancelada');
    
    const dadosAtualizacao = {
      status: '2', // Status de cancelada
      codigoCancelamento,
      motivoCancelamento,
      xmlCancelamento: xmlConteudo, // XML de retorno do cancelamento (já extraído)
      updatedAt: new Date() // A data de atualização servirá como data de cancelamento
    };
    
    await logToFile('Dados para atualização', dadosAtualizacao);
    
    try {
      const notaFiscalAtualizada = await prisma.notafiscal.update({
        where: { id: notaAtualizada.id },
        data: dadosAtualizacao
      });
      
      await logToFile('Nota fiscal atualizada com sucesso', { 
        id: notaFiscalAtualizada.id, 
        status: notaFiscalAtualizada.status,
        xmlCancelamentoSalvo: !!notaFiscalAtualizada.xmlCancelamento
      });
    } catch (updateError) {
      await logToFile('Erro ao atualizar nota fiscal no banco de dados', updateError);
      throw updateError;
    }

    await logToFile('Processo de cancelamento concluído com sucesso');
    return NextResponse.json({ success: true });
  } catch (error) {
    await logToFile('Erro durante o processo de cancelamento', { 
      message: error instanceof Error ? error.message : 'Erro desconhecido',
      stack: error instanceof Error ? error.stack : undefined,
      error
    });
    
    console.error('Erro ao atualizar nota fiscal:', error);
    return NextResponse.json(
      { error: 'Erro ao atualizar nota fiscal' },
      { status: 500 }
    );
  }
}
