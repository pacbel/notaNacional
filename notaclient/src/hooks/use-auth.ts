import { useState, useCallback } from "react";

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
