"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChartColumn, History, LayoutDashboard, ScanLine } from "lucide-react";
import QuickActions from "@/components/QuickActions";
import StatusPill from "@/components/StatusPill";
import ThemeToggle from "@/components/ThemeToggle";
import UserMenu from "@/components/UserMenu";

const NAV = [
  { href: "/dashboard", label: "Dashboard", Icon: LayoutDashboard },
  { href: "/scan", label: "New Scan", Icon: ScanLine },
  { href: "/history", label: "History", Icon: History },
  { href: "/metrics", label: "Metrics", Icon: ChartColumn },
];

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-20 border-b border-line bg-film/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center gap-8 px-6">
          <Link href="/dashboard" className="font-display text-xl font-semibold tracking-tight">
            NeuroScan
          </Link>

          <nav aria-label="Main" className="hidden h-full md:flex">
            {NAV.map(({ href, label, Icon }) => (
              <Link
                key={href}
                href={href}
                aria-current={isActive(href) ? "page" : undefined}
                className={`flex h-full items-center gap-2 border-b-2 px-4 text-sm font-medium transition ${
                  isActive(href)
                    ? "border-cortex text-ink"
                    : "border-transparent text-muted hover:text-ink"
                }`}
              >
                <Icon size={17} aria-hidden />
                <span>{label}</span>
              </Link>
            ))}
          </nav>

          <div className="ml-auto flex items-center gap-2 sm:gap-3">
            <QuickActions />
            <StatusPill />
            <ThemeToggle />
            <UserMenu />
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-8 pb-28 md:pb-10">{children}</main>

      <footer className="hidden border-t border-line py-4 text-center text-xs text-muted md:block">
        For academic and research use only. Not a medical device.
      </footer>

      <nav
        aria-label="Main (mobile)"
        className="fixed inset-x-0 bottom-0 z-20 grid grid-cols-4 border-t border-line bg-film md:hidden"
      >
        {NAV.map(({ href, label, Icon }) => (
          <Link
            key={href}
            href={href}
            aria-current={isActive(href) ? "page" : undefined}
            className={`flex flex-col items-center gap-1 py-2.5 text-xs font-medium ${
              isActive(href) ? "text-cortex" : "text-muted"
            }`}
          >
            <Icon size={20} aria-hidden />
            <span>{label}</span>
          </Link>
        ))}
      </nav>
    </div>
  );
}