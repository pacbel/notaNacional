/**
 * Verifica a situação do lote RPS
 * Códigos de situação:
 * 1 – Não Recebido
 * 2 – Não Processado
 * 3 – Processado com Erro
 * 4 – Processado com Sucesso
 * 
 * @param situacao Código de situação do lote RPS
 * @returns Objeto com informações sobre a situação (isSucesso, isErro, descricao)
 */
export function verificarSituacaoLoteRps(situacao: string): { isSucesso: boolean; isErro: boolean; descricao: string } {
  const situacaoNum = parseInt(situacao, 10);
  
  switch (situacaoNum) {
    case 1:
      return { isSucesso: false, isErro: true, descricao: 'Não Recebido' };
    case 2:
      return { isSucesso: false, isErro: false, descricao: 'Não Processado' };
    case 3:
      return { isSucesso: false, isErro: true, descricao: 'Processado com Erro' };
    case 4:
      return { isSucesso: true, isErro: false, descricao: 'Processado com Sucesso' };
    default:
      return { isSucesso: false, isErro: true, descricao: 'Situação desconhecida' };
  }
}
