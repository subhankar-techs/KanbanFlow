"use client";

import { useEffect } from "react";
import { useUIStore } from "@/store/uiStore";

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const theme = useUIStore((s) => s.theme);

  useEffect(() => {
    const root = document.documentElement;

    function applyTheme(t: "light" | "dark" | "system") {
      root.classList.remove("light", "dark");
      if (t === "system") {
        const prefersDark = window.matchMedia(
          "(prefers-color-scheme: dark)"
        ).matches;
        root.classList.add(prefersDark ? "dark" : "light");
      } else {
        root.classList.add(t);
      }
    }

    applyTheme(theme);

    // Listen for system theme changes when set to "system"
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    function handleSystemChange() {
      if (useUIStore.getState().theme === "system") {
        applyTheme("system");
      }
    }
    mq.addEventListener("change", handleSystemChange);

    return () => mq.removeEventListener("change", handleSystemChange);
  }, [theme]);

  return <>{children}</>;
}
