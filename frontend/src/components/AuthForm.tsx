"use client";

import { useState } from "react";
import Link from "next/link";
import { CircleCheck, Eye, EyeOff, LoaderCircle, TriangleAlert } from "lucide-react";
import { useRedirectIfSignedIn } from "@/components/AuthProvider";
import { friendlyAuthError } from "@/lib/auth-errors";

type Mode = "login" | "register";

const inputClass =
  "w-full rounded-lg border border-line bg-white px-3.5 py-2.5 text-sm text-ink placeholder:text-muted/70 " +
  "outline-none transition focus:border-cortex focus:ring-2 focus:ring-cortex/20";

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-xs text-muted">{hint}</span>}
    </label>
  );
}

function PasswordInput(props: {
  value: string;
  onChange: (v: string) => void;
  autoComplete: string;
  placeholder?: string;
}) {
  const [shown, setShown] = useState(false);
  return (
    <div className="relative">
      <input
        type={shown ? "text" : "password"}
        required
        value={props.value}
        onChange={(e) => props.onChange(e.target.value)}
        autoComplete={props.autoComplete}
        placeholder={props.placeholder}
        className={`${inputClass} pr-11`}
      />
      <button
        type="button"
        onClick={() => setShown((s) => !s)}
        aria-label={shown ? "Hide password" : "Show password"}
        className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-muted hover:text-ink"
      >
        {shown ? <EyeOff size={18} aria-hidden /> : <Eye size={18} aria-hidden />}
      </button>
    </div>
  );
}

export default function AuthForm({ mode }: { mode: Mode }) {
  const auth = useRedirectIfSignedIn();
  const isRegister = mode === "register";

  const [view, setView] = useState<"form" | "reset">("form");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  async function run(action: () => Promise<void>) {
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      await action();
    } catch (err) {
      setError(friendlyAuthError(err));
    } finally {
      setBusy(false);
    }
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (view === "reset") {
      return run(async () => {
        try {
          await auth.resetPassword(email.trim());
        } catch (err) {
          // Don't reveal whether an account exists; only report real problems.
          const code = (err as { code?: string })?.code;
          if (code !== "auth/user-not-found") throw err;
        }
        setNotice("If an account exists for that email, a reset link is on its way.");
      });
    }
    if (isRegister) {
      if (name.trim().length < 2) return setError("Please enter your full name.");
      if (password.length < 8) return setError("Choose a password with at least 8 characters.");
      if (password !== confirm) return setError("The two passwords don't match.");
      return run(() => auth.register(name.trim(), email.trim(), password));
    }
    return run(() => auth.signIn(email.trim(), password));
  }

  const title = view === "reset" ? "Reset your password" : isRegister ? "Create your account" : "Sign in";
  const subtitle =
    view === "reset"
      ? "Enter your email and we'll send you a link to choose a new password."
      : isRegister
        ? "Free for research and teaching use."
        : "Welcome back. Sign in to analyse a scan.";

  if (!auth.configured) {
    return (
      <div className="rounded-2xl border border-caution/30 bg-caution-soft p-6 text-sm text-caution">
        <p className="flex items-center gap-2 font-semibold">
          <TriangleAlert size={18} aria-hidden /> Firebase isn&apos;t set up yet
        </p>
        <p className="mt-2 text-ink/80">
          Add your six <code className="font-mono">NEXT_PUBLIC_FIREBASE_*</code> values to{" "}
          <code className="font-mono">frontend/.env.local</code>, then stop and restart{" "}
          <code className="font-mono">npm run dev</code>.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-line bg-film p-8 shadow-[0_1px_0_rgba(19,35,48,0.04)]">
      <h1 className="text-3xl font-semibold">{title}</h1>
      <p className="mt-1.5 text-sm text-muted">{subtitle}</p>

      {view === "form" && (
        <>
          <button
            type="button"
            disabled={busy}
            onClick={() => run(auth.signInWithGoogle)}
            className="mt-6 flex w-full items-center justify-center gap-3 rounded-lg border border-line bg-white px-4 py-2.5 text-sm font-medium transition hover:bg-lightbox disabled:opacity-60"
          >
            <span className="flex h-5 w-5 items-center justify-center rounded-full border border-line font-display text-xs font-semibold" aria-hidden>
              G
            </span>
            Continue with Google
          </button>
          <div className="my-6 flex items-center gap-3 text-xs text-muted" aria-hidden>
            <span className="h-px flex-1 bg-line" /> or use email <span className="h-px flex-1 bg-line" />
          </div>
        </>
      )}

      <form onSubmit={submit} noValidate={false} className={`space-y-4 ${view === "reset" ? "mt-6" : ""}`}>
        {isRegister && view === "form" && (
          <Field label="Full name">
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoComplete="name"
              placeholder="Dr. Amina Khan"
              className={inputClass}
            />
          </Field>
        )}

        <Field label="Email">
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            placeholder="you@hospital.org"
            className={inputClass}
          />
        </Field>

        {view === "form" && (
          <>
            <Field label="Password" hint={isRegister ? "At least 8 characters." : undefined}>
              <PasswordInput
                value={password}
                onChange={setPassword}
                autoComplete={isRegister ? "new-password" : "current-password"}
              />
            </Field>
            {isRegister && (
              <Field label="Confirm password">
                <PasswordInput value={confirm} onChange={setConfirm} autoComplete="new-password" />
              </Field>
            )}
          </>
        )}

        {error && (
          <p role="alert" className="flex items-start gap-2 rounded-lg border border-signal/30 bg-signal-soft px-3 py-2.5 text-sm text-signal">
            <TriangleAlert size={16} className="mt-0.5 shrink-0" aria-hidden /> {error}
          </p>
        )}
        {notice && (
          <p role="status" className="flex items-start gap-2 rounded-lg border border-clear/30 bg-clear-soft px-3 py-2.5 text-sm text-clear">
            <CircleCheck size={16} className="mt-0.5 shrink-0" aria-hidden /> {notice}
          </p>
        )}

        <button
          type="submit"
          disabled={busy}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-cortex px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-cortex-dark disabled:opacity-70"
        >
          {busy && <LoaderCircle size={16} className="animate-spin" aria-hidden />}
          {view === "reset" ? "Send reset link" : isRegister ? "Create account" : "Sign in"}
        </button>
      </form>

      <div className="mt-6 space-y-2 text-center text-sm text-muted">
        {view === "reset" ? (
          <button type="button" onClick={() => { setView("form"); setError(null); setNotice(null); }} className="font-medium text-cortex hover:underline">
            Back to sign in
          </button>
        ) : (
          <>
            {!isRegister && (
              <button type="button" onClick={() => { setView("reset"); setError(null); setNotice(null); }} className="font-medium text-cortex hover:underline">
                Forgot your password?
              </button>
            )}
            <p>
              {isRegister ? "Already have an account? " : "New to NeuroScan? "}
              <Link href={isRegister ? "/login" : "/register"} className="font-medium text-cortex hover:underline">
                {isRegister ? "Sign in" : "Create an account"}
              </Link>
            </p>
          </>
        )}
      </div>
    </div>
  );
}