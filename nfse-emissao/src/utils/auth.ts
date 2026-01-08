/**
 * Função para autenticar e obter token de acesso para serviços de NFSe
 */
export async function obterTokenAutenticacao(notaId: string): Promise<string> {
  try {
    
    // Usar caminhos relativos para evitar problemas com URLs absolutas
    const authResponse = await fetch(`/api/nfse/${notaId}/service/authorization`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'authKey': `${process.env.NEXT_PUBLIC_AUTH_KEY}`
      }
    });
    
    if (!authResponse.ok) {
      throw new Error(`Erro na autenticação: ${authResponse.status} ${authResponse.statusText}`);
    }
    
    const authData = await authResponse.json();
    
    // Verificar se a resposta foi bem-sucedida e se contém um token
    if (authData.success && authData.token) {
    } else if (!authData.token) {
      throw new Error('Token de autenticação não encontrado na resposta');
    }
    
    
    // Salva o token no localStorage apenas se estiver no navegador
    if (typeof window !== 'undefined') {
      localStorage.setItem('tokenNfse', authData.token);
    }

    return authData.token;
  } catch (error: unknown) {
    console.error('[Auth] Erro ao obter token:', error);
    
    // Verificar se o erro contém dados de resposta com token válido
    if (error && typeof error === 'object' && 'response' in (error as Record<string, unknown>)) {
      const response = (error as Record<string, unknown>).response as { data?: { token?: string } } | undefined;
      
      if (response?.data?.token) {
        return response.data.token;
      }
    }
    
    throw new Error('Falha ao obter token de autenticação');
  }
}
