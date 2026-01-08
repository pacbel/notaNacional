import codigosTributacao from './codigosTributacao.json';

// Tipos
type CodigosTributacao = {
  [codigo: string]: string;
};

/**
 * Retorna todos os códigos de tributação
 */
export const getCodigosTributacao = (): CodigosTributacao => {
  return codigosTributacao as CodigosTributacao;
};

/**
 * Retorna o nome da atividade pelo código de tributação
 * @param codigo Código de tributação
 * @returns Nome da atividade correspondente ao código
 */
export const getNomeAtividade = (codigo: string): string => {
  const codigosObj = getCodigosTributacao();
  return codigosObj[codigo] || '';
};

/**
 * Retorna todos os códigos de tributação como um array de objetos
 * @returns Array de objetos com código e nome da atividade
 */
export const getCodigosTributacaoArray = (): { codigo: string; nome: string }[] => {
  const codigosObj = getCodigosTributacao();
  return Object.entries(codigosObj)
    .map(([codigo, nome]) => ({
      codigo,
      nome
    }))
    .sort((a, b) => a.nome.localeCompare(b.nome));
};

/**
 * Busca códigos de tributação que contenham o termo de busca
 * @param termo Termo para buscar nos nomes das atividades
 * @returns Array de objetos com código e nome da atividade que correspondem à busca
 */
export const buscarCodigosTributacao = (termo: string): { codigo: string; nome: string }[] => {
  if (!termo) return getCodigosTributacaoArray();
  
  const termoBusca = termo.toLowerCase();
  return getCodigosTributacaoArray()
    .filter(item => 
      item.nome.toLowerCase().includes(termoBusca) || 
      item.codigo.includes(termoBusca)
    );
};
