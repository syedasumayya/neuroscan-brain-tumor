"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { useAuth } from "@/components/AuthProvider";

const primary =
  "inline-flex items-center justify-center gap-2 rounded-lg bg-cortex px-5 py-3 text-sm font-semibold text-white transition hover:bg-cortex-dark";
const secondary =
  "inline-flex items-center justify-center rounded-lg border border-line bg-film px-5 py-3 text-sm font-semibold transition hover:bg-white";

/** Header buttons and hero buttons: they change when someone is already signed in. */
export default function LandingActions({ variant }: { variant: "header" | "hero" }) {
  const { user, loading } = useAuth();

  // Avoid flashing "Sign in" at people who are already signed in.
  if (loading) return <div className="h-11" aria-hidden />;

  if (user) {
    return (
      <Link href="/dashboard" className={variant === "hero" ? primary : `${primary} !py-2`}>
        Open dashboard <ArrowRight size={16} aria-hidden />
      </Link>
    );
  }

  if (variant === "header") {
    return (
      <div className="flex items-center gap-2">
        <Link href="/login" className="rounded-lg px-4 py-2 text-sm font-semibold transition hover:bg-film">
          Sign in
        </Link>
        <Link href="/register" className={`${primary} !py-2`}>
          Create account
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap gap-3">
      <Link href="/register" className={primary}>
        Create a free account <ArrowRight size={16} aria-hidden />
      </Link>
      <Link href="/login" className={secondary}>
        Sign in
      </Link>
    </div>
  );
}