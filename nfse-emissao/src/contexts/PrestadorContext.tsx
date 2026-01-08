'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { useAuth } from './AuthContext';

interface Prestador {
  id: string;
  razaoSocial: string;
  nomeFantasia?: string;
  cnpj: string;
  logoPath?: string;
  inscricaoMunicipal: string;
  email: string;
  telefone: string;
  endereco: string;
  numero: string;
  complemento?: string;
  bairro: string;
  codigoMunicipio: string;
  uf: string;
  cep: string;
  ambiente: number;
  customer_id_asaas?: string;
  integrado_asaas?: boolean;
  regimeEspecialTributacao?: number;
  emitirNfse?: boolean;
  emitirNfe?: boolean;
}

interface PrestadorContextType {
  prestador: Prestador | null;
  loading: boolean;
  integradoAsaas: boolean;
  error: string | null;
}

const PrestadorContext = createContext<PrestadorContextType | undefined>(undefined);

export function PrestadorProvider({ children }: { children: ReactNode }) {
  const [prestador, setPrestador] = useState<Prestador | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user, isAuthenticated, isMaster, setIntegradoAsaas: updateAuthIntegradoAsaas, updateUserPrestador } = useAuth();
  const [integradoAsaas, setIntegradoAsaas] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const fetchPrestador = async () => {
      // Se não estiver autenticado ou não houver prestadorId, não carrega o prestador
      // Master COM prestadorId também deve carregar para refletir flags no Sidebar
      if (!isAuthenticated || !user?.prestadorId) {
        setLoading(false);
        return;
      }

      try {
       
        // Verificar se o ID do prestador é válido
        if (!user.prestadorId || user.prestadorId === 'undefined') {

          setError('ID do prestador inválido');
          setLoading(false);
          return;
        }

        const token = localStorage.getItem('auth-token');
        
        const response = await fetch(`/api/prestadores/${user.prestadorId}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        

        
        if (response.status === 401) {
          // Erro de autenticação - não exibir erro
          setLoading(false);
          return;
        }
        
        if (!response.ok) {

          throw new Error(`Erro ao carregar dados do prestador: ${response.status}`);
        }
        
        const data = await response.json();
        setPrestador(data);
        // Sincronizar logoPath e flags no AuthContext para refletir na Sidebar imediatamente
        try {
          updateUserPrestador({
            logoPath: data.logoPath,
            emitirNfse: data.emitirNfse,
            emitirNfe: data.emitirNfe,
          } as any);
        } catch {}

        // Verificar se o prestador está integrado com o ASAAS
        const isIntegrado = data.id && data.integrado_asaas === true && data.customer_id_asaas ? true : false;
        
        // Atualizar o estado local
        setIntegradoAsaas(isIntegrado);
        
        // Sincronizar com o contexto de autenticação
        updateAuthIntegradoAsaas(isIntegrado);
        
        setLoading(false);
      } catch (err: unknown) {
        if (err instanceof SyntaxError) {
          // Erro de parsing JSON - provavelmente redirecionamento HTML
          setLoading(false);
          return;
        }

        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError('Erro ao carregar dados do prestador');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchPrestador();
    // Recarrega ao mudar de rota ou quando o prestadorId mudar. Evita depender do objeto user inteiro
  }, [isAuthenticated, user?.prestadorId, pathname, updateAuthIntegradoAsaas]);

  return (
    <PrestadorContext.Provider
      value={{
        prestador,
        loading,
        integradoAsaas,
        error,
      }}
    >
      {children}
    </PrestadorContext.Provider>
  );
}

export function usePrestador() {
  const context = useContext(PrestadorContext);
  if (context === undefined) {
    throw new Error('usePrestador deve ser usado dentro de um PrestadorProvider');
  }
  return context;
}
