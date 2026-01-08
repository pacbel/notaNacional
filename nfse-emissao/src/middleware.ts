import { NextRequest, NextResponse } from 'next/server';
import { getTokenData } from './services/authService';
import { getToken } from 'next-auth/jwt';

export async function middleware(request: NextRequest) {
  // Rotas públicas que não precisam de autenticação
  const publicRoutes = [
    '/login',
    '/_next',
    '/api/auth',
    '/img',
    '/favicon',
    // '/dashboard', // Temporariamente permitir acesso ao dashboard para debug
    // '/api/nfse/reconciliar-status', // Temporário: endpoint público para conciliação
  ];

  // Verifica se a rota atual é pública
  const isPublicRoute = publicRoutes.some(route => request.nextUrl.pathname.startsWith(route));
  if (isPublicRoute) {
    return NextResponse.next();
  }

  // Verifica se o usuário está autenticado
  const token = request.cookies.get('auth-token')?.value;
  if (!token) {
    // Se for uma requisição para API, retorna erro 401
    if (request.nextUrl.pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }
    // Redireciona para a página de login se não estiver autenticado
    return NextResponse.redirect(new URL('/login', request.url));
  }

  try {
    // Verifica se o token é válido
    const userData = await getTokenData(request);
    
    // Verifica também o token do NextAuth
    const nextAuthToken = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
    
    if (!userData || !nextAuthToken) {
      // Se for uma requisição para API, retorna erro 401
      if (request.nextUrl.pathname.startsWith('/api/')) {
        const response = NextResponse.json({ error: 'Token inválido' }, { status: 401 });
        response.cookies.delete('auth-token');
        response.cookies.delete('next-auth.session-token');
        return response;
      }
      // Token inválido ou expirado
      const response = NextResponse.redirect(new URL('/login', request.url));
      response.cookies.delete('auth-token');
      response.cookies.delete('next-auth.session-token');
      return response;
    }

    // Proteção para rotas de prestadores (apenas Master e Administrador podem acessar)
    if (request.nextUrl.pathname.startsWith('/prestadores') && userData.role !== 'Master' && userData.role !== 'Administrador') {
      // Usuários que não são Master nem Administrador não podem acessar a lista de prestadores
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }

    // Continua com a requisição se o usuário estiver autenticado
    return NextResponse.next();
  } catch (error) {
    console.error('Erro no middleware:', error);
    // Em caso de erro, redireciona para o login
    const response = NextResponse.redirect(new URL('/login', request.url));
    response.cookies.delete('auth-token');
    return response;
  }
}

// Configuração para aplicar o middleware em todas as rotas
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api/auth (API routes that handle authentication)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.png (favicon file)
     */
    '/((?!api/auth|_next/static|_next/image|favicon.png).*)',
  ],
};
