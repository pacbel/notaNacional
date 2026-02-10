"use client";

import {
  ReactNode,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  AuthTokens,
  AuthenticatedUser,
  ConfirmMfaRequest,
  ForgotPasswordRequest,
  LoginRequest,
  MfaChallengeResponse,
  ResetPasswordRequest,
  RoleName,
} from "@/types/auth";
import { appConfig } from "@/lib/config";
import { ApiError, apiFetch, registerAuthHandlers } from "@/services/http";
import { extractUserFromToken, parseExpiration } from "@/utils/auth";
import { toast } from "sonner";

interface AuthContextValue {
  user: AuthenticatedUser | null;
  tokens: AuthTokens | null;
  roles: RoleName[];
  isAuthenticated: boolean;
  isLoading: boolean;
  mfaChallenge: MfaChallengeResponse | null;
  login: (payload: LoginRequest) => Promise<void>;
  confirmMfa: (payload: ConfirmMfaRequest) => Promise<void>;
  logout: (silent?: boolean) => void;
  refreshTokens: () => Promise<boolean>;
  forgotPassword: (payload: ForgotPasswordRequest) => Promise<void>;
  resetPassword: (payload: ResetPasswordRequest) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const ROUTES_WITHOUT_GUARD = ["/login", "/forgot-password", "/reset-password"];

const hasAdministratorRole = (roles: RoleName[] | undefined) =>
  Array.isArray(roles) && roles.includes("Administrador");

export function AuthProvider({ children }: { children: ReactNode }) {
  const [tokens, setTokens] = useState<AuthTokens | null>(null);
  const [user, setUser] = useState<AuthenticatedUser | null>(null);
  const [mfaChallenge, setMfaChallenge] = useState<MfaChallengeResponse | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(true);
  const refreshTimeout = useRef<NodeJS.Timeout | null>(null);

  const router = useRouter();
  const pathname = usePathname();

  const roles = useMemo(() => user?.roles ?? [], [user]);

  const clearRefreshTimeout = useCallback(() => {
    if (refreshTimeout.current) {
      clearTimeout(refreshTimeout.current);
      refreshTimeout.current = null;
    }
  }, []);

  const scheduleRefresh = useCallback(
    (currentTokens: AuthTokens | null) => {
      clearRefreshTimeout();

      if (!currentTokens) {
        return;
      }

      const expiration = parseExpiration(currentTokens);
      if (!expiration) {
        return;
      }

      const now = Date.now();
      const refreshAt = expiration - 60_000; // 1 minuto antes
      const delay = Math.max(refreshAt - now, 5_000);

      refreshTimeout.current = setTimeout(() => {
        refreshTokens();
      }, delay);
    },
    [clearRefreshTimeout]
  );

  const persistTokens = useCallback((value: AuthTokens | null) => {
    if (!value) {
      localStorage.removeItem(appConfig.tokenStorageKey);
      return;
    }

    localStorage.setItem(appConfig.tokenStorageKey, JSON.stringify(value));
  }, []);

  const applyTokens = useCallback(
    (newTokens: AuthTokens | null): boolean => {
      if (!newTokens) {
        setTokens(null);
        persistTokens(null);
        scheduleRefresh(null);
        setUser(null);
        return true;
      }

      const nextUser = extractUserFromToken(newTokens.accessToken);
      if (!nextUser) {
        setTokens(null);
        persistTokens(null);
        scheduleRefresh(null);
        setUser(null);
        toast.error("Não foi possível identificar o usuário autenticado.");
        return false;
      }

      if (!hasAdministratorRole(nextUser.roles)) {
        setTokens(null);
        persistTokens(null);
        scheduleRefresh(null);
        setUser(null);
        toast.error("Acesso negado.");
        return false;
      }

      setTokens(newTokens);
      persistTokens(newTokens);
      scheduleRefresh(newTokens);
      setUser(nextUser);
      return true;
    },
    [persistTokens, scheduleRefresh]
  );

  const loadSession = useCallback(() => {
    try {
      const stored = localStorage.getItem(appConfig.tokenStorageKey);
      if (!stored) {
        setIsLoading(false);
        return;
      }

      const parsed = JSON.parse(stored) as AuthTokens;
      applyTokens(parsed);
    } catch (error) {
      console.error("Falha ao recuperar sessão salva", error);
      localStorage.removeItem(appConfig.tokenStorageKey);
    } finally {
      setIsLoading(false);
    }
  }, [applyTokens]);

  useEffect(() => {
    registerAuthHandlers({
      getAccessToken: () => tokens?.accessToken ?? null,
      getRefreshToken: () => tokens?.refreshToken ?? null,
      refreshTokens,
      logout: () => logout(true),
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tokens]);

  useEffect(() => {
    loadSession();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!isLoading && !tokens && !ROUTES_WITHOUT_GUARD.includes(pathname)) {
      router.push("/login");
    }
  }, [isLoading, tokens, pathname, router]);

  const login = useCallback(
    async (payload: LoginRequest) => {
      setIsLoading(true);
      try {
        console.info("[Auth] Iniciando login", {
          email: payload.email,
          timestamp: new Date().toISOString(),
        });
        const response = await apiFetch<MfaChallengeResponse>(
          "/api/auth/login",
          {
            method: "POST",
            body: JSON.stringify(payload),
            retryOnUnauthorized: false,
          }
        );

        console.info("[Auth] Login solicitado com sucesso. Desafio MFA enviado", {
          email: payload.email,
          codigoEnviado: response?.codigoEnviado,
          expiraEm: response?.expiraEm,
        });
        setMfaChallenge(response);
        toast.success("Código de verificação enviado. Verifique seu e-mail.");
      } catch (error) {
        const status = error instanceof ApiError ? error.status : undefined;
        console.error("[Auth] Falha ao realizar login", {
          email: payload.email,
          status,
          timestamp: new Date().toISOString(),
          error,
        });
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const confirmMfa = useCallback(
    async (payload: ConfirmMfaRequest) => {
      setIsLoading(true);
      try {
        const response = await apiFetch<AuthTokens>(
          "/api/auth/confirm-mfa",
          {
            method: "POST",
            body: JSON.stringify(payload),
            retryOnUnauthorized: false,
          }
        );

        setMfaChallenge(null);
        const authorized = applyTokens(response);
        if (!authorized) {
          router.push("/login");
          return;
        }
        toast.success("Autenticação concluída com sucesso.");
        router.push("/dashboard");
      } finally {
        setIsLoading(false);
      }
    },
    [applyTokens, router]
  );

  const logout = useCallback(
    (silent = false) => {
      applyTokens(null);
      clearRefreshTimeout();
      setMfaChallenge(null);
      if (!silent) {
        toast.success("Sessão encerrada.");
      }
      router.push("/login");
    },
    [applyTokens, clearRefreshTimeout, router]
  );

  const refreshTokens = useCallback(async () => {
    if (!tokens?.refreshToken) {
      return false;
    }

    try {
      const response = await apiFetch<AuthTokens>("/api/auth/refresh", {
        method: "POST",
        body: JSON.stringify({ refreshToken: tokens.refreshToken }),
        retryOnUnauthorized: false,
      });

      return applyTokens(response);
    } catch (error) {
      toast.error(
        error instanceof ApiError && error.status === 401
          ? "Sessão expirada. Faça login novamente."
          : "Não foi possível renovar a sessão. Faça login novamente."
      );
      logout(true);
      return false;
    }
  }, [applyTokens, logout, tokens?.refreshToken]);

  const forgotPassword = useCallback(async (payload: ForgotPasswordRequest) => {
    await apiFetch("/api/auth/forgot-password", {
      method: "POST",
      body: JSON.stringify(payload),
      retryOnUnauthorized: false,
    });
    toast.success("Se o e-mail existir, as instruções foram enviadas.");
  }, []);

  const resetPassword = useCallback(async (payload: ResetPasswordRequest) => {
    await apiFetch("/api/auth/reset-password", {
      method: "POST",
      body: JSON.stringify(payload),
      retryOnUnauthorized: false,
    });
    toast.success("Senha redefinida com sucesso. Faça login novamente.");
    router.push("/login");
  }, [router]);

  const contextValue = useMemo<AuthContextValue>(
    () => ({
      user,
      tokens,
      roles,
      isAuthenticated: Boolean(user),
      isLoading,
      mfaChallenge,
      login,
      confirmMfa,
      logout,
      refreshTokens,
      forgotPassword,
      resetPassword,
    }),
    [
      confirmMfa,
      forgotPassword,
      isLoading,
      login,
      logout,
      mfaChallenge,
      refreshTokens,
      resetPassword,
      roles,
      tokens,
      user,
    ]
  );

  return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth deve ser utilizado dentro de AuthProvider");
  }
  return context;
}
