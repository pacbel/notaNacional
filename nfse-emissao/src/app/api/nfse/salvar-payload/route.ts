import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';

/**
 * API para salvar o payload da nota fiscal em um arquivo JSON
 * @param request Requisição com o payload e número do RPS
 * @returns Resposta de sucesso ou erro
 */
export async function POST(request: NextRequest) {
  try {
    // Nota: Autenticação simplificada - em produção, deve-se implementar uma verificação adequada
    // A autenticação completa seria implementada usando o token JWT ou NextAuth

    // Obter dados da requisição
    const { notaId, payload } = await request.json();

    if (!notaId) {
      return NextResponse.json({ error: 'Número da nota não informado' }, { status: 400 });
    }

    if (!payload) {
      return NextResponse.json({ error: 'Payload não informado' }, { status: 400 });
    }

    // Diretório onde os payloads serão salvos
    const diretorio = path.join(process.cwd(), 'payloads');
    
    // Garantir que o diretório existe
    if (!existsSync(diretorio)) {
      await mkdir(diretorio, { recursive: true });
    }
    
    // Caminho completo do arquivo
    const nomeArquivo = `${notaId}.json`;
    const caminhoArquivo = path.join(diretorio, nomeArquivo);
    
    // Converter o payload para JSON formatado
    const conteudoJson = JSON.stringify(payload, null, 2);
    
    // Salvar o arquivo
    await writeFile(caminhoArquivo, conteudoJson, 'utf8');
    
    console.log(`[API:SalvarPayload] Payload salvo com sucesso: ${caminhoArquivo}`);
    
    return NextResponse.json({ 
      success: true, 
      message: `Payload salvo com sucesso: ${nomeArquivo}`,
      path: caminhoArquivo
    });
  } catch (error) {
    console.error('[API:SalvarPayload] Erro ao salvar payload:', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Erro desconhecido' 
    }, { status: 500 });
  }
}
