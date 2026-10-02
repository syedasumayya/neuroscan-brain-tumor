"use client";

import { useSyncExternalStore } from "react";
import { Moon, Sun } from "lucide-react";

type Theme = "light" | "dark";
const KEY = "neuroscan:theme";

const listeners = new Set<() => void>();

function readTheme(): Theme {
  return document.documentElement.dataset.theme === "dark" ? "dark" : "light";
}

function setTheme(next: Theme) {
  document.documentElement.dataset.theme = next;
  localStorage.setItem(KEY, next);
  listeners.forEach((notify) => notify());
}

function subscribe(notify: () => void) {
  listeners.add(notify);
  return () => listeners.delete(notify);
}

export default function ThemeToggle() {
  // useSyncExternalStore (not useEffect+setState): the layout's inline script already set
  // the real theme on <html> before paint (from localStorage, or the OS preference as a
  // fallback), so this just reads that back. The "light" server snapshot matches what the
  // page renders before hydration, avoiding a mismatch or a flash back to light. toggle()
  // notifies subscribers directly, so the button's icon updates on click.
  const theme = useSyncExternalStore(subscribe, readTheme, () => "light" as Theme);

  function toggle() {
    setTheme(theme === "dark" ? "light" : "dark");
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={theme === "dark" ? "Switch to light theme" : "Switch to dark theme"}
      className="rounded-full border border-line bg-film p-2 text-muted transition hover:bg-lightbox hover:text-ink"
    >
      {theme === "dark" ? <Sun size={16} aria-hidden /> : <Moon size={16} aria-hidden />}
    </button>
  );
}