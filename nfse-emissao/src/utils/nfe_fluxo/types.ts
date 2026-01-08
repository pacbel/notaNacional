/**
 * Tipos utilizados no fluxo de NFSe
 */
import { DadosLoteRpsResponse } from '@/utils/extrair-dados-lote-rps-response';

export type NfseStatus = 'Não Transmitida' | 'Autorizada' | 'Cancelada' | 'Em Espera' | 'Rejeitada' | 'Processando';

/**
 * Tipo de resposta da função de transmissão de nota
 */
export type TransmitirNotaResponse = {
  success: boolean;
  message?: string;
  errors?: string[];
  data?: unknown;
};

export type GerarJsonResponse = {
  success: boolean;
  jsonNota: string;
  errors: string[];
}

export type EmitirNfseDirectResponse = {
  success: boolean;
  message: string;
  data?: unknown;
  errors: string[];
}

// Re-exportando a interface DadosLoteRpsResponse
export type { DadosLoteRpsResponse };

export type ConsultarLoteRpsResponse = {
  success: boolean;
  message: string;
  data?: unknown;
  errors?: string[];
}

export type PrestadorRequest = {
  Cnpj: string;
  InscricaoMunicipal: string;
}

export type ConsultarLoteRpsRequest = {
  ambiente: number;
  Prestador: PrestadorRequest;
  Protocolo: string;
}