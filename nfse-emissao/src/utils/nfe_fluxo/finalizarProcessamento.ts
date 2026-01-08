/**
 * Finaliza o processamento da nota fiscal
 * @param notaId ID da nota fiscal
 * @param token Token de autenticação
 * @param numeroNfse Número da nota fiscal
 * @returns Resultado da operação
 */
export async function finalizarProcessamento(notaId: string, token: string, numeroNfse?: string) {
  
  // Atualizar o número do RPS via API
  const atualizarRpsResponse = await fetch(`/api/nfse/atualizar-rps`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      notaFiscalId: notaId
    })
  });

  if (!atualizarRpsResponse.ok) {
    const errorData = await atualizarRpsResponse.json();
    throw new Error(`Erro ao atualizar RPS: ${errorData.error || 'Erro desconhecido'}`);
  }

  const autorizaNfseResponse = await fetch(`/api/nfse/autoriza-nfse`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      notaFiscalId: notaId
    })
  });
  
  if (autorizaNfseResponse.ok) {
    
    // Não incrementamos mais o número do RPS automaticamente
    // Apenas registramos que a nota foi autorizada com sucesso
  } else {
    console.warn('[Transmissão:Etapa 6] Falha ao autorizar nota fiscal:', await autorizaNfseResponse.text());
  }

  
  return {
    success: true,
    message: 'Nota emitida com sucesso!',
    numeroNfse
  };
}
