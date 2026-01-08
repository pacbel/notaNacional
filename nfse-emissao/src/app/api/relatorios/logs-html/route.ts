import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { buscarLogs } from '@/queries/relatorios/logsQueries';

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

// Função para formatar data e hora
function formatarDataHora(data: Date | string): string {
  if (!data) return '';
  const dataObj = new Date(data);
  return format(dataObj, 'dd/MM/yyyy HH:mm:ss', { locale: ptBR });
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

    // Buscar logs com base nos filtros
    const resultado = await buscarLogs(
      { prestadorId, ...filtros },
      1, // Página inicial
      1000 // Limite grande para o relatório
    );

    // Gerar HTML do relatório
    const html = gerarHTMLRelatorio(prestadorComLogo, resultado.logs, resultado.paginacao, filtros);

    // Retornar o HTML
    return new NextResponse(html, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
      },
    });
  } catch (error) {
    console.error('Erro ao gerar relatório HTML de logs:', error);
    // Exibir detalhes mais específicos do erro
    if (error instanceof Error) {
      console.error('Mensagem de erro:', error.message);
      console.error('Stack trace:', error.stack);
    }
    return NextResponse.json(
      { error: 'Erro ao gerar relatório de logs' },
      { status: 500 }
    );
  }
}

function gerarHTMLRelatorio(prestador: any, logs: any[], paginacao: any, filtros: any) {
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

  // Gerar linhas da tabela de logs
  const linhasLogs = logs.map(log => `
    <tr>
      <td>${formatarDataHora(log.dataHora)}</td>
      <td>${log.usuario?.nome || 'Sistema'}</td>
      <td>${log.acao || 'N/A'}</td>
      <td>${log.entidade || 'N/A'}</td>
      <td>${log.descricao || 'N/A'}</td>
    </tr>
  `).join('');

  // HTML do relatório
  return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Relatório de Logs</title>
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
      <h1>Relatório de Logs</h1>
      <p>Data: ${dataGeracao}</p>
    </div>
    <div class="info-prestador">
      <p><strong>${prestador.razaoSocial}</strong></p>
      <p>CNPJ: ${formatarCNPJ(prestador.cnpj)}</p>
    </div>
  </div>

  ${filtrosFormatados ? `<div class="filtros">Filtros aplicados: ${filtrosFormatados}</div>` : ''}

  ${logs.length > 0 ? `
  <table>
    <thead>
      <tr>
        <th>Data/Hora</th>
        <th>Usuário</th>
        <th>Ação</th>
        <th>Entidade</th>
        <th>Descrição</th>
      </tr>
    </thead>
    <tbody>
      ${linhasLogs}
    </tbody>
  </table>

  <div class="paginacao">
    Mostrando ${(paginacao.pagina - 1) * paginacao.limite + 1} a ${Math.min(paginacao.pagina * paginacao.limite, paginacao.total)} de ${paginacao.total} registros
  </div>

  <div class="resumo">
    <div class="resumo-titulo">Resumo</div>
    <div class="resumo-item">
      <span class="resumo-label">Total de Logs:</span>
      <span>${paginacao.total}</span>
    </div>
  </div>
  ` : `
  <div class="sem-registros">
    Nenhum log encontrado com os filtros aplicados.
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
