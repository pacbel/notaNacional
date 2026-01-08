'use client';

import { useEffect, useRef } from 'react';

export interface Servico {
  id: string;
  descricao: string;
  valorUnitario: number;
  codigoTributacao?: string;
  itemListaServico?: string;
}

interface UseCalculosProps {
  servicos: Servico[];
}

export function useCalculos({ servicos }: UseCalculosProps) {
  const servicosRef = useRef<Servico[]>(servicos);
  
  // Atualiza a referência quando os serviços mudam
  useEffect(() => {
    servicosRef.current = servicos;
  }, [servicos]);
  useEffect(() => {
    
    // Usa os serviços passados diretamente para o hook
    
    function atualizarValorUnitario(selectServico: HTMLSelectElement) {
      const tr = selectServico.closest('tr');
      if (!tr) return;
      
      const valorUnitarioInput = tr.querySelector('input[name="valorUnitario[]"]') as HTMLInputElement;
      const servicoId = selectServico.value;
      
      if (servicoId) {
        const servico = servicosRef.current.find(s => s.id === servicoId);
        if (servico) {
          // Garantir que o valor seja formatado com duas casas decimais
          valorUnitarioInput.value = parseFloat(servico.valorUnitario.toString()).toFixed(2);
          calcularValorTotal(tr);
        } else {
          console.warn('Serviço não encontrado para o ID:', servicoId);
        }
      } else {
        valorUnitarioInput.value = '0.00';
        calcularValorTotal(tr);
      }
    }

    function calcularValorTotal(tr: HTMLTableRowElement) {
      const quantidadeInput = tr.querySelector('input[name="quantidade[]"]') as HTMLInputElement;
      const valorUnitarioInput = tr.querySelector('input[name="valorUnitario[]"]') as HTMLInputElement;
      const valorTotalInput = tr.querySelector('input[name="valorTotal[]"]') as HTMLInputElement;
      
      // Garantir que os valores sejam formatados com duas casas decimais
      const quantidade = parseFloat(quantidadeInput.value) || 0;
      const valorUnitario = parseFloat(valorUnitarioInput.value) || 0;
      
      // Formatar o valor unitário com duas casas decimais
      valorUnitarioInput.value = valorUnitario.toFixed(2);
      
      const valorTotal = quantidade * valorUnitario;
      valorTotalInput.value = valorTotal.toFixed(2);
      
      atualizarTotaisGerais();
    }

    function atualizarTotaisGerais() {
      
      // Obter todos os inputs de valor total
      const inputsValorTotal = document.querySelectorAll('input[name="valorTotal[]"]');
      
      // Exibir os valores individuais para debug
      inputsValorTotal.forEach((input, index) => {
      });
      
      // Calcular a soma de todos os valores totais dos serviços
      const valoresServicos = Array.from(inputsValorTotal)
        .map(input => {
          const valor = parseFloat((input as HTMLInputElement).value) || 0;
          return valor;
        })
        .reduce((total, valor) => total + valor, 0);

      
      // Formatar o valor para duas casas decimais com vírgula (padrão brasileiro)
      const valorFormatadoBR = valoresServicos.toFixed(2).replace('.', ',');
      
      // Atualizar os campos de valor dos serviços e base de cálculo
      const valorServicosInput = document.querySelector('input[name="valorServicos"]') as HTMLInputElement;
      const baseCalculoInput = document.querySelector('input[name="baseCalculo"]') as HTMLInputElement;
      
      // Atualizar o campo de valor dos serviços
      if (valorServicosInput) {
        valorServicosInput.value = valorFormatadoBR;
      } else {
        console.error('[ERRO] Não foi possível encontrar o input valorServicos');
      }
      
      // Obter valores de retenções e descontos
      const valorDeducoes = parseFloat((document.querySelector('input[name="valorDeducoes"]') as HTMLInputElement)?.value?.replace(',', '.') || '0') || 0;
      const descontoCondicionado = parseFloat((document.querySelector('input[name="descontoCondicionado"]') as HTMLInputElement)?.value?.replace(',', '.') || '0') || 0;
      const descontoIncondicionado = parseFloat((document.querySelector('input[name="descontoIncondicionado"]') as HTMLInputElement)?.value?.replace(',', '.') || '0') || 0;
      const valorPis = parseFloat((document.querySelector('input[name="valorPis"]') as HTMLInputElement)?.value?.replace(',', '.') || '0') || 0;
      const valorCofins = parseFloat((document.querySelector('input[name="valorCofins"]') as HTMLInputElement)?.value?.replace(',', '.') || '0') || 0;
      const valorInss = parseFloat((document.querySelector('input[name="valorInss"]') as HTMLInputElement)?.value?.replace(',', '.') || '0') || 0;
      const valorIr = parseFloat((document.querySelector('input[name="valorIr"]') as HTMLInputElement)?.value?.replace(',', '.') || '0') || 0;
      const valorCsll = parseFloat((document.querySelector('input[name="valorCsll"]') as HTMLInputElement)?.value?.replace(',', '.') || '0') || 0;
      const outrasRetencoes = parseFloat((document.querySelector('input[name="outrasRetencoes"]') as HTMLInputElement)?.value?.replace(',', '.') || '0') || 0;
      
      // Calcular base de cálculo (valor dos serviços - deduções - descontos incondicionados)
      const baseCalculo = valoresServicos - valorDeducoes - descontoIncondicionado;
      const baseCalculoFormatadoBR = baseCalculo.toFixed(2).replace('.', ',');
      
      // Atualizar o campo de base de cálculo
      if (baseCalculoInput) {
        baseCalculoInput.value = baseCalculoFormatadoBR;
      } else {
        console.error('[ERRO] Não foi possível encontrar o input baseCalculo');
      }
      
      // Calcular o valor do ISS
      const aliquota = parseFloat((document.querySelector('input[name="aliquota"]') as HTMLInputElement)?.value?.replace(',', '.') || '0') || 0;
      const valorIss = baseCalculo * (aliquota / 100);
      
      // Atualizar o campo de valor do ISS (se existir)
      const valorIssInput = document.querySelector('input[name="valorIss"]') as HTMLInputElement;
      if (valorIssInput) {
        valorIssInput.value = valorIss.toFixed(2).replace('.', ',');
      }

      // Obter o estado do ISS Retido
      const issRetido = (document.querySelector('select[name="issRetido"]') as HTMLSelectElement)?.value === 'true';

      // Calcular o valor líquido
      let valorLiquido = valoresServicos;
      
      // Subtrair descontos
      valorLiquido -= valorDeducoes;
      valorLiquido -= descontoIncondicionado;
      valorLiquido -= descontoCondicionado;
      
      // Subtrair retenções federais
      valorLiquido -= valorPis;
      valorLiquido -= valorCofins;
      valorLiquido -= valorInss;
      valorLiquido -= valorIr;
      valorLiquido -= valorCsll;
      valorLiquido -= outrasRetencoes;
      
      // Subtrair o valor do ISS apenas se for retido pelo tomador
      if (issRetido) {
        valorLiquido -= valorIss;
      }
      
      // Atualizar o campo de valor líquido
      const valorLiquidoInput = document.querySelector('input[name="valorLiquidoNfse"]') as HTMLInputElement;
      if (valorLiquidoInput) {
        valorLiquidoInput.value = valorLiquido.toFixed(2).replace('.', ',');
      } else {
        console.error('[ERRO] Não foi possível encontrar o input valorLiquidoNfse');
      }
      
    }

    const container = document.getElementById('servicos-container');
    
    if (container) {
      // Listener para mudança de serviço
      container.addEventListener('change', function(e) {
        const target = e.target as HTMLSelectElement;
        if (target?.name === 'servicoId[]') {
          atualizarValorUnitario(target);
        }
      });
      
      // Listener para mudança de quantidade, valor unitário ou campos de retenções e descontos
      container.addEventListener('input', function(e) {
        const target = e.target as HTMLInputElement;
        if (target?.name === 'quantidade[]' || target?.name === 'valorUnitario[]') {
          const tr = target.closest('tr');
          if (tr) {
            calcularValorTotal(tr as HTMLTableRowElement);
          }
        }
      });
      
      // Listener para mudança nos campos de retenções e descontos
      const camposRetencoes = [
        'valorDeducoes',
        'descontoCondicionado',
        'descontoIncondicionado',
        'valorPis',
        'valorCofins',
        'valorInss',
        'valorIr',
        'valorCsll',
        'outrasRetencoes',
        'aliquota',
        'issRetido'
      ];
      
      camposRetencoes.forEach(campo => {
        const input = document.querySelector(`input[name="${campo}"]`) || document.querySelector(`select[name="${campo}"]`);
        if (input) {
          input.addEventListener('input', atualizarTotaisGerais);
          input.addEventListener('change', atualizarTotaisGerais);
        }
      });
      
      // Listener para o botão de adicionar serviço
      const btnAdicionar = document.getElementById('adicionar-servico');
      if (btnAdicionar) {
        // Remover o listener antigo para evitar duplicação
        const oldClickHandler = btnAdicionar.onclick;
        
        // Vamos desativar este listener para evitar a duplicação
        // Comentando o código abaixo para evitar a adição duplicada de serviços
        /*
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
        */
      }
      
      // Listener para remover serviço
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
  }, []);
}
