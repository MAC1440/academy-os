"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";

export type ThemeMode = "light" | "dark" | "system";
type ResolvedTheme = "light" | "dark";

type ThemeContextValue = {
  theme: ThemeMode;
  resolvedTheme: ResolvedTheme;
  setTheme: (theme: ThemeMode) => void;
  /** True while a <ForceTheme> ancestor is overriding the resolved theme. */
  isForced: boolean;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);
const storageKey = "academyos-theme";

function getSystemTheme(): ResolvedTheme {
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

function resolveTheme(theme: ThemeMode): ResolvedTheme {
  return theme === "system" ? getSystemTheme() : theme;
}

// Only the root ThemeProvider ever writes to document.documentElement.
// A nested <ForceTheme> registers an override here instead of mutating
// the DOM itself — that's what avoids the effect-ordering race.
type OverrideRegistry = {
  push: (id: symbol, theme: ResolvedTheme) => void;
  pop: (id: symbol) => void;
};
const OverrideContext = createContext<OverrideRegistry | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<ThemeMode>("system");
  const [override, setOverride] = useState<ResolvedTheme | null>(null);
  const overrides = useRef(new Map<symbol, ResolvedTheme>());

  useEffect(() => {
    const stored = localStorage.getItem(storageKey) as ThemeMode | null;
    if (stored === "light" || stored === "dark" || stored === "system") {
      setThemeState(stored);
    }
  }, []);

  const resolvedTheme = override ?? resolveTheme(theme);

  // Single source of truth for the DOM write.
  useEffect(() => {
    document.documentElement.dataset.theme = resolvedTheme;
  }, [resolvedTheme]);

  useEffect(() => {
    if (theme !== "system") return;
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = () => setThemeState("system"); // triggers re-resolve
    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, [theme]);

  const setTheme = useCallback((next: ThemeMode) => {
    localStorage.setItem(storageKey, next);
    setThemeState(next);
  }, []);

  const push = useCallback((id: symbol, forced: ResolvedTheme) => {
    overrides.current.set(id, forced);
    setOverride(forced); // innermost registration wins
  }, []);

  const pop = useCallback((id: symbol) => {
    overrides.current.delete(id);
    const remaining = Array.from(overrides.current.values());
    setOverride(remaining[remaining.length - 1] ?? null);
  }, []);

  const registry = useMemo(() => ({ push, pop }), [push, pop]);

  const value = useMemo<ThemeContextValue>(
    () => ({ theme, resolvedTheme, setTheme, isForced: override !== null }),
    [theme, resolvedTheme, setTheme, override],
  );

  return (
    <ThemeContext.Provider value={value}>
      <OverrideContext.Provider value={registry}>
        {children}
      </OverrideContext.Provider>
    </ThemeContext.Provider>
  );
}

/**
 * Forces everything inside to render in a specific theme — e.g. wrap the
 * landing page in <ForceTheme theme="light"> so it always renders light
 * regardless of what the signed-in user has saved. Does not touch
 * localStorage or the user's actual preference; unmounting restores
 * whatever theme was active before.
 */
export function ForceTheme({
  theme,
  children,
}: {
  theme: ResolvedTheme;
  children: React.ReactNode;
}) {
  const registry = useContext(OverrideContext);
  if (!registry) {
    throw new Error("ForceTheme must be used within ThemeProvider");
  }
  const id = useRef(Symbol("force-theme")).current;

  useLayoutEffect(() => {
    registry.push(id, theme);
    return () => registry.pop(id);
  }, [registry, id, theme]);

  return <>{children}</>;
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error("useTheme must be used within ThemeProvider");
  return context;
}
