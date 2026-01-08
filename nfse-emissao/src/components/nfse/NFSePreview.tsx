'use client';

import React, { useEffect, useState } from 'react';
import styles from './NFSeStyles.module.css';
import { obterNomeMunicipio } from '../../utils/municipiosUtil';

interface NFSeData {
  numeroNFSe: string;
  codigoVerificacao: string;
  dataEmissao: string;
  prestador: {
    razaoSocial: string;
    cnpj: string;
    inscricaoMunicipal: string;
    endereco?: string;
    numero?: string;
    complemento?: string;
    bairro?: string;
    cep?: string;
    municipio: string;
    uf?: string;
    telefone?: string;
    email?: string;
  };
  tomador: {
    nome: string;
    cpfCnpj: string;
    endereco?: string;
    numero?: string;
    complemento?: string;
    bairro?: string;
    cep?: string;
    municipio: string;
    uf?: string;
    telefone?: string;
    email: string;
    inscricaoMunicipal?: string;
  };
  servicos: {
    descricao: string;
    codigo: string;
    valor: number;
  }[];
  competencia?: string;
  naturezaOperacao?: string;
  regimeEspecialTributacao?: string;
  optanteSimplesNacional?: boolean;
  incentivoFiscal?: boolean;
  aliquota?: number;
  valorIss?: number;
  valorLiquido?: number;
  codigoTributacaoMunicipio?: string;
  itemListaServico?: string;
  descricaoListaServico?: string;
  codigoMunicipio?: string;
  municipioIncidencia?: string;
  chaveAcesso?: string;
  outrasInformacoes?: string;
}

interface NFSePreviewProps {
  xml: string;
  status?: string;
}

// Função para extrair dados do XML
const parseXML = (xmlString: string): NFSeData => {
  // Cria um parser de XML
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(xmlString, 'text/xml');
  
  // Função auxiliar para obter o valor de um elemento
  const getElementValue = (tagName: string, parentNode: Document | Element = xmlDoc): string => {
    const element = parentNode.getElementsByTagName(tagName)[0];
    return element ? (element.textContent || '').trim() : '';
  };
  
  // Função auxiliar para obter o valor numérico de um elemento
  const getNumberValue = (tagName: string, parentNode: Document | Element = xmlDoc): number => {
    const value = getElementValue(tagName, parentNode);
    return value ? parseFloat(value.replace(',', '.')) : 0;
  };
  
  // Função auxiliar para obter o valor booleano de um elemento
  const getBooleanValue = (tagName: string, parentNode: Document | Element = xmlDoc): boolean => {
    const value = getElementValue(tagName, parentNode);
    return value === '1' || value.toLowerCase() === 'true';
  };
  
  // Função para formatar CNPJ/CPF
  const formatarCpfCnpj = (valor: string): string => {
    valor = valor.replace(/\D/g, '');
    if (valor.length === 11) {
      return valor.replace(/^(\d{3})(\d{3})(\d{3})(\d{2})$/, '$1.$2.$3-$4');
    } else if (valor.length === 14) {
      return valor.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5');
    }
    return valor;
  };
  
  // Função para formatar inscrição municipal
  const formatarInscricaoMunicipal = (valor: string): string => {
    if (!valor) return '';
    return valor.replace(/\D/g, '').replace(/^(\d+)(\d{3})(\d{1})$/, '$1/$2-$3');
  };
  
  // Encontrar o nó InfNfse que contém os dados principais
  const infNfseNode = xmlDoc.getElementsByTagName('InfNfse')[0] || xmlDoc;
  
  // Extrair dados do prestador
  const infPrestador = xmlDoc.getElementsByTagName('PrestadorServico')[0] || 
                     xmlDoc.getElementsByTagName('Prestador')[0] || 
                     xmlDoc.getElementsByTagName('DadosPrestador')[0] || 
                     xmlDoc;
  
  // Obter o nó de endereço do prestador
  const endPrestador = infPrestador.getElementsByTagName('Endereco')[0] || infPrestador;
  
  const prestador = {
    razaoSocial: getElementValue('RazaoSocial', infPrestador) || getElementValue('Nome', infPrestador),
    cnpj: formatarCpfCnpj(getElementValue('Cnpj', infPrestador) || getElementValue('CpfCnpj', infPrestador)),
    inscricaoMunicipal: formatarInscricaoMunicipal(getElementValue('InscricaoMunicipal', infPrestador)),
    endereco: getElementValue('Endereco', endPrestador) || getElementValue('Logradouro', endPrestador),
    numero: getElementValue('Numero', endPrestador),
    complemento: getElementValue('Complemento', endPrestador),
    bairro: getElementValue('Bairro', endPrestador),
    cep: getElementValue('Cep', endPrestador),
    municipio: getElementValue('CodigoMunicipio', endPrestador) || getElementValue('Cidade', endPrestador) || getElementValue('Municipio', endPrestador),
    uf: getElementValue('Uf', endPrestador),
    telefone: getElementValue('Telefone', infPrestador),
    email: getElementValue('Email', infPrestador)
  };
  
  // Extrair dados do tomador
  const infTomador = xmlDoc.getElementsByTagName('TomadorServico')[0] || 
                    xmlDoc.getElementsByTagName('Tomador')[0] || 
                    xmlDoc.getElementsByTagName('DadosTomador')[0] || 
                    xmlDoc;
  
  // Obter o nó de endereço do tomador
  const endTomador = infTomador.getElementsByTagName('Endereco')[0] || infTomador;
  
  // Obter o nó CpfCnpj do tomador
  const cpfCnpjNode = infTomador.getElementsByTagName('CpfCnpj')[0] || infTomador;
  
  const tomador = {
    nome: getElementValue('RazaoSocial', infTomador) || getElementValue('Nome', infTomador),
    cpfCnpj: formatarCpfCnpj(
      getElementValue('Cnpj', cpfCnpjNode) || 
      getElementValue('Cpf', cpfCnpjNode) || 
      getElementValue('CpfCnpj', infTomador)
    ),
    inscricaoMunicipal: formatarInscricaoMunicipal(getElementValue('InscricaoMunicipal', infTomador)),
    endereco: getElementValue('Endereco', endTomador) || getElementValue('Logradouro', endTomador),
    numero: getElementValue('Numero', endTomador),
    complemento: getElementValue('Complemento', endTomador),
    bairro: getElementValue('Bairro', endTomador),
    cep: getElementValue('Cep', endTomador),
    municipio: getElementValue('CodigoMunicipio', endTomador) || getElementValue('Cidade', endTomador) || getElementValue('Municipio', endTomador),
    uf: getElementValue('Uf', endTomador),
    telefone: getElementValue('Telefone', infTomador),
    email: getElementValue('Email', infTomador)
  };
  
  // Extrair dados dos serviços
  const servicoNode = xmlDoc.getElementsByTagName('Servico')[0] || xmlDoc;
  const valoresNode = servicoNode.getElementsByTagName('Valores')[0] || servicoNode;
  
  const servicos = [];
  const descricao = getElementValue('Discriminacao', servicoNode);
  const codigo = getElementValue('ItemListaServico', servicoNode) || getElementValue('CodigoServico', servicoNode);
  const valor = getNumberValue('ValorServicos', valoresNode) || getNumberValue('Valor', valoresNode);
  
  if (descricao || codigo || valor) {
    servicos.push({
      descricao: descricao,
      codigo: codigo,
      valor: valor
    });
  }
  
  // Extrair outros dados da NFSe
  const nfseData: NFSeData = {
    numeroNFSe: getElementValue('Numero', infNfseNode),
    codigoVerificacao: getElementValue('CodigoVerificacao', infNfseNode),
    dataEmissao: getElementValue('DataEmissao', infNfseNode),
    prestador,
    tomador,
    servicos,
    competencia: getElementValue('Competencia', infNfseNode),
    naturezaOperacao: getElementValue('NaturezaOperacao', infNfseNode),
    regimeEspecialTributacao: getElementValue('RegimeEspecialTributacao', infNfseNode),
    optanteSimplesNacional: getBooleanValue('OptanteSimplesNacional', infNfseNode),
    incentivoFiscal: getBooleanValue('IncentivoFiscal', infNfseNode),
    aliquota: getNumberValue('Aliquota', valoresNode),
    valorIss: getNumberValue('ValorIss', valoresNode),
    valorLiquido: getNumberValue('ValorLiquidoNfse', valoresNode),
    codigoTributacaoMunicipio: getElementValue('CodigoTributacaoMunicipio', servicoNode),
    itemListaServico: getElementValue('ItemListaServico', servicoNode),
    codigoMunicipio: getElementValue('CodigoMunicipio', servicoNode),
    outrasInformacoes: getElementValue('OutrasInformacoes', infNfseNode)
  };
  
  // Calcular valores se não estiverem presentes
  const valorTotal = servicos.reduce((total, servico) => total + servico.valor, 0);
  nfseData.valorIss = nfseData.valorIss || (valorTotal * (nfseData.aliquota || 0.025));
  nfseData.valorLiquido = nfseData.valorLiquido || valorTotal;
  
  return nfseData;
};

export function NFSePreview({ xml, status }: NFSePreviewProps) {
  // Estado para armazenar os dados da NFSe
  const [nfseData, setNfseData] = useState<NFSeData | null>(null);
  const [nomeMunicipioPrestador, setNomeMunicipioPrestador] = useState<string>('');
  const [nomeMunicipioTomador, setNomeMunicipioTomador] = useState<string>('');
  const [logoUrl, setLogoUrl] = useState<string>('/logos/default-logo.png');
  
  // Efeito para processar o XML quando o componente for montado ou o XML mudar
  useEffect(() => {
    if (xml) {
      try {
        const parsedData = parseXML(xml);
        setNfseData(parsedData);
        
        // Carregar nomes dos municípios
        const carregarMunicipios = async () => {
          try {
            if (parsedData.prestador?.municipio) {
              const nomePrestador = await obterNomeMunicipio(parsedData.prestador.municipio);
              setNomeMunicipioPrestador(nomePrestador);
            }
            
            if (parsedData.tomador?.municipio) {
              const nomeTomador = await obterNomeMunicipio(parsedData.tomador.municipio);
              setNomeMunicipioTomador(nomeTomador);
            }
          } catch (err) {
            console.warn('Erro ao carregar nomes dos municípios:', err);
          }
        };
        
        carregarMunicipios();
      } catch (error) {
        console.error('Erro ao processar o XML:', error);
      }
    }
  }, [xml]);
  
  // Efeito para carregar a logomarca do prestador
  useEffect(() => {
    const carregarLogomarca = async () => {
      if (nfseData?.prestador?.cnpj) {
        try {
          // Remover caracteres não numéricos do CNPJ
          const cnpjLimpo = nfseData.prestador.cnpj.replace(/\D/g, '');
          // Verificar se existe logomarca para este prestador
          const logoPath = `/logos/${cnpjLimpo}/logo.jpg`;
          const logoPngPath = `/logos/${cnpjLimpo}/logo.png`;
          
          // Verificar se a imagem existe
          const checkImage = (url: string) => {
            return new Promise((resolve) => {
              const img = new Image();
              img.onload = () => resolve(true);
              img.onerror = () => resolve(false);
              img.src = url;
            });
          };
          
          // Tentar primeiro o JPG, depois o PNG
          const jpgExists = await checkImage(logoPath);
          if (jpgExists) {
            setLogoUrl(logoPath);
            return;
          }
          
          const pngExists = await checkImage(logoPngPath);
          if (pngExists) {
            setLogoUrl(logoPngPath);
            return;
          }
          
          // Se não encontrar, usar a imagem padrão
          setLogoUrl('/logos/default-logo.png');
        } catch (error) {
          console.error('Erro ao carregar logomarca:', error);
          setLogoUrl('/logos/default-logo.png');
        }
      }
    };
    
    carregarLogomarca();
  }, [nfseData]);
  
  // Se os dados ainda não foram processados, mostra uma mensagem de carregamento
  if (!nfseData) {
    return <div>Carregando dados da NFSe...</div>;
  }
  
  // Extrai os dados do objeto nfseData
  const { 
    numeroNFSe, 
    codigoVerificacao, 
    dataEmissao, 
    prestador, 
    tomador, 
    servicos,
    aliquota = 0.025, // Alíquota padrão se não estiver presente no XML
    valorIss,
    valorLiquido,
    outrasInformacoes,
    codigoTributacaoMunicipio,
    itemListaServico
  } = nfseData;
  
  // Calcula os valores se não estiverem presentes no XML
  const valorTotal = servicos.reduce((total: number, servico: {valor: number}) => total + servico.valor, 0);
  
  // Formata valores para exibição
  const formatarValor = (valor: number) => {
    return valor.toFixed(2).replace('.', ',');
  };
  
  // Formata data e hora
  const formatarDataHora = (dataStr: string) => {
    try {
      if (!dataStr) return '';
      
      // Verificar se a data já contém hora
      if (dataStr.includes('T')) {
        const [dataParte, horaParte] = dataStr.split('T');
        const horaFormatada = horaParte.substring(0, 8);
        return horaFormatada;
      }
      
      // Se não tiver hora, retorna hora atual
      const hoje = new Date();
      const horas = hoje.getHours().toString().padStart(2, '0');
      const minutos = hoje.getMinutes().toString().padStart(2, '0');
      const segundos = hoje.getSeconds().toString().padStart(2, '0');
      return `${horas}:${minutos}:${segundos}`;
    } catch (error) {
      console.error('Erro ao formatar data/hora:', error);
      return '';
    }
  };
  
  // Formata data para exibição
  const formatarData = (dataStr: string) => {
    try {
      if (!dataStr) return '';
      
      // Se a data contém 'T', é um formato ISO
      if (dataStr.includes('T')) {
        const [dataParte] = dataStr.split('T');
        const [ano, mes, dia] = dataParte.split('-');
        return `${dia}/${mes}/${ano}`;
      }
      
      // Se já é uma data no formato YYYY-MM-DD
      if (dataStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
        const [ano, mes, dia] = dataStr.split('-');
        return `${dia}/${mes}/${ano}`;
      }
      
      return dataStr;
    } catch (error) {
      console.error('Erro ao formatar data:', error);
      return dataStr;
    }
  };
  
  // Função para imprimir a NFS-e
  const handlePrint = () => {
    try {
      // Criar uma nova janela para impressão apenas da nota
      const printWindow = window.open('', '_blank', 'width=800,height=600');
      if (!printWindow) {
        alert('O navegador bloqueou a abertura da janela. Verifique as configurações do seu navegador.');
        return;
      }
      
      // Obter o conteúdo da nota
      const notaElement = document.querySelector(`.${styles.moldura}`);
      if (!notaElement) {
        printWindow.close();
        alert('Não foi possível encontrar o conteúdo da nota.');
        return;
      }
      
      // Criar uma cópia do conteúdo para não modificar o original
      const notaClone = notaElement.cloneNode(true) as HTMLElement;
      
      // Remover os botões flutuantes da cópia
      const botoesParaRemover = notaClone.querySelectorAll(`.${styles.floatingButtons}, .${styles.noPrint}`);
      botoesParaRemover.forEach(botao => {
        if (botao.parentNode) {
          botao.parentNode.removeChild(botao);
        }
      });
      
      // Extrair os estilos CSS do módulo NFSeStyles
      let cssStyles = '';
      try {
        // Tentar extrair os estilos do módulo CSS
        Array.from(document.styleSheets).forEach(sheet => {
          if (sheet.href && sheet.href.includes('NFSeStyles')) {
            try {
              Array.from(sheet.cssRules).forEach(rule => {
                cssStyles += rule.cssText + '\n';
              });
            } catch (e) {
              console.warn('Não foi possível acessar as regras CSS:', e);
            }
          }
        });
      } catch (e) {
        console.warn('Erro ao extrair estilos CSS:', e);
      }
      
      // Criar o conteúdo HTML para a janela de impressão
      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>NFS-e - Impressão</title>
          <meta charset="utf-8">
          <style>
            body { 
              font-family: Arial, sans-serif; 
              margin: 0; 
              padding: 0; 
              background-color: white;
            }
            .print-container { 
              max-width: 800px; 
              margin: 0 auto; 
              padding: 0; 
              box-sizing: border-box;
              page-break-after: always;
              background-color: white;
            }
            .print-actions {
              text-align: center;
              margin-bottom: 10px;
              padding: 10px;
            }
            .print-button {
              background-color: #1d4ed8;
              color: white;
              border: none;
              border-radius: 4px;
              padding: 8px 16px;
              font-weight: 600;
              cursor: pointer;
              margin: 0 5px;
            }
            @media print {
              .print-actions { display: none !important; }
              body { margin: 0; padding: 0; background-color: white; }
              .print-container { width: 100%; max-width: 100%; margin: 0; padding: 0; }
            }
            ${cssStyles}
          </style>
        </head>
        <body>
          <div class="print-actions">
            <button class="print-button" onclick="window.print()">Imprimir</button>
            <button class="print-button" onclick="window.close()">Fechar</button>
          </div>
          <div class="print-container">
            ${notaClone.outerHTML}
          </div>
        </body>
        </html>
      `;
      
      // Escrever o conteúdo na nova janela
      printWindow.document.open();
      printWindow.document.write(htmlContent);
      printWindow.document.close();
      
      // Aguardar o carregamento completo antes de focar na janela
      printWindow.onload = function() {
        printWindow.focus();
      };
    } catch (error) {
      console.error('Erro ao abrir janela de impressão:', error);
      alert('Ocorreu um erro ao abrir a janela de impressão. Tentando método alternativo...');
      
      try {
        // Método alternativo: criar um iframe oculto para impressão
        const iframe = document.createElement('iframe');
        iframe.style.position = 'fixed';
        iframe.style.right = '0';
        iframe.style.bottom = '0';
        iframe.style.width = '0';
        iframe.style.height = '0';
        iframe.style.border = 'none';
        
        document.body.appendChild(iframe);
        
        const notaElement = document.querySelector(`.${styles.moldura}`);
        if (!notaElement) {
          document.body.removeChild(iframe);
          alert('Não foi possível encontrar o conteúdo da nota.');
          return;
        }
        
        const notaClone = notaElement.cloneNode(true) as HTMLElement;
        
        // Remover os botões flutuantes da cópia
        const botoesParaRemover = notaClone.querySelectorAll(`.${styles.floatingButtons}, .${styles.noPrint}`);
        botoesParaRemover.forEach(botao => {
          if (botao.parentNode) {
            botao.parentNode.removeChild(botao);
          }
        });
        
        const iframeDocument = iframe.contentDocument || iframe.contentWindow?.document;
        if (iframeDocument) {
          iframeDocument.open();
          iframeDocument.write(`
            <!DOCTYPE html>
            <html>
            <head>
              <title>NFS-e - Impressão</title>
              <style>
                body { margin: 0; padding: 0; background-color: white; }
              </style>
            </head>
            <body>
              ${notaClone.outerHTML}
            </body>
            </html>
          `);
          iframeDocument.close();
          
          setTimeout(() => {
            iframe.contentWindow?.print();
            document.body.removeChild(iframe);
          }, 500);
        } else {
          document.body.removeChild(iframe);
          alert('Não foi possível criar o documento para impressão.');
        }
      } catch (e) {
        console.error('Erro no método alternativo de impressão:', e);
        alert('Não foi possível imprimir a nota. Tente novamente mais tarde.');
      }
    }
  };

  // Verificar se a nota está cancelada (status = 2)
  const isCancelada = status === '2';
  
  return (
    <div id="nota-preview" className={`moldura ${styles.moldura} ${isCancelada ? styles.canceladaContainer : ''}`}>
      {/* Marca d'água de CANCELADA quando o status for 2 */}
      {isCancelada && (
        <div className={styles.canceladaMarca}>
          <div className={styles.canceladaTexto}>CANCELADA</div>
        </div>
      )}
      {/* Cabeçalho com logo e informações */}
      <div className={`headerContainer ${styles.headerContainer}`}>
        {/* Logo à esquerda */}
        <img 
          src={logoUrl} 
          alt="Logomarca do Prestador" 
          className={styles.footerLogo} 
        />
        
        {/* Informações à direita */}
        <div className={`headerInfoTable ${styles.headerInfoTable}`}>
          <table className={`headerTable ${styles.headerTable}`}>
            <tbody>
              <tr>
                <td colSpan={2}>
                  <div className={`headerTopLabel ${styles.headerTopLabel}`}></div>
                </td>
              </tr>
              <tr>
                <td>
                  <span className={`headerLabel ${styles.headerLabel}`}>Número da NFS-e:</span>
                  <span className={`headerValue ${styles.headerValue}`}>{numeroNFSe}</span>
                </td>
                <td>
                  <span className={`headerLabel ${styles.headerLabel}`}>Emitida em:</span>
                  <span className={`headerValue ${styles.headerValue}`}>
                    {formatarData(dataEmissao)}
                    <span className={`headerValueSmall ${styles.headerValueSmall}`}> às {formatarDataHora(dataEmissao)}</span>
                  </span>
                </td>
              </tr>
              <tr>
                <td>
                  <span className={`headerLabel ${styles.headerLabel}`}>Competência:</span>
                  <span className={`headerValue ${styles.headerValue}`}>{formatarData(nfseData.competencia || dataEmissao)}</span>
                </td>
                <td>
                  <span className={`headerLabel ${styles.headerLabel}`}>Código de Verificação:</span>
                  <span className={`headerValue ${styles.headerValue}`}>{codigoVerificacao}</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      
      {/* Informações do prestador e tomador, um acima do outro */}
      <div className={styles.verticalLayout}>
        {/* Prestador */}
        <div className={styles.companyInfo}>
          <div className={styles.sectionTitle}>Prestador do(s) Serviço(s):</div>
          <div className={styles.companyName}>{prestador.razaoSocial}</div>
          <div className={styles.documentInfo}>CPF/CNPJ: {prestador.cnpj}</div>
          <div className={styles.documentInfo}>Inscrição Municipal: {prestador.inscricaoMunicipal}</div>
          
          {/* Endereço do prestador organizado conforme solicitado */}
          <div className={styles.addressLine}>
            {prestador.endereco}{prestador.numero ? `, ${prestador.numero}` : ''}
          </div>
          
          {(prestador.complemento || prestador.bairro || prestador.cep) && (
            <div className={styles.addressLine}>
              {prestador.complemento && `${prestador.complemento}, `}
              {prestador.bairro && `${prestador.bairro}`}
              {prestador.cep && ` - CEP: ${prestador.cep}`}
            </div>
          )}
          
          <div className={styles.cityLine}>
            {nomeMunicipioPrestador || prestador.municipio}
            {prestador.uf ? `/${prestador.uf}` : ''}
          </div>
          
          <div className={styles.contactLine}>
            {prestador.telefone ? `Telefone: ${prestador.telefone}` : 'Telefone: Não Informado'}
            {prestador.email && ` - Email: ${prestador.email}`}
          </div>
        </div>
        

        
        {/* Tomador */}
        <div className={styles.customerInfo}>
          <div className={styles.sectionTitle}>Tomador do(s) Serviço(s):</div>
          <div className={styles.customerName}>{tomador.nome}</div>
          <div className={styles.documentInfo}>CPF/CNPJ: {tomador.cpfCnpj}</div>
          {tomador.inscricaoMunicipal && (
            <div className={styles.documentInfo}>Inscrição Municipal: {tomador.inscricaoMunicipal}</div>
          )}
          
          {/* Endereço do tomador organizado conforme solicitado */}
          <div className={styles.addressLine}>
            {tomador.endereco}{tomador.numero ? `, ${tomador.numero}` : ''}
          </div>
          
          {(tomador.complemento || tomador.bairro || tomador.cep) && (
            <div className={styles.addressLine}>
              {tomador.complemento && `${tomador.complemento}, `}
              {tomador.bairro && `${tomador.bairro}`}
              {tomador.cep && ` - CEP: ${tomador.cep}`}
            </div>
          )}
          
          <div className={styles.cityLine}>
            {nomeMunicipioTomador || tomador.municipio}
            {tomador.uf ? `/${tomador.uf}` : ''}
          </div>
          
          <div className={styles.contactLine}>
            {tomador.telefone ? `Telefone: ${tomador.telefone}` : 'Telefone: Não Informado'}
            {tomador.email && ` - Email: ${tomador.email}`}
          </div>
        </div>
      </div>
      
      {/* Serviços */}
      <div className={styles.serviceBox}>
        <div className={styles.serviceHeader}>Discriminação do(s) Serviço(s)</div>
        <div className={styles.serviceContent}>
          {servicos.map((servico, index) => (
            <div key={index}>{servico.descricao}</div>
          ))}
        </div>
      </div>
      
      {/* Informações fiscais no formato da imagem de referência */}
      <div className={styles.fiscalInfoContainer}>
        <div className={styles.fiscalInfoRow}>
          <div className={styles.fiscalInfoLabel}>Código de Tributação do Município (CTISS)</div>
          <div className={styles.fiscalInfoValue}>
            {codigoTributacaoMunicipio || '-'} / {servicos[0]?.descricao || '-'}
          </div>
        </div>
        
        <div className={styles.fiscalInfoRow}>
          <div className={styles.fiscalInfoLabel}>Subitem Lista de Serviços LC 116/03 / Descrição:</div>
          <div className={styles.fiscalInfoValue}>
            {itemListaServico || '-'} / {servicos[0]?.descricao || '-'}
          </div>
        </div>
        
        <div className={styles.fiscalInfoRow}>
          <div className={styles.fiscalInfoLabel}>Cod/Município da incidência do ISSQN:</div>
          <div className={styles.fiscalInfoValue}>
            {nfseData.codigoMunicipio || '-'} / {nomeMunicipioPrestador || prestador.municipio || '-'}
          </div>
        </div>
        
        <div className={styles.fiscalInfoRow}>
          <div className={styles.fiscalInfoLabel}>Natureza da Operação:</div>
          <div className={styles.fiscalInfoValue}>
            {nfseData.naturezaOperacao === '1' ? 'Tributação no município' : nfseData.naturezaOperacao || '-'}
          </div>
        </div>
      </div>
      
      {/* Valores no formato da imagem de referência */}
      <div className={styles.valuesContainer}>
        <div className={styles.valuesColumn}>
          <div className={styles.valuesHeader}>Valor dos serviços:</div>
          <div className={styles.valuesRow}>
            <div className={styles.valuesLabel}>(-) Descontos:</div>
            <div className={styles.valuesValue}>R$ 0,00</div>
          </div>
          <div className={styles.valuesRow}>
            <div className={styles.valuesLabel}>(-) Retenções Federais:</div>
            <div className={styles.valuesValue}>R$ 0,00</div>
          </div>
          <div className={styles.valuesRow}>
            <div className={styles.valuesLabel}>(-) ISS Retido na Fonte:</div>
            <div className={styles.valuesValue}>R$ 0,00</div>
          </div>
          <div className={styles.valuesTotal}>
            <div className={styles.valuesTotalLabel}>Valor Líquido:</div>
            <div className={styles.valuesTotalValue}>R$ {formatarValor(valorLiquido || valorTotal)}</div>
          </div>
        </div>
        
        <div className={styles.valuesColumn}>
          <div className={styles.valuesHeader}>Valor dos serviços:</div>
          <div className={styles.valuesRow}>
            <div className={styles.valuesLabel}>(-) Deduções:</div>
            <div className={styles.valuesValue}>R$ 0,00</div>
          </div>
          <div className={styles.valuesRow}>
            <div className={styles.valuesLabel}>(-) Desconto Incondicionado:</div>
            <div className={styles.valuesValue}>R$ 0,00</div>
          </div>
          <div className={styles.valuesRow}>
            <div className={styles.valuesLabel}>(=) Base de Cálculo:</div>
            <div className={styles.valuesHighlightValue}>R$ {formatarValor(valorTotal)}</div>
          </div>
          <div className={styles.valuesRow}>
            <div className={styles.valuesLabel}>(x) Alíquota:</div>
            <div className={styles.valuesValue}>{(aliquota * 100).toFixed(1).replace('.', ',')}%</div>
          </div>
          <div className={styles.valuesTotal}>
            <div className={styles.valuesTotalLabel}>(=)Valor do ISS:</div>
            <div className={styles.valuesTotalValue}>R$ {formatarValor(valorIss || (valorTotal * aliquota))}</div>
          </div>
        </div>
      </div>
      
      {/* Outras informações */}
      {outrasInformacoes && (
        <>
          <div className={styles.otherInfo}>Outras Informações:</div>
          <div className={styles.accessKey}>{outrasInformacoes}</div>
        </>
      )}
      
      {/* Rodapé */}
      <div className={styles.footer}>
        <img 
          src="/img/nfse/img_brasao_titulo.gif" 
          alt="Brasão da Prefeitura de Belo Horizonte" 
          className={styles.footerLogo} 
        />
        <div>
          Prefeitura de Belo Horizonte - Secretaria Municipal de Fazenda<br />
          Rua Espírito Santo, 605 - 3º andar - Centro - CEP: 30160-919 - Belo Horizonte MG.<br />
          Dúvidas: SICESP
        </div>
        <img 
          src="/img/nfse/logo-pbh.png" 
          alt="Selo Nota 10 da Prefeitura de Belo Horizonte" 
          className={styles.footerLogoRight} 
        />
      </div>
      
      {/* Botões flutuantes para impressão - classe styles.noPrint adicionada para ocultar na impressão */}
      <div className={`${styles.floatingButtons} ${styles.noPrint}`}>
        <button 
          className={styles.button} 
          onClick={handlePrint}
          title="Imprimir NFSe"
        >
          Imprimir
        </button>
      </div>
    </div>
  );
}