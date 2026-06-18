import { create } from "zustand";
import { persist } from "zustand/middleware";

interface UIState {
  theme: "light" | "dark" | "system";
  sidebarOpen: boolean;
  activeDialog: string | null;

  setTheme: (theme: "light" | "dark" | "system") => void;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  openDialog: (id: string) => void;
  closeDialog: () => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      theme: "system",
      sidebarOpen: true,
      activeDialog: null,

      setTheme: (theme) => {
        set({ theme });
        // Apply theme to document
        if (typeof window !== "undefined") {
          const root = document.documentElement;
          root.classList.remove("light", "dark");
          if (theme === "system") {
            const prefersDark = window.matchMedia(
              "(prefers-color-scheme: dark)"
            ).matches;
            root.classList.add(prefersDark ? "dark" : "light");
          } else {
            root.classList.add(theme);
          }
        }
      },

      toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
      setSidebarOpen: (open) => set({ sidebarOpen: open }),
      openDialog: (id) => set({ activeDialog: id }),
      closeDialog: () => set({ activeDialog: null }),
    }),
    {
      name: "kanbanflow-ui",
      partialize: (state) => ({ theme: state.theme }),
    }
  )
);
