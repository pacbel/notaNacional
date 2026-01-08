/**
 * Utilitário para manipulação de dados de municípios e estados
 */

interface MunicipiosCache {
  [codigo: string]: string;
}

let municipiosCache: MunicipiosCache = {};

/**
 * Carrega os dados de municípios do arquivo JSON
 */
export const carregarMunicipios = async (): Promise<MunicipiosCache> => {
  if (Object.keys(municipiosCache).length > 0) {
    return municipiosCache;
  }

  try {
    // Verificar se estamos no lado do cliente antes de fazer a chamada fetch
    if (typeof window === 'undefined') {
      return {};
    }
    
    const resposta = await fetch('/ibge/municipios.json');
    if (!resposta.ok) {
      console.warn(`Erro ao carregar municípios: ${resposta.status}`);
      return {};
    }
    
    const dados = await resposta.json();
    municipiosCache = dados || {};
    return municipiosCache;
  } catch (erro) {
    console.error('Erro ao carregar dados de municípios:', erro);
    return {};
  }
};

/**
 * Obtém o nome do município a partir do código IBGE
 * @param codigoMunicipio Código do município no formato IBGE
 */
export const obterNomeMunicipio = async (codigoMunicipio?: string): Promise<string> => {
  if (!codigoMunicipio) return '';
  
  // Garantir que o código tenha 7 dígitos
  const codigoFormatado = codigoMunicipio.padStart(7, '0');
  
  // Carregar municípios se ainda não estiverem em cache
  if (Object.keys(municipiosCache).length === 0) {
    await carregarMunicipios();
  }
  
  return municipiosCache[codigoFormatado] || codigoMunicipio;
};
