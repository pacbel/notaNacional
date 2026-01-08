/**
 * Arquivo principal para o fluxo de emissão de NFSe
 * Este arquivo foi refatorado para melhorar a manutenção e legibilidade do código.
 * Todas as funções foram movidas para arquivos separados dentro da pasta nfe_fluxo.
 */

// Exporta a função principal de transmissão de nota
import { transmitirNota } from './nfe_fluxo/transmitirNota';

// Re-exporta a função para manter a compatibilidade com o código existente
export { transmitirNota };
