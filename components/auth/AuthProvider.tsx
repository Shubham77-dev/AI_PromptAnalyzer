"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";

export type AuthState =
  | { status: "loading"; user: null }
  | { status: "guest"; user: null }
  | { status: "authenticated"; user: { email: string } };

type AuthContextValue = {
  state: AuthState;
  refresh: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

async function fetchMe() {
  const res = await fetch("/api/auth/me", { method: "GET" }).catch(() => null);
  if (!res?.ok) return null;
  const body = (await res.json().catch(() => null)) as { user?: { email: string } | null } | null;
  return body?.user ?? null;
}

export function AuthProvider({
  initialEmail,
  children,
}: Readonly<{ initialEmail: string | null; children: React.ReactNode }>) {
  const pathname = usePathname();
  const [state, setState] = useState<AuthState>(() =>
    initialEmail ? { status: "authenticated", user: { email: initialEmail } } : { status: "loading", user: null },
  );

  const refresh = async () => {
    setState((s) => (s.status === "loading" ? s : { status: "loading", user: null }));
    const me = await fetchMe();
    setState(me ? { status: "authenticated", user: me } : { status: "guest", user: null });
  };

  useEffect(() => {
    // Defer to avoid synchronous setState-in-effect lint/perf issue.
    const id = globalThis.setTimeout(() => void refresh(), 0);
    return () => globalThis.clearTimeout(id);
  }, []);

  useEffect(() => {
    // Log + refresh on route change to catch server session updates.
    console.log("[auth] route:", pathname);
    void fetchMe().then((me) => {
      console.log("[auth] me:", me);
      setState(me ? { status: "authenticated", user: me } : { status: "guest", user: null });
    });
  }, [pathname]);

  useEffect(() => {
    const onChanged = () => void refresh();
    globalThis.addEventListener("auth-changed", onChanged);
    return () => globalThis.removeEventListener("auth-changed", onChanged);
  }, []);

  const value = useMemo<AuthContextValue>(() => ({ state, refresh }), [state]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

