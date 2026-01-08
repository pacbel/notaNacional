'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { NFSePreview } from './NFSePreview';

type NotaFiscal = {
  id: string;
  prestador: {
    cnpj: string;
  };
  arquivoNfse?: string;
  status?: string;
};

type NFSeViewerProps = {
  notaId: string;
};

export function NFSeViewer({ notaId }: NFSeViewerProps) {
  
const handlePrint = async () => {
    const conteudo = document.getElementById('nota-preview');
    if (!conteudo) return;
    const janela = window.open('', '', 'width=900,height=900');
    if (!janela) return;
    // Busca o CSS de impressão
    let nfseStyles = '';
    try {
      const cssResp = await fetch('/NFSeStyles.print.css');
      nfseStyles = cssResp.ok ? await cssResp.text() : '';
      console.log('CSS carregado para impressão:', nfseStyles.substring(0, 100) + '...');
    } catch {
      console.error('Erro ao carregar CSS de impressão');
    }
    // Define um nome para a janela para evitar about:blank
    janela.document.write('<html><head><title></title>');
    // Copia estilos globais e do Tailwind
    Array.from(document.querySelectorAll('link[rel="stylesheet"], style')).forEach((el) => {
      janela.document.write(el.outerHTML);
    });
    // Injeta o CSS do módulo diretamente
    if (nfseStyles) {
      janela.document.write(`<style>${nfseStyles}</style>`);
    }
    // Adiciona CSS extra para garantir que a impressão fique correta
    janela.document.write(`
      <style>
        body { margin: 0; padding: 20px; background-color: white; }
        .moldura { margin: 0 auto !important; }
        @media print {
          body { margin: 0; padding: 0; }
          .moldura { box-shadow: none !important; }
        }
        /* Ocultar cabeçalho e rodapé da impressão */
        @page {
          margin: 0;
          size: auto;
        }
        @media print {
          html, body {
            height: 99%;
          }
        }
      </style>
    `);
    janela.document.write('</head><body>');
    janela.document.write(conteudo.innerHTML);
    janela.document.write('</body></html>');
    janela.document.close();
    janela.focus();
    setTimeout(() => {
      janela.print();
      janela.close();
    }, 500);
  };
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [xmlData, setXmlData] = useState<string>('');
  const [erro, setErro] = useState<boolean>(false);
  const [notaStatus, setNotaStatus] = useState<string>('');

  useEffect(() => {
    const carregarXML = async () => {
      // Primeiro, busca os dados da nota fiscal
      let notaResponse;
      try {
        notaResponse = await fetch(`/api/nfse/${notaId}`);
      } catch {
        // Erro de rede ao buscar dados da nota
        console.log('Erro de conexão ao buscar dados da nota');
        setErro(true);
        setLoading(false);
        return;
      }
      
      if (!notaResponse.ok) {
        console.log(`Erro ao buscar dados da nota: ${notaResponse.status}`);
        setErro(true);
        setLoading(false);
        return;
      }

      let notaFiscal: NotaFiscal;
      try {
        notaFiscal = await notaResponse.json();
        // Armazenar o status da nota fiscal
        if (notaFiscal.status) {
          setNotaStatus(notaFiscal.status);
        }
      } catch {
        console.log('Erro ao processar dados da nota fiscal');
        setErro(true);
        setLoading(false);
        return;
      }
      
      if (!notaFiscal.arquivoNfse || !notaFiscal.prestador?.cnpj) {
        console.log('Nota fiscal não possui XML disponível');
        setErro(true);
        setLoading(false);
        return;
      }

      // Faz uma requisição para obter o conteúdo do arquivo XML
      let xmlResponse;
      try {
        xmlResponse = await fetch(`/api/nfse/download/${notaFiscal.prestador.cnpj}/${notaFiscal.arquivoNfse}`);
      } catch {
        console.log('Erro de conexão ao carregar o XML');
        setErro(true);
        setLoading(false);
        return;
      }
      
      if (!xmlResponse.ok) {
        console.log(`Erro ao carregar o XML: ${xmlResponse.status}`);
        setErro(true);
        setLoading(false);
        return;
      }

      let texto;
      try {
        texto = await xmlResponse.text();
      } catch {
        console.log('Erro ao processar o conteúdo do XML');
        setErro(true);
        setLoading(false);
        return;
      }
      
      if (!texto || texto.trim() === '') {
        console.log('O arquivo XML está vazio ou inválido');
        setErro(true);
        setLoading(false);
        return;
      }
      
      setXmlData(texto);
      setLoading(false);
    };

    carregarXML();
  }, [notaId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Carregando NFS-e...</h1>
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-700 mx-auto"></div>
        </div>
      </div>
    );
  }

  if (erro || !xmlData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Erro ao carregar NFS-e</h1>
          <p className="mb-4">Não foi possível carregar os dados da Nota Fiscal de Serviços Eletrônica.</p>
          <p className="mb-4">Verifique se o arquivo XML existe e está acessível.</p>
          <button 
            onClick={() => router.push('/nfse')}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Voltar para Notas Fiscais
          </button>
        </div>
      </div>
    );
  }

  return (
        <div className="relative">
          {/* Barra fixa no topo com os botões */}
          <div className="fixed top-0 right-0 bg-white shadow-md p-4 z-10 flex space-x-2">
            <button 
              onClick={handlePrint}
              className="bg-white border border-blue-600 text-blue-600 px-4 py-2 rounded hover:bg-gray-100"
            >
              Imprimir
            </button>
            <button 
              onClick={() => router.push('/nfse')}
              className="bg-gray-800 text-white px-4 py-2 rounded hover:bg-gray-700"
            >
              Voltar
            </button>
          </div>
          
          {/* Conteúdo da nota fiscal */}
          <div className="bg-white rounded-lg shadow-lg overflow-hidden mt-16">
            <div id="nota-preview">
              <NFSePreview xml={xmlData} status={notaStatus} />
            </div>
          </div>
        </div>
  );
}