"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

export type ThemeMode = "light" | "dark" | "system";
export type ResolvedTheme = "light" | "dark";

interface ThemeContextValue {
  /** User preference: light, dark, or follow OS. */
  mode: ThemeMode;
  /** Actually applied theme — what the UI is rendered as right now. */
  theme: ResolvedTheme;
  setMode(m: ThemeMode): void;
  /** Cycle: light → dark → system → light. */
  toggle(): void;
}

const STORAGE_KEY = "cryptalk-theme";
const DARK_MQ = "(prefers-color-scheme: dark)";

const ThemeContext = createContext<ThemeContextValue>({
  mode: "light",
  theme: "light",
  setMode: () => {},
  toggle: () => {},
});

function readStoredMode(): ThemeMode {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === "light" || stored === "dark" || stored === "system") return stored;
  } catch {
    /* localStorage may be blocked (sandboxed iframe, private mode, etc) */
  }
  return "light";
}

function getSystemTheme(): ResolvedTheme {
  if (typeof window === "undefined") return "light";
  return window.matchMedia(DARK_MQ).matches ? "dark" : "light";
}

function resolve(mode: ThemeMode): ResolvedTheme {
  return mode === "system" ? getSystemTheme() : mode;
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  // SSR default is light. A blocking <script> in <head> sets data-theme
  // before paint based on stored mode + matchMedia, so the first paint
  // matches what this state becomes after hydration.
  const [mode, setModeState] = useState<ThemeMode>("light");
  const [theme, setThemeState] = useState<ResolvedTheme>("light");

  // Hydrate from localStorage once on mount.
  useEffect(() => {
    const m = readStoredMode();
    setModeState(m);
    setThemeState(resolve(m));
  }, []);

  // When following the system, react to OS theme changes.
  useEffect(() => {
    if (mode !== "system") return;
    const mq = window.matchMedia(DARK_MQ);
    const handler = () => setThemeState(getSystemTheme());
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, [mode]);

  // Sync the data-theme attribute on every resolved-theme change.
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  const setMode = useCallback((m: ThemeMode) => {
    setModeState(m);
    setThemeState(resolve(m));
    try {
      localStorage.setItem(STORAGE_KEY, m);
    } catch {
      /* ignore */
    }
  }, []);

  const toggle = useCallback(() => {
    const next: ThemeMode =
      mode === "light" ? "dark" : mode === "dark" ? "system" : "light";
    setMode(next);
  }, [mode, setMode]);

  return (
    <ThemeContext.Provider value={{ mode, theme, setMode, toggle }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  return useContext(ThemeContext);
}

/**
 * Inline blocking script — read by app/layout.tsx and injected into <head>.
 * Runs before React hydrates so the first paint is already the right theme.
 * Default (no stored preference) is light.
 */
export const THEME_INIT_SCRIPT = `(function(){try{var k='${STORAGE_KEY}',m=localStorage.getItem(k),t;if(m==='dark'||m==='light'){t=m;}else if(m==='system'){t=matchMedia('${DARK_MQ}').matches?'dark':'light';}else{t='light';}document.documentElement.setAttribute('data-theme',t);}catch(e){}})();`;
