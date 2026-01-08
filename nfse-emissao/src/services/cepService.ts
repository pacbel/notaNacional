/**
 * Serviço para consulta de CEP utilizando a API ViaCEP
 */

export interface CepResponse {
  cep: string;
  logradouro: string;
  complemento: string;
  unidade: string;
  bairro: string;
  localidade: string;
  uf: string;
  estado: string;
  regiao: string;
  ibge: string;
  gia: string;
  ddd: string;
  siafi: string;
}

/**
 * Consulta um CEP na API ViaCEP
 * @param cep CEP a ser consultado (apenas números)
 * @returns Dados do endereço ou null em caso de erro
 */
export async function consultarCep(cep: string): Promise<CepResponse | null> {
  // Remove caracteres não numéricos do CEP
  const cepLimpo = cep.replace(/\D/g, '');
  
  // Verifica se o CEP tem 8 dígitos
  if (cepLimpo.length !== 8) {
    return null;
  }
  
  try {
    const response = await fetch(`https://viacep.com.br/ws/${cepLimpo}/json/`);
    
    if (!response.ok) {
      throw new Error('Erro ao consultar CEP');
    }
    
    const data = await response.json();
    
    // Verifica se o CEP foi encontrado
    if (data.erro) {
      return null;
    }
    
    return data as CepResponse;
  } catch (error) {
    console.error('Erro ao consultar CEP:', error);
    return null;
  }
}
