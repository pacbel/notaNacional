import React from 'react';
import { readdir, stat } from 'fs/promises';
import path from 'path';
import Link from 'next/link';

/**
 * Página para visualizar os payloads salvos
 */
export default async function PayloadsPage() {
  // Obter a lista de arquivos de payload
  const payloads = await getPayloads();

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Payloads de Notas Fiscais</h1>
      
      {payloads.length === 0 ? (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-yellow-700">
                Nenhum payload encontrado. Emita uma nota fiscal para gerar payloads.
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <ul className="divide-y divide-gray-200">
            {payloads.map((payload) => (
              <li key={payload.nome}>
                <Link href={`/payloads/${payload.nome}`} className="block hover:bg-gray-50">
                  <div className="px-4 py-4 sm:px-6">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-indigo-600 truncate">
                        {payload.nome}
                      </p>
                      <div className="ml-2 flex-shrink-0 flex">
                        <p className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                          {formatFileSize(payload.tamanho)}
                        </p>
                      </div>
                    </div>
                    <div className="mt-2 sm:flex sm:justify-between">
                      <div className="sm:flex">
                        <p className="flex items-center text-sm text-gray-500">
                          {new Date(payload.dataCriacao).toLocaleString('pt-BR')}
                        </p>
                      </div>
                    </div>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

/**
 * Obtém a lista de arquivos de payload
 */
async function getPayloads() {
  try {
    const diretorio = path.join(process.cwd(), 'payloads');
    
    try {
      // Verificar se o diretório existe e ler os arquivos
      const arquivos = await readdir(diretorio);
      
      // Filtrar apenas arquivos JSON
      const arquivosJson = arquivos.filter(arquivo => arquivo.endsWith('.json'));
      
      // Obter informações de cada arquivo
      const payloadsPromises = arquivosJson.map(async (arquivo) => {
        const caminhoCompleto = path.join(diretorio, arquivo);
        const fileStat = await stat(caminhoCompleto);
        
        return {
          nome: arquivo,
          caminho: caminhoCompleto,
          tamanho: fileStat.size,
          dataCriacao: fileStat.mtime
        };
      });
      
      const payloads = await Promise.all(payloadsPromises);
      
      // Ordenar por data de criação (mais recente primeiro)
      return payloads.sort((a, b) => b.dataCriacao.getTime() - a.dataCriacao.getTime());
    } catch (err) {
      // Se o diretório não existir ou houver outro erro
      console.error('Erro ao ler diretório:', err);
      return [];
    }
  } catch (error) {
    console.error('Erro ao obter payloads:', error);
    return [];
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
