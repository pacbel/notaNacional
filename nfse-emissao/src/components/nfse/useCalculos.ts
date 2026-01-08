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
    
    // Usa os serviços passados diretamente para o hook
    
  const atualizarValorUnitario = (servicoId: string, index: number) => {
    if (servicoId) {
      const servico = servicosRef.current.find(s => s.id === servicoId);
      if (servico) {
        const valorUnitarioInput = document.querySelector(`[data-testid="valor-unitario-input${index > 0 ? `-${index}` : ''}"]`) as HTMLInputElement;
        if (valorUnitarioInput) {
          valorUnitarioInput.value = parseFloat(servico.valorUnitario.toString()).toFixed(2);
          calcularValorTotal(index);
        }
      } else {
        console.warn('Serviço não encontrado para o ID:', servicoId);
      }
    }
  };

  const calcularValorTotal = (index: number) => {
    const quantidadeInput = document.querySelector(`[data-testid="quantidade-input${index > 0 ? `-${index}` : ''}"]`) as HTMLInputElement;
    const valorUnitarioInput = document.querySelector(`[data-testid="valor-unitario-input${index > 0 ? `-${index}` : ''}"]`) as HTMLInputElement;
    const valorTotalInput = document.querySelector(`[data-testid="valor-total-input${index > 0 ? `-${index}` : ''}"]`) as HTMLInputElement;
    
    if (quantidadeInput && valorUnitarioInput && valorTotalInput) {
      const quantidade = parseFloat(quantidadeInput.value) || 0;
      const valorUnitario = parseFloat(valorUnitarioInput.value) || 0;
      
      valorUnitarioInput.value = valorUnitario.toFixed(2);
      
      const valorTotal = quantidade * valorUnitario;
      valorTotalInput.value = valorTotal.toFixed(2);
      
      atualizarTotaisGerais();
    }
  };

  const atualizarTotaisGerais = () => {
    // Obter todos os inputs de valor total
    const inputsValorTotal = document.querySelectorAll('[data-testid^="valor-total-input"]');
    
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
      
      // Obter valores de retenções federais
      const valorPis = parseFloat((document.querySelector('input[name="valorPis"]') as HTMLInputElement)?.value?.replace(',', '.') || '0') || 0;
      const valorCofins = parseFloat((document.querySelector('input[name="valorCofins"]') as HTMLInputElement)?.value?.replace(',', '.') || '0') || 0;
      const valorInss = parseFloat((document.querySelector('input[name="valorInss"]') as HTMLInputElement)?.value?.replace(',', '.') || '0') || 0;
      const valorIr = parseFloat((document.querySelector('input[name="valorIr"]') as HTMLInputElement)?.value?.replace(',', '.') || '0') || 0;
      const valorCsll = parseFloat((document.querySelector('input[name="valorCsll"]') as HTMLInputElement)?.value?.replace(',', '.') || '0') || 0;
      const outrasRetencoes = parseFloat((document.querySelector('input[name="outrasRetencoes"]') as HTMLInputElement)?.value?.replace(',', '.') || '0') || 0;
      
      // Calcular a base de cálculo
      const baseCalculo = valoresServicos - valorDeducoes - descontoIncondicionado;
      
      // Atualizar o campo de base de cálculo
      if (baseCalculoInput) {
        baseCalculoInput.value = baseCalculo.toFixed(2).replace('.', ',');
      } else {
        console.error('[ERRO] Não foi possível encontrar o input baseCalculo');
      }
      
      // Calcular o valor do ISS
      const aliquotaInput = document.querySelector('input[name="aliquota"]') as HTMLInputElement;
      const valorIssInput = document.querySelector('input[name="valorIss"]') as HTMLInputElement;
      
      let aliquota = 0;
      if (aliquotaInput) {
        aliquota = parseFloat(aliquotaInput.value.replace(',', '.')) / 100 || 0;
      }
      
      const valorIss = baseCalculo * aliquota;
      
      if (valorIssInput) {
        valorIssInput.value = valorIss.toFixed(2).replace('.', ',');
      }
      
      // Verificar se o ISS é retido
      const issRetidoSelect = document.querySelector('select[name="issRetido"]') as HTMLSelectElement;
      const issRetido = issRetidoSelect?.value === '1';
      
      // Calcular o valor líquido
      let valorLiquido = valoresServicos;
      
      // Subtrair deduções e descontos
      valorLiquido -= valorDeducoes;
      valorLiquido -= descontoIncondicionado;
      valorLiquido -= descontoCondicionado;
      
      // Subtrair retenções
      valorLiquido -= valorPis;
      valorLiquido -= valorCofins;
      valorLiquido -= valorInss;
      valorLiquido -= valorIr;
      valorLiquido -= valorCsll;
      valorLiquido -= outrasRetencoes;
      
      // Subtrair ISS se for retido
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
      
  };

  useEffect(() => {
    const container = document.getElementById('servicos-container');
    
    if (container) {
      // Listener para mudança de serviço
      container.addEventListener('change', function(e) {
        const target = e.target as HTMLSelectElement;
        if (target?.name === 'servicoId[]') {
          const tr = target.closest('tr');
          const rows = container.querySelectorAll('tr');
          const index = Array.from(rows).indexOf(tr as HTMLTableRowElement);
          atualizarValorUnitario(target.value, index);
        }
      });
      
      // Listener para mudança de quantidade ou valor unitário
      container.addEventListener('input', function(e) {
        const target = e.target as HTMLInputElement;
        if (target?.name === 'quantidade[]' || target?.name === 'valorUnitario[]') {
          const tr = target.closest('tr');
          const rows = container.querySelectorAll('tr');
          const index = Array.from(rows).indexOf(tr as HTMLTableRowElement);
          calcularValorTotal(index);
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
        const input = document.querySelector(`[data-testid="${campo}-input"]`);
        if (input) {
          input.addEventListener('input', atualizarTotaisGerais);
          input.addEventListener('change', atualizarTotaisGerais);
        }
      });
      
      // Listener para remover serviço
      container.addEventListener('click', function(e) {
        const target = e.target as HTMLElement;
        if (target.getAttribute('aria-label') === 'Remover item') {
          const tr = target.closest('tr');
          if (tr) {
            const rows = container.querySelectorAll('tr');
            if (rows.length > 1) {
              tr.remove();
              atualizarTotaisGerais();
            }
          }
        }
      });
    }
    
    return () => {
      // Cleanup listeners
      const container = document.getElementById('servicos-container');
      if (container) {
        container.removeEventListener('change', () => {});
        container.removeEventListener('input', () => {});
        container.removeEventListener('click', () => {});
      }
    };
  }, []);
  
  return {
    atualizarValorUnitario,
    calcularValorTotal,
    atualizarTotaisGerais
  };
}
