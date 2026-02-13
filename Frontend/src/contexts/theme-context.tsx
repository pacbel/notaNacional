"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

type Theme = "light" | "dark";

type ThemeContextValue = {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
};

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

const THEME_STORAGE_KEY = "nfse-hub-theme";

function getSystemTheme(): Theme {
  if (typeof window === "undefined" || !window.matchMedia) {
    return "light";
  }

  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function applyThemeClass(theme: Theme) {
  if (typeof document === "undefined") {
    return;
  }

  const root = document.documentElement;
  root.classList.remove("light", "dark");
  root.classList.add(theme);
  console.log("[Theme] Classe aplicada ao documento", theme);
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("light");

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const stored = window.localStorage.getItem(THEME_STORAGE_KEY) as Theme | null;
    const preferred = stored === "light" || stored === "dark" ? stored : getSystemTheme();
    console.log("[Theme] Tema preferido identificado", preferred, { stored });
    setThemeState(preferred);
  }, []);

  useEffect(() => {
    applyThemeClass(theme);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(THEME_STORAGE_KEY, theme);
      console.log("[Theme] Tema persistido", theme);
    }
  }, [theme]);

  useEffect(() => {
    console.log("[Theme] ThemeProvider montado no cliente");
    if (typeof window === "undefined") {
      return;
    }

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = (event: MediaQueryListEvent) => {
      setThemeState((current) => {
        const stored = window.localStorage.getItem(THEME_STORAGE_KEY) as Theme | null;
        if (stored === "light" || stored === "dark") {
          console.log("[Theme] Preferência do usuário mantém tema armazenado", stored);
          return stored;
        }
        console.log("[Theme] Preferência do sistema alterada", event.matches ? "dark" : "light");
        return event.matches ? "dark" : "light";
      });
    };

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  const setTheme = useCallback((nextTheme: Theme) => {
    console.log("[Theme] setTheme chamado", nextTheme);
    setThemeState(nextTheme);
  }, []);

  const toggleTheme = useCallback(() => {
    setThemeState((current) => {
      const nextTheme = current === "light" ? "dark" : "light";
      console.log("[Theme] toggleTheme acionado", { atual: current, proximo: nextTheme });
      return nextTheme;
    });
  }, []);

  const value = useMemo<ThemeContextValue>(
    () => ({
      theme,
      setTheme,
      toggleTheme,
    }),
    [theme, setTheme, toggleTheme]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme deve ser utilizado dentro de ThemeProvider");
  }

  return context;
}
