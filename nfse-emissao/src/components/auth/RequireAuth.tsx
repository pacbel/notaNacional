'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect } from 'react';
import { Loader2 } from 'lucide-react';

interface RequireAuthProps {
  children: React.ReactNode;
  requiredRole?: 'Master' | 'Administrador' | 'Usuário';
}

export default function RequireAuth({ children, requiredRole }: RequireAuthProps) {
  const { user, loading, isAuthenticated } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Se não estiver carregando e não estiver autenticado, redireciona para o login
    if (!loading && !isAuthenticated && pathname !== '/login') {
      router.push('/login');
    }

    // Se estiver autenticado mas não tiver o papel necessário, redireciona para o dashboard
    if (!loading && isAuthenticated && requiredRole && user?.role !== requiredRole && user?.role !== 'Master') {
      router.push('/dashboard');
    }
  }, [isAuthenticated, loading, pathname, requiredRole, router, user]);

  // Mostra indicador de carregamento enquanto verifica a autenticação
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="mt-2 text-gray-600">Carregando...</p>
        </div>
      </div>
    );
  }

  // Se não estiver autenticado, não renderiza nada (o redirecionamento acontecerá no useEffect)
  if (!isAuthenticated && pathname !== '/login') {
    return null;
  }

  // Se requerer um papel específico e o usuário não tiver esse papel (nem for Master), não renderiza nada
  if (requiredRole && user?.role !== requiredRole && user?.role !== 'Master') {
    return null;
  }

  // Se estiver autenticado e tiver o papel necessário (ou não precisar de um papel específico), renderiza os filhos
  return <>{children}</>;
}
