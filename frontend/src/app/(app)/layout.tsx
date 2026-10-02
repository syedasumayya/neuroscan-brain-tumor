"use client";

import { LoaderCircle, TriangleAlert } from "lucide-react";
import AppShell from "@/components/AppShell";
import { useRequireAuth } from "@/components/AuthProvider";

/** Everything inside the (app) folder needs a signed-in user and gets the top navigation. */
export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, loading, configured } = useRequireAuth();

  if (!configured) {
    return (
      <main className="mx-auto max-w-lg px-6 py-20">
        <div className="rounded-2xl border border-caution/30 bg-caution-soft p-6 text-sm text-ink/80">
          <p className="flex items-center gap-2 font-semibold text-caution">
            <TriangleAlert size={18} aria-hidden /> Firebase isn&apos;t set up yet
          </p>
          <p className="mt-2">
            Add your <code className="font-mono">NEXT_PUBLIC_FIREBASE_*</code> values to{" "}
            <code className="font-mono">frontend/.env.local</code> and restart{" "}
            <code className="font-mono">npm run dev</code>.
          </p>
        </div>
      </main>
    );
  }

  if (loading || !user) {
    return (
      <main className="flex min-h-screen items-center justify-center text-muted">
        <LoaderCircle className="animate-spin" aria-label="Loading" />
      </main>
    );
  }

  return <AppShell>{children}</AppShell>;
}