import { GerarJsonResponse } from './types';

export async function gerarJsonNota(notaId: string, token: string): Promise<GerarJsonResponse> {

  try {
    if (!notaId || !token) {
      return {
        success: false,
        jsonNota: '',
        errors: ['ID da nota fiscal ou token de autenticação não informado']
      };
    }

    const responseJson = await fetch('/api/nfse/gerar-json', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ id: notaId })
    });

    if (!responseJson.ok) {
      const errorData = await responseJson.json();
      return {
        success: false,
        jsonNota: '',
        errors: [errorData.error || 'Erro ao gerar JSON da nota fiscal']
      };
    } else {
      const jsonResult = await responseJson.json();
      return {
        success: true,
        jsonNota: jsonResult.data,
        errors: []
      };
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido ao gerar JSON';
    return {
      success: false,
      jsonNota: '',
      errors: [errorMessage]
    };
  }
}
