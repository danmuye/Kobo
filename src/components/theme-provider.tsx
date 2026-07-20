import { createContext, useContext, useEffect, useMemo, useState, useCallback } from "react";
import { useSettingsStore } from "@/store/settings";
import type { ThemeMode } from "@/store/settings";

interface Ctx {
  theme: ThemeMode;
  resolvedTheme: "light" | "dark";
  toggle: () => void;
  setTheme: (t: ThemeMode) => void;
}

const ThemeContext = createContext<Ctx | null>(null);

const themeCycle: ThemeMode[] = ["light", "dark", "system"];

function migrateLegacyTheme() {
  const legacy = localStorage.getItem("theme") as ThemeMode | null;
  if (legacy === "dark" || legacy === "light") {
    const current = useSettingsStore.getState().settings.appearance.theme;
    if (current === "light" && legacy === "dark") {
      useSettingsStore.getState().updateAppearance({ theme: "dark" });
    }
    localStorage.removeItem("theme");
  }
}

function getSystemTheme(): "light" | "dark" {
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function resolveTheme(theme: ThemeMode): "light" | "dark" {
  return theme === "system" ? getSystemTheme() : theme;
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [systemDark, setSystemDark] = useState(false);
  const theme = useSettingsStore((s) => s.settings.appearance.theme);
  const updateAppearance = useSettingsStore((s) => s.updateAppearance);

  const resolvedTheme = useMemo<"light" | "dark">(
    () => (theme === "system" ? (systemDark ? "dark" : "light") : theme),
    [theme, systemDark],
  );

  useEffect(() => {
    migrateLegacyTheme();
    setReady(true);
  }, []);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    setSystemDark(mq.matches);
    const handler = (e: MediaQueryListEvent) => setSystemDark(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove("light", "dark");
    root.classList.add(resolvedTheme);
  }, [resolvedTheme]);

  const toggle = useCallback(() => {
    const idx = themeCycle.indexOf(theme);
    updateAppearance({ theme: themeCycle[(idx + 1) % themeCycle.length] });
  }, [theme, updateAppearance]);

  const setTheme = useCallback((t: ThemeMode) => updateAppearance({ theme: t }), [updateAppearance]);

  const ctx = useMemo<Ctx>(
    () => ({ theme, resolvedTheme, toggle, setTheme }),
    [theme, resolvedTheme, toggle, setTheme],
  );

  if (!ready) return null;

  return (
    <ThemeContext.Provider value={ctx}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
};
