import { NextRequest, NextResponse } from 'next/server';
import { getTokenData } from '@/services/authService';

// Importau00e7u00e3o dinu00e2mica para evitar erros durante o build
const registrarLogout = async (userData: any) => {
  try {
    // Importau00e7u00e3o dinu00e2mica do serviu00e7o de log
    const { logService } = await import('@/services/logService');
    
    await logService.registrarLog({
      usuarioId: userData.id,
      prestadorId: userData.prestadorId,
      acao: 'Logout',
      entidade: 'Usuário',
      entidadeId: userData.id,
      descricao: `Usuário ${userData.nome} (${userData.username}) realizou logout do sistema`,
      tela: 'Logout',
    });
  } catch (error) {
    console.error('Erro ao registrar log de logout:', error);
    // Falha no log não deve impedir o logout
  }
};

export async function DELETE(request: NextRequest) {
  try {
    // Obter dados do usuário antes de fazer logout
    const userData = await getTokenData(request);
    
    // Criar resposta que remove o cookie
    const response = NextResponse.json({ message: 'Logout realizado com sucesso' });
    response.cookies.delete('auth-token');
    
    // Registrar log de logout se o usuário estava autenticado
    if (userData) {
      // Usa a função de registro de logout que importa dinamicamente o serviço
      await registrarLogout(userData);
    }
    
    return response;
  } catch (error) {
    console.error('Erro ao fazer logout:', error);
    
    // Mesmo em caso de erro, remover o cookie
    const response = NextResponse.json(
      { message: 'Erro ao processar logout', error: (error as Error).message },
      { status: 500 }
    );
    response.cookies.delete('auth-token');
    
    return response;
  }
}
