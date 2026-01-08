export function initializeCalculos() {
  // Adicionar listeners para a primeira linha de serviço
  const container = document.getElementById('servicos-container');
  
  if (container) {
    // Listener para mudança de serviço
    container.addEventListener('change', function(e) {
      const target = e.target as HTMLSelectElement;
      if (target?.name === 'servicoId[]') {
        atualizarValorUnitario(target);
      }
    });
    
    // Listener para mudança de quantidade ou valor unitário
    container.addEventListener('input', function(e) {
      const target = e.target as HTMLInputElement;
      if (target?.name === 'quantidade[]' || target?.name === 'valorUnitario[]') {
        const tr = target.closest('tr');
        if (tr) {
          calcularValorTotal(tr as HTMLTableRowElement);
        }
      }
    });
  }
  
  // Listener para o botão de adicionar serviço
  const btnAdicionar = document.getElementById('adicionar-servico');
  if (btnAdicionar) {
    btnAdicionar.addEventListener('click', function() {
      if (!container) return;
      const firstTr = container.querySelector('tr');
      if (!firstTr) return;
      const tr = firstTr.cloneNode(true) as HTMLTableRowElement;
      
      // Limpar valores dos inputs
      tr.querySelectorAll('input').forEach(input => {
        if (input.name === 'quantidade[]') {
          input.value = '1';
        } else {
          input.value = '';
        }
      });
      
      // Limpar seleção do serviço
      const select = tr.querySelector('select');
      if (select) {
        select.selectedIndex = 0;
      }
      
      container.appendChild(tr);
    });
  }
  
  // Listener para remover serviço
  if (container) {
    container.addEventListener('click', function(e) {
      const button = (e.target as HTMLElement).closest('button');
      if (button?.classList.contains('text-red-600')) {
        const rows = container.querySelectorAll('tr');
        if (rows.length > 1) {
          button.closest('tr')?.remove();
          atualizarTotaisGerais();
        }
      }
    });
  }
}

function atualizarValorUnitario(selectServico: HTMLSelectElement) {
  const tr = selectServico.closest('tr');
  if (!tr) return;
  
  const valorUnitarioInput = tr.querySelector('input[name="valorUnitario[]"]') as HTMLInputElement;
  const option = selectServico.options[selectServico.selectedIndex];
  const valorServico = option.dataset.valor;
  
  if (valorServico) {
    valorUnitarioInput.value = parseFloat(valorServico).toFixed(2);
    calcularValorTotal(tr);
  }
}

function calcularValorTotal(tr: HTMLTableRowElement) {
  const quantidadeInput = tr.querySelector('input[name="quantidade[]"]') as HTMLInputElement;
  const valorUnitarioInput = tr.querySelector('input[name="valorUnitario[]"]') as HTMLInputElement;
  const valorTotalInput = tr.querySelector('input[name="valorTotal[]"]') as HTMLInputElement;
  
  const quantidade = parseFloat(quantidadeInput.value) || 0;
  const valorUnitario = parseFloat(valorUnitarioInput.value) || 0;
  
  const valorTotal = quantidade * valorUnitario;
  valorTotalInput.value = valorTotal.toFixed(2);
  
  atualizarTotaisGerais();
}

function atualizarTotaisGerais() {
  const valoresServicos = Array.from(document.querySelectorAll('input[name="valorTotal[]"]'))
    .map(input => parseFloat((input as HTMLInputElement).value) || 0)
    .reduce((total, valor) => total + valor, 0);

  const valorServicosInput = document.querySelector('input[name="valorServicos"]') as HTMLInputElement;
  const baseCalculoInput = document.querySelector('input[name="baseCalculo"]') as HTMLInputElement;
  
  if (valorServicosInput) {
    valorServicosInput.value = valoresServicos.toFixed(2);
  }
  
  if (baseCalculoInput) {
    baseCalculoInput.value = valoresServicos.toFixed(2);
  }
}
