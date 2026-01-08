'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';

interface Prestador {
  id: string;
  razaoSocial: string;
  nomeFantasia?: string;
  cnpj: string;
  logoPath?: string;
  customer_id_asaas?: string;
  integrado_asaas?: boolean;
  regimeEspecialTributacao?: number;
  emitirNfse?: boolean;
  emitirNfe?: boolean;
}

interface User {
  id: string;
  nome: string;
  email: string;
  username: string;
  role: string;
  prestadorId: string;
  prestador: Prestador;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  integradoAsaas: boolean;
  setIntegradoAsaas: (value: boolean) => void;
  isAuthenticated: boolean;
  isMaster: boolean;
  isAdmin: boolean;
  canAccessMensalidades: boolean;
  updateUserPrestador: (patch: Partial<Prestador>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const [integradoAsaas, setIntegradoAsaas] = useState(false);

  // Verificar se o usuário já está autenticado ao carregar a página
  useEffect(() => {
    const storedToken = localStorage.getItem('auth-token');
    const storedUser = localStorage.getItem('user');

    if (storedToken && storedUser) {
      try {
        // Verificar se o token é válido (não expirado)
        const tokenData = JSON.parse(atob(storedToken.split('.')[1]));
        const currentTime = Math.floor(Date.now() / 1000);

        if (tokenData.exp > currentTime) {
          const userData = JSON.parse(storedUser);
          setToken(storedToken);
          setUser(userData);

          // Verificar se o prestador está integrado ao ASAAS
          if (userData.prestadorId) {
            // Verificar se o prestador já está integrado ao ASAAS
            setIntegradoAsaas(false);
            const checkPrestadorIntegration = async () => {
              try {
                const response = await fetch(`/api/prestadores/${userData.prestadorId}`, {
                  headers: {
                    'Authorization': `Bearer ${storedToken}`
                  }
                });

                if (response.ok) {
                  const prestadorData = await response.json();

                  // Atualizar o localStorage com as informações do prestador
                  if (prestadorData.integrado_asaas === true && prestadorData.customer_id_asaas) {
                    setIntegradoAsaas(true);
                  }
                }
              } catch (error) {
                console.error('Erro ao verificar integração do prestador com ASAAS:', error);
              }
            };

            checkPrestadorIntegration();
          }
        } else {
          // Token expirado, fazer logout
          localStorage.removeItem('auth-token');
          localStorage.removeItem('user');
          router.push('/login');
        }
      } catch (error) {
        console.error('Erro ao verificar autenticação:', error);
        localStorage.removeItem('auth-token');
        localStorage.removeItem('user');
      }
    }

    setLoading(false);
  }, [router]);

  const login = async (username: string, password: string) => {
    try {
      setLoading(true);
      
      // Primeiro, autenticar com o sistema atual
      const response = await fetch('/api/auth', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        return { success: false, error: data.error || 'Erro ao fazer login' };
      }

      // Salvar dados no localStorage
      localStorage.setItem('auth-token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      setIntegradoAsaas(false);
      if (data.user?.prestador) {
        const prestador = data.user.prestador;
        const prestadorId = prestador.id || data.user.prestadorId;
        if (prestadorId) {
          if (prestador.integrado_asaas === true && prestador.customer_id_asaas) {
            setIntegradoAsaas(true);
          }
        }
      }

      // Atualizar estado
      setToken(data.token);
      setUser(data.user);
      
      // Agora, autenticar com NextAuth
      const nextAuthResult = await signIn('credentials', {
        username,
        password,
        redirect: false
      });
      
      if (nextAuthResult?.error) {
        console.warn('NextAuth login falhou, mas o login principal foi bem-sucedido:', nextAuthResult.error);
        // Continuar mesmo se o NextAuth falhar, pois o login principal já foi bem-sucedido
      }

      return { success: true };
    } catch (error) {
      console.error('Erro ao fazer login:', error);
      return { success: false, error: 'Erro ao fazer login' };
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      // Limpar dados do localStorage primeiro
      localStorage.removeItem('auth-token');
      localStorage.removeItem('user');

      // Limpar estado
      setToken(null);
      setUser(null);

      // Redirecionar para a página de login imediatamente
      window.location.href = '/login';

      // Chamar API de logout para limpar o cookie e registrar o log
      // Isso acontece em segundo plano, não bloqueando o redirecionamento
      fetch('/api/auth/logout', {
        method: 'DELETE',
      }).catch(error => {
        console.error('Erro ao fazer logout na API:', error);
      });
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
      // Em caso de erro, ainda tenta redirecionar
      window.location.href = '/login';
    }
  };

  const isAuthenticated = !!user && !!token;
  const isMaster = isAuthenticated && user?.role === 'Master';
  const isAdmin = isAuthenticated && (user?.role === 'Administrador' || user?.role === 'Master');

  // Verificar se o usuário pode acessar mensalidades
  // Um usuário pode acessar mensalidades se for Master ou se for Administrador e o prestador estiver integrado ao ASAAS
  const canAccessMensalidades: boolean = isAuthenticated && (
    isMaster ||
    (isAdmin && integradoAsaas)
  );

  // Efeito para verificar e atualizar o localStorage quando o estado integradoAsaas mudar
  useEffect(() => {
    if (typeof window !== 'undefined' && user?.prestadorId) { // Verificar se está no navegador e se tem prestadorId
      // Converter explicitamente para string para evitar erro de tipo
      const isIntegrado = integradoAsaas === true ? 'true' : 'false';
      localStorage.setItem(`prestador_${user.prestadorId}_integrado_asaas`, isIntegrado);
      
      // Atualizar também o objeto user no localStorage se ele existir
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        try {
          const userObj = JSON.parse(storedUser);
          if (userObj.prestador) {
            userObj.prestador.integrado_asaas = integradoAsaas;
            localStorage.setItem('user', JSON.stringify(userObj));
          }
        } catch (error) {
          console.error('Erro ao atualizar user no localStorage:', error);
        }
      }
    }
  }, [integradoAsaas, user?.prestadorId]);

  // Sincronizar dados do prestador (ex.: logoPath) no objeto user e no localStorage
  const updateUserPrestador = (patch: Partial<Prestador>) => {
    setUser((prev) => {
      if (!prev) return prev;
      const updated = { ...prev, prestador: { ...prev.prestador, ...patch } } as User;
      try {
        localStorage.setItem('user', JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        logout,
        integradoAsaas,
        setIntegradoAsaas,
        isAuthenticated,
        isMaster,
        isAdmin,
        canAccessMensalidades,
        updateUserPrestador,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
}
