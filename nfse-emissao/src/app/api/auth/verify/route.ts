import { NextRequest, NextResponse } from 'next/server';
import { verifyJwt } from '@/services/authService';

export async function GET(request: NextRequest) {
  try {
    // Obter o token do cookie
    const token = request.cookies.get('auth-token')?.value;
    
    if (!token) {
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }
    
    // Verificar se o token u00e9 vu00e1lido
    const payload = await verifyJwt(token);
    
    return NextResponse.json({
      authenticated: true,
      user: {
        id: payload.id,
        nome: payload.nome,
        email: payload.email,
        username: payload.username,
        role: payload.role,
        prestadorId: payload.prestadorId
      }
    });
  } catch (error) {
    console.error('Erro ao verificar autenticau00e7u00e3o:', error);
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }
}
