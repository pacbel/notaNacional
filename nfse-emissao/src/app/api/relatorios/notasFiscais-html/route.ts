import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { buscarNotasFiscais } from '@/queries/relatorios/notasFiscaisQueries';

// Função para formatar CNPJ
function formatarCNPJ(cnpj: string): string {
  if (!cnpj) return '';
  cnpj = cnpj.replace(/\D/g, '');
  return cnpj.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5');
}

// Função para formatar data
function formatarData(data: Date | string): string {
  if (!data) return '';
  const dataObj = new Date(data);
  return format(dataObj, 'dd/MM/yyyy', { locale: ptBR });
}

// Função para formatar valor monetário
function formatarValor(valor: number): string {
  return valor.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });
}

// Função para converter o código de status para o nome do status
function obterNomeStatus(status: string): string {
  switch (status) {
    case '0':
      return 'Não Enviada';
    case '1':
      return 'Autorizada';
    case '2':
      return 'Cancelada';
    case '3':
      return 'Em Espera';
    case '4':
      return 'Rejeitada';
    case '5':
      return 'Processando';
    default:
      return status || 'N/A';
  }
}

export async function POST(request: NextRequest) {
  try {
    const { prestadorId, filtros } = await request.json();

    if (!prestadorId) {
      return NextResponse.json(
        { error: 'ID do prestador é obrigatório' },
        { status: 400 }
      );
    }

    // Buscar dados do prestador
    const prestador = await prisma.prestador.findUnique({
      where: { id: prestadorId },
      select: {
        id: true,
        razaoSocial: true,
        cnpj: true,
        logoPath: true,
      },
    });

    if (!prestador) {
      return NextResponse.json(
        { error: 'Prestador não encontrado' },
        { status: 404 }
      );
    }

    // Usar o logoPath do prestador se existir, ou criar um caminho padrão baseado no CNPJ
    const logoUrl = prestador.logoPath || `/logos/${prestador.cnpj}/logo.png`;

    // Criar um novo objeto com os dados do prestador e a URL da logo
    const prestadorComLogo = {
      ...prestador,
      logoUrl
    };

    // Buscar notas fiscais com base nos filtros
    const resultado = await buscarNotasFiscais(
      { prestadorId, ...filtros },
      1, // Página inicial
      1000 // Limite grande para o relatório
    );

    // Calcular valor total das notas fiscais
    const valorTotal = resultado.notasFiscais.reduce(
      (total: number, nota: any) => total + (nota.valorServicos || 0),
      0
    );

    // Gerar HTML do relatório
    const html = gerarHTMLRelatorio(prestadorComLogo, resultado.notasFiscais, resultado.paginacao, valorTotal, filtros);

    // Retornar o HTML
    return new NextResponse(html, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
      },
    });
  } catch (error) {
    console.error('Erro ao gerar relatório HTML de notas fiscais:', error);
    // Exibir detalhes mais específicos do erro
    if (error instanceof Error) {
      console.error('Mensagem de erro:', error.message);
      console.error('Stack trace:', error.stack);
    }
    return NextResponse.json(
      { error: 'Erro ao gerar relatório de notas fiscais' },
      { status: 500 }
    );
  }
}

function gerarHTMLRelatorio(prestador: any, notasFiscais: any[], paginacao: any, valorTotal: number, filtros: any) {
  const dataGeracao = format(new Date(), "dd/MM/yyyy", { locale: ptBR });

  // Formatar filtros para exibição
  const filtrosFormatados = Object.entries(filtros || {}).map(([chave, valor]) => {
    // Ignorar o prestadorId nos filtros exibidos
    if (chave === 'prestadorId') return null;

    if (valor) {
      // Formatar datas se necessário
      if (chave.includes('data') && typeof valor === 'string') {
        return `${chave.charAt(0).toUpperCase() + chave.slice(1)}: ${formatarData(valor)}`;
      }
      return `${chave.charAt(0).toUpperCase() + chave.slice(1)}: ${valor}`;
    }
    return null;
  }).filter(Boolean).join(', ');

  // Gerar linhas da tabela de notas fiscais
  const linhasNotas = notasFiscais.map(nota => `
    <tr>
      <td>${nota.numero || 'N/A'}</td>
      <td>${formatarData(nota.dataEmissao)}</td>
      <td>${nota.tomador?.razaoSocial || 'N/A'}</td>
      <td>${formatarCNPJ(nota.tomador?.cpfCnpj) || 'N/A'}</td>
      <td>${obterNomeStatus(nota.status)}</td>
      <td class="valor">${formatarValor(nota.valorServicos || 0)}</td>
    </tr>
  `).join('');

  // HTML do relatório
  return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Relatório de Notas Fiscais</title>
  <script src="/components/relatorios/RelatorioControles.js"></script>
  <style>
    body {
      font-family: Arial, sans-serif;
      margin: 0;
      padding: 20px;
      color: #333;
    }
    .cabecalho {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
      padding-bottom: 10px;
      border-bottom: 1px solid #ddd;
    }
    .logo {
      max-width: 150px;
      max-height: 80px;
    }
    .titulo {
      text-align: center;
      flex-grow: 1;
    }
    .titulo h1 {
      margin: 0;
      font-size: 24px;
      color: #2563eb;
    }
    .titulo p {
      margin: 5px 0 0;
      font-size: 14px;
      color: #666;
    }
    .info-prestador {
      text-align: right;
      font-size: 12px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 20px 0;
    }
    th, td {
      border: 1px solid #ddd;
      padding: 8px 12px;
      text-align: left;
    }
    th {
      background-color: #f8f9fa;
      font-weight: bold;
    }
    tr:nth-child(even) {
      background-color: #f2f2f2;
    }
    .valor {
      text-align: right;
    }
    .paginacao {
      text-align: right;
      font-size: 12px;
      margin-top: 10px;
      color: #666;
    }
    .filtros {
      margin-top: 10px;
      font-size: 14px;
      color: #666;
    }
    .resumo {
      margin-top: 20px;
      padding: 15px;
      background-color: #f8f9fa;
      border: 1px solid #ddd;
      border-radius: 4px;
    }
    .resumo-titulo {
      font-weight: bold;
      margin-bottom: 10px;
      font-size: 16px;
      color: #2563eb;
    }
    .resumo-item {
      display: flex;
      justify-content: space-between;
      margin-bottom: 5px;
    }
    .resumo-label {
      font-weight: bold;
    }
    .sem-registros {
      text-align: center;
      padding: 20px;
      font-style: italic;
      color: #666;
      border: 1px dashed #ddd;
      margin: 20px 0;
    }
    .rodape {
      margin-top: 30px;
      text-align: center;
      font-size: 12px;
      color: #666;
      border-top: 1px solid #ddd;
      padding-top: 10px;
    }
    .botoes {
      text-align: center;
      margin: 20px 0;
    }
    .botao-imprimir {
      background-color: #2563eb;
      color: white;
      border: none;
      padding: 10px 20px;
      border-radius: 4px;
      cursor: pointer;
      font-size: 14px;
    }
    .botao-imprimir:hover {
      background-color: #1d4ed8;
    }
    @media print {
      body {
        padding: 0;
      }
      .botoes {
        display: none;
      }
    }
  </style>
</head>
<body>
  <div class="cabecalho">
    <img src="${prestador.logoUrl}" alt="Logo" class="logo" onerror="this.src='/logo-default.png'; this.onerror=null;">
    <div class="titulo">
      <h1>Relatório de Notas Fiscais</h1>
      <p>Data: ${dataGeracao}</p>
    </div>
    <div class="info-prestador">
      <p><strong>${prestador.razaoSocial}</strong></p>
      <p>CNPJ: ${formatarCNPJ(prestador.cnpj)}</p>
    </div>
  </div>

  ${filtrosFormatados ? `<div class="filtros">Filtros aplicados: ${filtrosFormatados}</div>` : ''}

  ${notasFiscais.length > 0 ? `
  <table>
    <thead>
      <tr>
        <th>Número</th>
        <th>Data Emissão</th>
        <th>Tomador</th>
        <th>CPF/CNPJ</th>
        <th>Status</th>
        <th>Valor</th>
      </tr>
    </thead>
    <tbody>
      ${linhasNotas}
    </tbody>
  </table>

  <div class="paginacao">
    Mostrando ${(paginacao.pagina - 1) * paginacao.limite + 1} a ${Math.min(paginacao.pagina * paginacao.limite, paginacao.total)} de ${paginacao.total} registros
  </div>

  <div class="resumo">
    <div class="resumo-titulo">Resumo</div>
    <div class="resumo-item">
      <span class="resumo-label">Total de Notas Fiscais:</span>
      <span>${paginacao.total}</span>
    </div>
    <div class="resumo-item">
      <span class="resumo-label">Valor Total:</span>
      <span>${formatarValor(valorTotal)}</span>
    </div>
  </div>
  ` : `
  <div class="sem-registros">
    Nenhuma nota fiscal encontrada com os filtros aplicados.
  </div>
  `}

  <!-- Os botões de impressão e exportação serão adicionados pelo script RelatorioControles.js -->

  <div class="rodape">
    <p>© ${new Date().getFullYear()} - Sistema de Emissão de NFS-e</p>
  </div>
</body>
</html>
  `;
}
