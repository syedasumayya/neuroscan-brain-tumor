"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
  type User,
} from "firebase/auth";
import { getFirebaseAuth, isFirebaseConfigured } from "@/lib/firebase";

type AuthContextValue = {
  user: User | null;
  /** True until Firebase has told us whether someone is signed in. */
  loading: boolean;
  /** False when the Firebase keys are missing from .env.local. */
  configured: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [resolved, setResolved] = useState(false);
  const [, refresh] = useState(0); // re-render after the display name changes

  useEffect(() => {
    if (!isFirebaseConfigured) return;
    return onAuthStateChanged(getFirebaseAuth(), (next) => {
      setUser(next);
      setResolved(true);
    });
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      loading: isFirebaseConfigured && !resolved,
      configured: isFirebaseConfigured,
      async signIn(email, password) {
        await signInWithEmailAndPassword(getFirebaseAuth(), email, password);
      },
      async register(name, email, password) {
        const cred = await createUserWithEmailAndPassword(getFirebaseAuth(), email, password);
        await updateProfile(cred.user, { displayName: name });
        refresh((n) => n + 1);
      },
      async signInWithGoogle() {
        await signInWithPopup(getFirebaseAuth(), new GoogleAuthProvider());
      },
      async resetPassword(email) {
        await sendPasswordResetEmail(getFirebaseAuth(), email);
      },
      async logout() {
        await signOut(getFirebaseAuth());
      },
    }),
    [user, resolved],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>.");
  return ctx;
}

/** For pages that need a signed-in user: sends visitors to /login. */
export function useRequireAuth(): AuthContextValue {
  const auth = useAuth();
  const router = useRouter();
  useEffect(() => {
    if (auth.configured && !auth.loading && !auth.user) router.replace("/login");
  }, [auth.configured, auth.loading, auth.user, router]);
  return auth;
}

/** For /login and /register: signed-in visitors go straight to the app. */
export function useRedirectIfSignedIn(): AuthContextValue {
  const auth = useAuth();
  const router = useRouter();
  useEffect(() => {
    if (auth.user) router.replace("/dashboard");
  }, [auth.user, router]);
  return auth;
}