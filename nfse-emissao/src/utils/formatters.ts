/**
 * Formata um CNPJ (apenas números) para o formato XX.XXX.XXX/XXXX-XX
 * @param cnpj CNPJ sem formatação (apenas números)
 * @returns CNPJ formatado
 */
export function formatarCnpj(cnpj: string | null | undefined): string {
  if (!cnpj) return '';
  
  // Remove caracteres não numéricos
  const numeros = cnpj.replace(/\D/g, '');
  
  // Verifica se tem o tamanho correto
  if (numeros.length !== 14) return cnpj;
  
  // Aplica a máscara XX.XXX.XXX/XXXX-XX
  return numeros.replace(
    /^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/,
    '$1.$2.$3/$4-$5'
  );
}

/**
 * Formata a inscrição municipal em grupos de 3 dígitos
 * @param inscricao Inscrição municipal sem formatação
 * @returns Inscrição municipal formatada
 */
export function formatarInscricaoMunicipal(inscricao: string | null | undefined): string {
  if (!inscricao) return '';
  
  // Remove caracteres não numéricos
  const numeros = inscricao.replace(/\D/g, '');
  
  // Formata em grupos de 3 dígitos
  let formatted = '';
  for (let i = 0; i < numeros.length; i++) {
    if (i > 0 && i % 3 === 0) {
      formatted += '.';
    }
    formatted += numeros[i];
  }
  
  return formatted;
}

/**
 * Formata um número de telefone para o formato (XX) XXXXX-XXXX ou (XX) XXXX-XXXX
 * @param telefone Telefone sem formatação (apenas números)
 * @returns Telefone formatado
 */
export function formatarTelefone(telefone: string | null | undefined): string {
  if (!telefone) return '';
  
  // Remove caracteres não numéricos
  const numeros = telefone.replace(/\D/g, '');
  
  // Verifica o tamanho para aplicar a máscara correta
  if (numeros.length === 11) {
    // Celular: (XX) XXXXX-XXXX
    return numeros.replace(
      /^(\d{2})(\d{5})(\d{4})$/,
      '($1) $2-$3'
    );
  } else if (numeros.length === 10) {
    // Fixo: (XX) XXXX-XXXX
    return numeros.replace(
      /^(\d{2})(\d{4})(\d{4})$/,
      '($1) $2-$3'
    );
  }
  
  // Se não tiver o tamanho padrão, retorna como está
  return telefone;
}

/**
 * Formata o código do Item Lista Serviço conforme o manual de integração
 * @param codigo Código do Item Lista Serviço sem formatação
 * @returns Código do Item Lista Serviço formatado (XX.XX)
 */
export function formatarItemListaServico(codigo: string | null | undefined): string {
  if (!codigo) return '';
  
  // Remove caracteres não numéricos
  const numeros = codigo.replace(/\D/g, '');
  
  // Garantir que o código tenha 4 dígitos, preenchendo com zeros à esquerda
  const numerosPadded = numeros.padStart(4, '0');
  
  // Pegar apenas os últimos 4 dígitos caso o código seja maior
  const ultimosQuatroDigitos = numerosPadded.slice(-4);
  
  // Aplicar a máscara XX.XX conforme o manual de integração
  return ultimosQuatroDigitos.replace(/^(\d{2})(\d{2})$/, '$1.$2');
}

/**
 * Formata um valor numérico para exibição como moeda (R$ 1.234,56)
 * @param valor Valor numérico a ser formatado
 * @returns Valor formatado como moeda
 */
export function formatarMoeda(valor: number | null | undefined): string {
  if (valor === null || valor === undefined) return 'R$ 0,00';
  
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(valor);
}

/**
 * Formata um valor numérico para exibição como valor decimal (1.234,56)
 * @param valor Valor numérico a ser formatado
 * @param casasDecimais Número de casas decimais (padrão: 2)
 * @returns Valor formatado
 */
export function formatarNumero(valor: number | null | undefined, casasDecimais: number = 2): string {
  if (valor === null || valor === undefined) return '0,00';
  
  return new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: casasDecimais,
    maximumFractionDigits: casasDecimais
  }).format(valor);
}

/**
 * Formata um valor numérico para exibição como percentual (12,34%)
 * @param valor Valor numérico a ser formatado (0.1234 = 12,34%)
 * @param casasDecimais Número de casas decimais (padrão: 2)
 * @returns Valor formatado como percentual
 */
export function formatarPercentual(valor: number | null | undefined, casasDecimais: number = 2): string {
  if (valor === null || valor === undefined) return '0,00%';
  
  return new Intl.NumberFormat('pt-BR', {
    style: 'percent',
    minimumFractionDigits: casasDecimais,
    maximumFractionDigits: casasDecimais
  }).format(valor);
}

/**
 * Converte uma string formatada com vírgula como separador decimal para um número
 * @param valorFormatado String formatada (ex: "1.234,56")
 * @returns Valor numérico
 */
export function converterParaNumero(valorFormatado: string | null | undefined): number {
  if (!valorFormatado) return 0;
  
  // Remove todos os caracteres não numéricos, exceto vírgula e ponto
  const limpo = valorFormatado.replace(/[^0-9,\.]/g, '');
  
  // Converte para o formato que o parseFloat entende (ponto como separador decimal)
  const valorNumerico = parseFloat(limpo.replace(/\./g, '').replace(',', '.'));
  
  return isNaN(valorNumerico) ? 0 : valorNumerico;
}

/**
 * Formata um valor durante a digitação, mantendo apenas números e vírgula
 * @param valor Valor sendo digitado
 * @param casasDecimais Número de casas decimais (padrão: 2)
 * @returns Valor formatado para exibição durante digitação
 */
export function formatarValorDigitacao(valor: string): string {
  // Remove todos os caracteres não numéricos, exceto vírgula
  let valorLimpo = valor.replace(/[^0-9,]/g, '');
  
  // Garante que só existe uma vírgula
  const partes = valorLimpo.split(',');
  if (partes.length > 2) {
    valorLimpo = partes[0] + ',' + partes.slice(1).join('');
  }
  
  // Se começar com vírgula, adiciona zero antes
  if (valorLimpo.startsWith(',')) {
    valorLimpo = '0' + valorLimpo;
  }
  
  // Limita a parte decimal a 2 casas
  if (valorLimpo.includes(',')) {
    const [inteira, decimal] = valorLimpo.split(',');
    valorLimpo = inteira + ',' + decimal.substring(0, 2);
  }
  
  return valorLimpo || '0,00';
}
