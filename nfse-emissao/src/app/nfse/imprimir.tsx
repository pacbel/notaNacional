import React, { useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';

const NFSeImprimir = () => {
  const router = useRouter();

  useEffect(() => {
    // Esta página é apenas um placeholder para a janela de impressão
    // O conteúdo real será injetado via JavaScript pelo componente NFSePreview
    // Se o usuário navegar diretamente para esta página, redirecionamos para a visualização
    if (window.opener === null) {
      router.push('/nfse/visualizar');
    }
  }, [router]);

  return (
    <>
      <Head>
        <title>NFS-e - Impressão</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <link
          href="https://fonts.googleapis.com/css2?family=Roboto+Condensed&display=swap"
          rel="stylesheet"
        />
        <link
          rel="stylesheet"
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.3/css/all.min.css"
          integrity="sha512-iBBXm8fW90+nuLcSKlbmrPcLa0OT92xO1BIsZ+ywDWZCvqsWgccV3gFoRBv0z+8dLJgyAHIhR35VZc2oM/gI1w=="
          crossOrigin="anonymous"
          referrerPolicy="no-referrer"
        />
      </Head>
      <div id="print-container" style={{ padding: '20px' }}>
        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
          <h2>Preparando documento para impressão...</h2>
          <p>Aguarde enquanto o documento é carregado.</p>
        </div>
      </div>
    </>
  );
};

export default NFSeImprimir;
