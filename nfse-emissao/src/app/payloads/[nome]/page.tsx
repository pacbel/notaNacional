import React from 'react';
import { readFile, stat } from 'fs/promises';
import path from 'path';
import Link from 'next/link';
import { notFound } from 'next/navigation';

interface PageProps {
  params: {
    nome: string;
  };
}

/**
 * Página para visualizar um payload específico
 */
export default async function PayloadPage({ params }: PageProps) {
  const { nome } = params;
  const decodedNome = decodeURIComponent(nome);
  
  // Obter o conteúdo do payload
  const payload = await getPayload(decodedNome);
  
  if (!payload) {
    notFound();
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-4">
        <Link href="/payloads" className="text-indigo-600 hover:text-indigo-900">
          ← Voltar para lista de payloads
        </Link>
      </div>
      
      <h1 className="text-2xl font-bold mb-6">Payload: {decodedNome}</h1>
      
      <div className="bg-white shadow overflow-hidden sm:rounded-lg mb-6">
        <div className="px-4 py-5 sm:px-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900">
            Informações do Arquivo
          </h3>
        </div>
        <div className="border-t border-gray-200">
          <dl>
            <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Nome do arquivo</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{decodedNome}</dd>
            </div>
            <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Tamanho</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{formatFileSize(payload.tamanho)}</dd>
            </div>
            <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Data de criação</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{new Date(payload.dataCriacao).toLocaleString('pt-BR')}</dd>
            </div>
          </dl>
        </div>
      </div>
      
      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="px-4 py-5 sm:px-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900">
            Conteúdo do Payload
          </h3>
        </div>
        <div className="border-t border-gray-200 p-4">
          <pre className="bg-gray-100 p-4 rounded-md overflow-auto text-sm">{payload.conteudo}</pre>
        </div>
      </div>
    </div>
  );
}

/**
 * Obtém o conteúdo de um arquivo de payload específico
 */
async function getPayload(nome: string) {
  try {
    const diretorio = path.join(process.cwd(), 'payloads');
    const caminhoCompleto = path.join(diretorio, nome);
    
    try {
      // Ler o conteúdo do arquivo
      const conteudo = await readFile(caminhoCompleto, 'utf8');
      const fileStat = await stat(caminhoCompleto);
      
      return {
        nome,
        caminho: caminhoCompleto,
        conteudo,
        tamanho: fileStat.size,
        dataCriacao: fileStat.mtime
      };
    } catch (err) {
      // Se o arquivo não existir ou houver outro erro
      console.error(`Arquivo não encontrado ou erro ao ler: ${nome}`, err);
      return null;
    }
  } catch (error) {
    console.error(`Erro ao obter payload ${nome}:`, error);
    return null;
  }
}

/**
 * Formata o tamanho do arquivo para exibição
 */
function formatFileSize(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes} B`;
  } else if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  } else {
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }
}
