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
    
    // Layout compacto com apenas o botão de imprimir
    const conteudoContainer = document.createElement('div');
    conteudoContainer.className = 'controle-conteudo';
    
    // Botão para imprimir
    const botaoImprimir = document.createElement('button');
    botaoImprimir.id = 'imprimir-relatorio';
    botaoImprimir.className = 'controle-botao imprimir';
    botaoImprimir.textContent = 'Imprimir';
    botaoImprimir.onclick = () => window.print();
    conteudoContainer.appendChild(botaoImprimir);

    // Botão para fechar
    const botaoFechar = document.createElement('button');
    botaoFechar.id = 'fechar-relatorio';
    botaoFechar.className = 'controle-botao fechar';
    botaoFechar.textContent = 'Fechar';
    botaoFechar.onclick = () => window.close();
    conteudoContainer.appendChild(botaoFechar);
    
    controlesContainer.appendChild(conteudoContainer);
    
    // Adicionar ao documento
    document.body.insertBefore(controlesContainer, document.body.firstChild);
    
    // Adicionar estilos
    adicionarEstilos();
    
    // Não precisamos mais configurar o formato de página
    // pois a janela do Windows será usada para isso
  }
}

// Removida a função aplicarFormatoPagina pois não é mais necessária

/**
 * Adiciona estilos CSS para os controles
 */
function adicionarEstilos() {
  const estilo = document.createElement('style');
  estilo.textContent = `
    .relatorio-controles {
      background-color: #1e293b;
      border: none;
      padding: 8px 15px;
      margin: 0 0 10px 0;
      font-family: Arial, sans-serif;
      width: 100%;
    }
    
    .controle-conteudo {
      display: flex;
      align-items: center;
      justify-content: flex-end;
      gap: 15px;
    }
    
    /* Removidos os estilos para o seletor de formato de página */
    
    .controle-botao {
      padding: 5px 12px;
      border: none;
      border-radius: 3px;
      cursor: pointer;
      font-weight: normal;
      font-size: 14px;
    }
    
    .controle-botao.imprimir {
      background-color: #3b82f6;
      color: white;
    }
    
    .controle-botao.imprimir:hover {
      background-color: #2563eb;
    }

    .controle-botao.fechar {
      background-color: #64748b;
      color: white;
    }

    .controle-botao.fechar:hover {
      background-color: #475569;
    }
    
    @media print {
      .relatorio-controles {
        display: none;
      }
    }
  `;
  
  document.head.appendChild(estilo);
}

// Removida a função exportarPDF pois não é mais necessária

// Inicializar os controles quando o documento estiver pronto
window.addEventListener('DOMContentLoaded', adicionarControlesRelatorio);

// Exportar funções para uso externo
window.RelatorioControles = {
  inicializar: adicionarControlesRelatorio
};
