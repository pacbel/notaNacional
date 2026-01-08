/**
 * Verifica se o código de retorno da API indica sucesso ou erro
 * @param codigo Código de retorno da API
 * @returns Objeto com informações sobre o código (isSucesso, isErro, isAlerta)
 */
export function verificarCodigoRetorno(codigo: string): { isSucesso: boolean; isErro: boolean; isAlerta: boolean } {
  // Códigos que começam com E são erros críticos
  const isErro = codigo.startsWith('E');
  
  // Códigos que começam com L são alertas (não impedem o processamento)
  const isAlerta = codigo.startsWith('L');
  
  // Sucesso é quando não é erro nem alerta
  const isSucesso = !isErro && !isAlerta;
  
  return { isSucesso, isErro, isAlerta };
}
