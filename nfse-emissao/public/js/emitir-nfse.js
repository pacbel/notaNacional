document.addEventListener('DOMContentLoaded', function() {
  // Dados dos prestadores
  let prestadoresData = [];
  try {
    const prestadoresDataElement = document.getElementById('prestadoresData');
    if (prestadoresDataElement && prestadoresDataElement.textContent) {
      prestadoresData = JSON.parse(prestadoresDataElement.textContent);
      console.log('Dados dos prestadores carregados:', prestadoresData);
    } else {
      console.error('Elemento prestadoresData não encontrado ou vazio');
    }
  } catch (error) {
    console.error('Erro ao carregar dados dos prestadores:', error);
  }

  // Obter referências aos campos ocultos existentes
  console.log('Obtendo referências aos campos ocultos...');
  const form = document.getElementById('emitirNfseForm');
  if (!form) {
    console.error('Formulário não encontrado!');
    return;
  }
  
  const serieInput = form.querySelector('input[name="serie"]');
  const ambienteInput = form.querySelector('input[name="ambiente"]');
  const optanteSimplesNacionalInput = form.querySelector('input[name="optanteSimplesNacional"]');
  const incentivadorCulturalInput = form.querySelector('input[name="incentivadorCultural"]');
  
  if (!serieInput || !ambienteInput || !optanteSimplesNacionalInput || !incentivadorCulturalInput) {
    console.error('Campos ocultos não encontrados no formulário!');
    return;
  }
  
  console.log('Campos ocultos encontrados com sucesso:', {
    serie: serieInput.value,
    ambiente: ambienteInput.value,
    optanteSimplesNacional: optanteSimplesNacionalInput.value,
    incentivadorCultural: incentivadorCulturalInput.value
  });

  // Evento ao selecionar um prestador
  const selectPrestador = document.querySelector('select[name="prestadorId"]');
  if (selectPrestador) {
    selectPrestador.addEventListener('change', function() {
      const prestadorId = this.value;
      console.log('Prestador selecionado:', prestadorId);
      
      if (prestadorId) {
        const prestador = prestadoresData.find(p => p.id === prestadorId);
        console.log('Dados do prestador encontrado:', prestador);
        
        if (prestador) {
          // Preencher os campos ocultos com os valores do prestador
          serieInput.value = prestador.serie || '1';
          ambienteInput.value = prestador.ambiente || '2';
          // Converter booleanos para string '1' ou '0'
          optanteSimplesNacionalInput.value = prestador.optanteSimplesNacional ? '1' : '0';
          incentivadorCulturalInput.value = prestador.incentivadorCultural ? '1' : '0';
          console.log('Dados do prestador atualizados:', {
            serie: serieInput.value,
            ambiente: ambienteInput.value,
            optanteSimplesNacional: optanteSimplesNacionalInput.value,
            incentivadorCultural: incentivadorCulturalInput.value
          });
        } else {
          console.error('Prestador não encontrado nos dados:', prestadorId);
        }
      }
    });
    
    // Disparar o evento change se já houver um prestador selecionado
    if (selectPrestador.value) {
      const event = new Event('change');
      selectPrestador.dispatchEvent(event);
    }
  } else {
    console.error('Seletor de prestador não encontrado!');
  }

  // Função para calcular o valor total de um serviço
  function calcularValorTotal(row) {
    const quantidade = parseFloat(row.querySelector('input[name="quantidade[]"]').value) || 0;
    const valorUnitario = parseFloat(row.querySelector('input[name="valorUnitario[]"]').value) || 0;
    const valorTotal = quantidade * valorUnitario;
    row.querySelector('input[name="valorTotal[]"]').value = valorTotal.toFixed(2);
    
    // Recalcular o valor total dos serviços
    calcularValorTotalServicos();
  }

  // Função para calcular o valor total dos serviços
  function calcularValorTotalServicos() {
    const rows = document.querySelectorAll('#servicos-container tr');
    let valorTotalServicos = 0;
    
    rows.forEach(row => {
      const valorTotalInput = row.querySelector('input[name="valorTotal[]"]');
      if (valorTotalInput && valorTotalInput.value) {
        valorTotalServicos += parseFloat(valorTotalInput.value);
      }
    });
    
    // Atualizar os campos de valor dos serviços e base de cálculo
    document.querySelector('input[name="valorServicos"]').value = valorTotalServicos.toFixed(2);
    document.querySelector('input[name="baseCalculo"]').value = valorTotalServicos.toFixed(2);
  }

  // Função para adicionar eventos a uma linha de serviço
  function adicionarEventosAoServicoRow(row) {
    // Evento ao selecionar um serviço
    const selectServico = row.querySelector('select[name="servicoId[]"]');
    selectServico.addEventListener('change', function() {
      const option = this.options[this.selectedIndex];
      const valorUnitario = option.getAttribute('data-valor');
      if (valorUnitario) {
        row.querySelector('input[name="valorUnitario[]"]').value = parseFloat(valorUnitario).toFixed(2);
        calcularValorTotal(row);
      }
    });
    
    // Eventos para recalcular ao mudar quantidade ou valor unitário
    row.querySelector('input[name="quantidade[]"]').addEventListener('input', function() {
      calcularValorTotal(row);
    });
    
    row.querySelector('input[name="valorUnitario[]"]').addEventListener('input', function() {
      calcularValorTotal(row);
    });
    
    // Botão de remover
    const btnRemover = row.querySelector('button');
    btnRemover.addEventListener('click', function() {
      const container = document.getElementById('servicos-container');
      if (container.querySelectorAll('tr').length > 1) {
        row.remove();
        calcularValorTotalServicos();
      }
    });
  }

  // Adicionar eventos ao botão de adicionar serviço
  document.getElementById('adicionar-servico').addEventListener('click', function() {
    const container = document.getElementById('servicos-container');
    const newRow = container.querySelector('tr').cloneNode(true);
    
    // Limpar valores
    newRow.querySelectorAll('input').forEach(input => {
      if (input.name === 'quantidade[]') {
        input.value = '1';
      } else {
        input.value = '';
      }
    });
    
    newRow.querySelector('select').value = '';
    
    // Adicionar eventos aos novos campos
    adicionarEventosAoServicoRow(newRow);
    
    container.appendChild(newRow);
  });
  
  // Interceptar o envio do formulário para processar a resposta JSON
  console.log('Configurando interceptação do envio do formulário...');
  const formElement = document.getElementById('emitirNfseForm');
  if (formElement) {
    console.log('Formulário encontrado, adicionando evento submit');
    
    // Remover eventos anteriores para evitar duplicação
    const novoForm = formElement.cloneNode(true);
    formElement.parentNode.replaceChild(novoForm, formElement);
    
    novoForm.addEventListener('submit', async function(e) {
      console.log('Formulário enviado, interceptando...');
      e.preventDefault();
      
      try {
        // Mostrar mensagem de carregamento
        const btnEmitir = document.querySelector('button[type="submit"]');
        const textoOriginal = btnEmitir.innerHTML;
        btnEmitir.innerHTML = '<span class="animate-pulse">Processando...</span>';
        btnEmitir.disabled = true;
        
        console.log('Enviando formulário via fetch...');
        // Enviar formulário via fetch
        const formData = new FormData(novoForm);
        
        // Verificar os dados do formulário
        console.log('Dados do formulário:');
        for (let pair of formData.entries()) {
          console.log(pair[0] + ': ' + pair[1]);
        }
        
        const response = await fetch('/api/nfse/emitir', {
          method: 'POST',
          body: formData
        });
        
        console.log('Resposta recebida, status:', response.status);
        
        if (!response.ok) {
          throw new Error(`Erro HTTP: ${response.status}`);
        }
        
        const responseData = await response.json();
        console.log('Dados da resposta:', responseData);
        
        if (responseData.success) {
          // Redirecionar para a página de visualização da nota fiscal
          console.log('Redirecionando para:', `/nfse/${responseData.id}`);
          window.location.href = `/nfse/${responseData.id}`;
        } else {
          // Mostrar mensagem de erro
          console.error('Erro retornado pela API:', responseData.error);
          alert(responseData.error || 'Erro ao emitir NFS-e');
          btnEmitir.innerHTML = textoOriginal;
          btnEmitir.disabled = false;
        }
      } catch (errorObj) {
        console.error('Erro ao emitir NFS-e:', errorObj);
        alert('Erro ao emitir NFS-e. Verifique o console para mais detalhes.');
        
        // Restaurar botão
        const btnEmitir = document.querySelector('button[type="submit"]');
        btnEmitir.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path><polyline points="17 21 17 13 7 13 7 21"></polyline><polyline points="7 3 7 8 15 8"></polyline></svg><span>Emitir NFS-e</span>';
        btnEmitir.disabled = false;
      }
    });
    
    console.log('Evento submit adicionado com sucesso');
  } else {
    console.error('Formulário não encontrado!');
  }
  
  // Adicionar eventos às linhas de serviço existentes
  document.querySelectorAll('#servicos-container tr').forEach(adicionarEventosAoServicoRow);
});
