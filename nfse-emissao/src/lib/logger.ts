/**
 * Módulo de logging para o sistema NFSe-emissao
 * Implementa funções para registro de logs em diferentes níveis
 */

/**
 * Interface para o logger
 */
export interface Logger {
  info(message: string): void;
  warn(message: string): void;
  error(message: string): void;
  debug(message: string): void;
}

/**
 * Logger para ambiente de desenvolvimento e produção
 * Em produção, os logs são enviados para o console
 * Em desenvolvimento, os logs são exibidos no console com formatação colorida
 */
class SystemLogger implements Logger {
  private isProd = process.env.NODE_ENV === 'production';

  /**
   * Registra uma mensagem de informação
   * @param message Mensagem a ser registrada
   */
  info(message: string): void {
    if (this.isProd) {
      console.log(`[INFO] ${message}`);
    } else {
      console.log(`%c[INFO] ${message}`, 'color: blue; font-weight: bold');
    }
  }

  /**
   * Registra uma mensagem de aviso
   * @param message Mensagem a ser registrada
   */
  warn(message: string): void {
    if (this.isProd) {
      console.warn(`[AVISO] ${message}`);
    } else {
      console.warn(`%c[AVISO] ${message}`, 'color: orange; font-weight: bold');
    }
  }

  /**
   * Registra uma mensagem de erro
   * @param message Mensagem a ser registrada
   */
  error(message: string): void {
    if (this.isProd) {
      console.error(`[ERRO] ${message}`);
    } else {
      console.error(`%c[ERRO] ${message}`, 'color: red; font-weight: bold');
    }
  }

  /**
   * Registra uma mensagem de depuração
   * @param message Mensagem a ser registrada
   */
  debug(message: string): void {
    if (!this.isProd) {
      console.debug(`%c[DEBUG] ${message}`, 'color: gray');
    }
  }
}

/**
 * Instância do logger para uso em todo o sistema
 */
export const logger = new SystemLogger();
