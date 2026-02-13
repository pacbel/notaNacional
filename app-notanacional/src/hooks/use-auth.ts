import { useState, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";

interface CurrentUser {
  id: string;
  nome: string;
  email: string;
  prestadorId: string;
  role: string;
}

export function useAuth() {
  const [isLoading, setIsLoading] = useState(false);

  const login = useCallback(async () => {
    setIsLoading(true);

    try {
      // TODO: implement login
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    login,
    isLoading,
  };
}

export function useCurrentUser() {
  return useQuery<CurrentUser>({
    queryKey: ["auth", "me"],
    queryFn: async () => {
      const response = await fetch("/api/auth/me", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error("Não autenticado");
        }
        throw new Error("Erro ao obter dados do usuário");
      }

      return response.json();
    },
    staleTime: 5 * 60 * 1000, // 5 minutos
    retry: false,
  });
}
