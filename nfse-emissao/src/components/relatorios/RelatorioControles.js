/**
 * Componente de controles para relatórios
 * Permite selecionar formato de página, exportar para PDF e outras opções
 */

function adicionarControlesRelatorio() {
  // Criar o container de controles se não existir
  if (!document.getElementById('relatorio-controles')) {
    const controlesContainer = document.createElement('div');
    controlesContainer.id = 'relatorio-controles';
    controlesContainer.className = 'relatorio-controles';
    
    // Adicionar título
    const titulo = document.createElement('h3');
    titulo.textContent = 'Opções de Relatório';
    controlesContainer.appendChild(titulo);
    
    // Adicionar seletor de formato de página
    const formatoContainer = document.createElement('div');
    formatoContainer.className = 'controle-grupo';
    
    const formatoLabel = document.createElement('label');
    formatoLabel.textContent = 'Formato de Página:';
    formatoLabel.htmlFor = 'formato-pagina';
    formatoContainer.appendChild(formatoLabel);
    
    const formatoSelect = document.createElement('select');
    formatoSelect.id = 'formato-pagina';
    formatoSelect.className = 'controle-select';
    
    const formatos = [
      { valor: 'a4', texto: 'A4 (210 × 297 mm)' },
      { valor: 'letter', texto: 'Carta (216 × 279 mm)' },
      { valor: 'legal', texto: 'Ofício (216 × 356 mm)' }
    ];
    
    formatos.forEach(formato => {
      const option = document.createElement('option');
      option.value = formato.valor;
      option.textContent = formato.texto;
      formatoSelect.appendChild(option);
    });
    
    formatoContainer.appendChild(formatoSelect);
    controlesContainer.appendChild(formatoContainer);
    
    // Adicionar botões de ação
    const botoesContainer = document.createElement('div');
    botoesContainer.className = 'controle-botoes';
    
    // Botão para exportar PDF
    const botaoPdf = document.createElement('button');
    botaoPdf.id = 'exportar-pdf';
    botaoPdf.className = 'controle-botao pdf';
    botaoPdf.textContent = 'Exportar PDF';
    botaoPdf.onclick = exportarPDF;
    botoesContainer.appendChild(botaoPdf);
    
    // Botão para imprimir
    const botaoImprimir = document.createElement('button');
    botaoImprimir.id = 'imprimir-relatorio';
    botaoImprimir.className = 'controle-botao imprimir';
    botaoImprimir.textContent = 'Imprimir';
    botaoImprimir.onclick = () => window.print();
    botoesContainer.appendChild(botaoImprimir);
    
    controlesContainer.appendChild(botoesContainer);
    
    // Adicionar ao documento
    document.body.insertBefore(controlesContainer, document.body.firstChild);
    
    // Adicionar estilos
    adicionarEstilos();
    
    // Configurar o formato de página inicial
    aplicarFormatoPagina('a4');
    
    // Adicionar event listener para mudança de formato
    formatoSelect.addEventListener('change', (e) => {
      aplicarFormatoPagina(e.target.value);
    });
  }
}

/**
 * Aplica o formato de página selecionado
 */
function aplicarFormatoPagina(formato) {
  const estiloAtual = document.getElementById('estilo-formato-pagina');
  
  if (estiloAtual) {
    estiloAtual.remove();
  }
  
  const estilo = document.createElement('style');
  estilo.id = 'estilo-formato-pagina';
  
  let css = '';
  
  switch (formato) {
    case 'letter':
      css = `
        @page {
          size: letter;
        }
        @media print {
          body {
            width: 216mm;
            height: 279mm;
          }
        }
      `;
      break;
    case 'legal':
      css = `
        @page {
          size: legal;
        }
        @media print {
          body {
            width: 216mm;
            height: 356mm;
          }
        }
      `;
      break;
    default: // A4
      css = `
        @page {
          size: A4;
        }
        @media print {
          body {
            width: 210mm;
            height: 297mm;
          }
        }
      `;
  }
  
  estilo.textContent = css;
  document.head.appendChild(estilo);
}

/**
 * Adiciona estilos CSS para os controles
 */
function adicionarEstilos() {
  const estilo = document.createElement('style');
  estilo.textContent = `
    .relatorio-controles {
      background-color: #f8f9fa;
      border: 1px solid #ddd;
      border-radius: 4px;
      padding: 15px;
      margin-bottom: 20px;
      font-family: Arial, sans-serif;
    }
    
    .relatorio-controles h3 {
      margin-top: 0;
      margin-bottom: 15px;
      color: #2563eb;
      font-size: 18px;
    }
    
    .controle-grupo {
      margin-bottom: 15px;
      display: flex;
      align-items: center;
    }
    
    .controle-grupo label {
      margin-right: 10px;
      font-weight: bold;
      min-width: 150px;
    }
    
    .controle-select {
      padding: 8px;
      border: 1px solid #ddd;
      border-radius: 4px;
      background-color: white;
      min-width: 200px;
    }
    
    .controle-botoes {
      display: flex;
      gap: 10px;
    }
    
    .controle-botao {
      padding: 10px 15px;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-weight: bold;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    
    .controle-botao.pdf {
      background-color: #e53e3e;
      color: white;
    }
    
    .controle-botao.pdf:hover {
      background-color: #c53030;
    }
    
    .controle-botao.imprimir {
      background-color: #2563eb;
      color: white;
    }
    
    .controle-botao.imprimir:hover {
      background-color: #1d4ed8;
    }
    
    @media print {
      .relatorio-controles {
        display: none;
      }
    }
  `;
  
  document.head.appendChild(estilo);
}

/**
 * Exporta o relatório para PDF usando a API de impressão do navegador
 */
function exportarPDF() {
  const filename = 'relatorio_' + new Date().toISOString().slice(0, 10) + '.pdf';
  
  const originalTitle = document.title;
  document.title = filename;
  
  window.print();
  
  // Restaurar o título original
  setTimeout(() => {
    document.title = originalTitle;
  }, 100);
}

// Inicializar os controles quando o documento estiver pronto
window.addEventListener('DOMContentLoaded', adicionarControlesRelatorio);

// Exportar funções para uso externo
window.RelatorioControles = {
  inicializar: adicionarControlesRelatorio,
  aplicarFormatoPagina,
  exportarPDF
};
