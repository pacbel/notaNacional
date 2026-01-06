"use client";

import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { registerLoadingHandlers } from "@/services/http";
import { GlobalLoadingOverlay } from "@/components/ui/global-loading";

interface LoadingContextValue {
  pendingRequests: number;
  isLoading: boolean;
}

const LoadingContext = createContext<LoadingContextValue | undefined>(undefined);

export function LoadingProvider({ children }: { children: ReactNode }) {
  const [pendingRequests, setPendingRequests] = useState(0);

  const handleStart = useCallback(() => {
    setPendingRequests((current) => current + 1);
  }, []);

  const handleEnd = useCallback(() => {
    setPendingRequests((current) => (current > 0 ? current - 1 : 0));
  }, []);

  useEffect(() => {
    registerLoadingHandlers({ onStart: handleStart, onEnd: handleEnd });
    return () => {
      registerLoadingHandlers(null);
    };
  }, [handleEnd, handleStart]);

  const contextValue = useMemo<LoadingContextValue>(
    () => ({
      pendingRequests,
      isLoading: pendingRequests > 0,
    }),
    [pendingRequests]
  );

  return (
    <LoadingContext.Provider value={contextValue}>
      {children}
      <GlobalLoadingOverlay visible={contextValue.isLoading} />
    </LoadingContext.Provider>
  );
}

export function useLoading() {
  const context = useContext(LoadingContext);
  if (!context) {
    throw new Error("useLoading deve ser utilizado dentro de LoadingProvider");
  }

  return context;
}
