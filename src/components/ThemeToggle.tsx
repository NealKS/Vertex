import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";

const THEME_KEY = "vertex-theme";

export function ThemeToggle() {
  const [dark, setDark] = useState(false);
  const apply = (enabled: boolean) => {
    document.documentElement.classList.toggle("dark", enabled);
    document.documentElement.style.colorScheme = enabled ? "dark" : "light";
    document
      .querySelector('meta[name="theme-color"]')
      ?.setAttribute("content", enabled ? "#151c18" : "#faf7f0");
    setDark(enabled);
  };
  useEffect(() => {
    const system = window.matchMedia("(prefers-color-scheme: dark)");
    const sync = () => {
      try {
        const saved = localStorage.getItem(THEME_KEY);
        apply(saved === "dark" || (saved !== "light" && system.matches));
      } catch {
        setDark(document.documentElement.classList.contains("dark"));
      }
    };
    const onStorage = (event: StorageEvent) => {
      if (!event.key || event.key === THEME_KEY) sync();
    };
    sync();
    system.addEventListener("change", sync);
    window.addEventListener("storage", onStorage);
    return () => {
      system.removeEventListener("change", sync);
      window.removeEventListener("storage", onStorage);
    };
  }, []);
  return (
    <button
      type="button"
      aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
      title={dark ? "Switch to light mode" : "Switch to dark mode"}
      onClick={() => {
        const next = !dark;
        apply(next);
        try {
          localStorage.setItem(THEME_KEY, next ? "dark" : "light");
        } catch {
          /* Theme still works without storage. */
        }
      }}
      className="glass-panel rounded-lg p-2.5 text-foreground outline-offset-4 hover:bg-secondary"
    >
      {dark ? <Sun size={18} aria-hidden="true" /> : <Moon size={18} aria-hidden="true" />}
    </button>
  );
}
