"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ChartColumn, ChevronDown, History, ScanLine, Zap } from "lucide-react";

const ACTIONS = [
  { href: "/scan", label: "New scan", Icon: ScanLine },
  { href: "/history", label: "View history", Icon: History },
  { href: "/metrics", label: "View metrics", Icon: ChartColumn },
];

/** A quick-jump menu so any page is two clicks away, instead of only the four tabs. */
export default function QuickActions() {
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onPointerDown(e: MouseEvent) {
      if (root.current && !root.current.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={root} className="relative hidden sm:block">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="flex items-center gap-1.5 rounded-full border border-line bg-film px-3 py-1.5 text-xs font-medium text-muted transition hover:bg-lightbox hover:text-ink"
      >
        <Zap size={13} aria-hidden /> Quick actions <ChevronDown size={13} aria-hidden />
      </button>

      {open && (
        <div role="menu" className="absolute right-0 z-30 mt-2 w-48 rounded-xl border border-line bg-film p-1.5 shadow-lg shadow-ink/10">
          {ACTIONS.map(({ href, label, Icon }) => (
            <Link
              key={href}
              href={href}
              role="menuitem"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition hover:bg-lightbox"
            >
              <Icon size={15} aria-hidden /> {label}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}