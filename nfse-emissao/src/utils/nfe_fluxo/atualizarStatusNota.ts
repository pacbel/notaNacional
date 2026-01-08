/**
 * Utilitário para atualizar o status da nota fiscal com base no XML
 * Este arquivo foi modificado para redirecionar para a nova implementação em verificarStatusNota.ts
 */
import { verificarStatusNota } from './verificarStatusNota';

/**
 * Atualiza o status da nota fiscal com base no XML recebido
 * @param notaId ID da nota fiscal
 * @param xmlContent Conteúdo do XML da NFSe
 * @returns Objeto com o resultado da operação
 */
export async function atualizarStatusNota(notaId: string, xmlContent: string) {
  // Redirecionar para a nova implementação
  return verificarStatusNota(notaId, xmlContent);
}
