"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  DEFAULT_THEME_NAME,
  getThemeCssVars,
  isThemeName,
  PA_THEME_STORAGE_KEY,
  THEMES,
  type ThemeName,
  type ThemeTokens,
} from "@/lib/themes";

interface ThemeContextValue {
  theme: ThemeTokens;
  themeName: ThemeName;
  setTheme: (name: ThemeName) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

function readStoredTheme(): ThemeName {
  if (typeof globalThis.window === "undefined") return DEFAULT_THEME_NAME;
  try {
    const raw = globalThis.localStorage.getItem(PA_THEME_STORAGE_KEY);
    if (raw && isThemeName(raw)) return raw;
  } catch {
    /* ignore */
  }
  return DEFAULT_THEME_NAME;
}

function applyCssVars(name: ThemeName) {
  const root = globalThis.document?.documentElement;
  if (!root) return;
  root.classList.add("pa-theme-animate");
  if (name === "light") {
    root.classList.add("theme-light");
  } else {
    root.classList.remove("theme-light");
  }
  const vars = getThemeCssVars(name);
  for (const [k, v] of Object.entries(vars)) {
    root.style.setProperty(k, v);
  }
}

export function ThemeProvider({ children }: Readonly<{ children: ReactNode }>) {
  const [themeName, setThemeNameState] = useState<ThemeName>(DEFAULT_THEME_NAME);

  useEffect(() => {
    setThemeNameState(readStoredTheme());
  }, []);

  useEffect(() => {
    applyCssVars(themeName);
  }, [themeName]);

  const setTheme = useCallback((name: ThemeName) => {
    setThemeNameState(name);
    try {
      globalThis.localStorage.setItem(PA_THEME_STORAGE_KEY, name);
    } catch {
      /* ignore */
    }
  }, []);

  const value = useMemo<ThemeContextValue>(
    () => ({
      theme: THEMES[themeName],
      themeName,
      setTheme,
    }),
    [themeName, setTheme],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}
