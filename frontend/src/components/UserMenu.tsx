"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown, LogOut } from "lucide-react";
import { useAuth } from "@/components/AuthProvider";
import { initials } from "@/lib/format";

export default function UserMenu() {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const button = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    function onPointerDown(e: MouseEvent) {
      if (root.current && !root.current.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setOpen(false);
        button.current?.focus();
      }
    }
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  if (!user) return null;
  const name = user.displayName?.trim() || user.email?.split("@")[0] || "Account";

  return (
    <div ref={root} className="relative">
      <button
        ref={button}
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="flex items-center gap-2.5 rounded-full border border-line bg-white py-1 pl-1 pr-3 transition hover:bg-lightbox"
      >
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-cortex text-xs font-semibold text-white">
          {initials(user.displayName, user.email)}
        </span>
        <span className="hidden max-w-32 truncate text-sm font-medium sm:block">{name}</span>
        <ChevronDown size={16} className="text-muted" aria-hidden />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 z-30 mt-2 w-64 rounded-xl border border-line bg-film p-2 shadow-lg shadow-ink/10"
        >
          <div className="px-3 py-2">
            <p className="truncate text-sm font-semibold">{name}</p>
            <p className="truncate text-xs text-muted">{user.email}</p>
          </div>
          <div className="my-1 h-px bg-line" />
          <button
            role="menuitem"
            type="button"
            onClick={() => {
              setOpen(false);
              void logout();
            }}
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm transition hover:bg-lightbox"
          >
            <LogOut size={16} aria-hidden /> Sign out
          </button>
        </div>
      )}
    </div>
  );
}