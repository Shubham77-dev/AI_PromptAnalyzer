"use client";

import { createContext, useContext, useMemo } from "react";
import { SessionProvider, useSession } from "next-auth/react";
import type { Session } from "next-auth";
import type { UserRole } from "@prisma/client";

export type AuthState =
  | { status: "loading"; user: null }
  | { status: "guest"; user: null }
  | { status: "authenticated"; user: { email: string; role: UserRole } };

type AuthContextValue = {
  state: AuthState;
  refresh: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

function AuthContextInner({ children }: Readonly<{ children: React.ReactNode }>) {
  const { data: session, status, update } = useSession();

  const state = useMemo<AuthState>(() => {
    if (status === "loading") return { status: "loading", user: null };
    const email = session?.user?.email;
    if (!email) return { status: "guest", user: null };
    const role = session.user?.role ?? "USER";
    return { status: "authenticated", user: { email, role } };
  }, [session, status]);

  const refresh = async () => {
    await update();
  };

  const value = useMemo<AuthContextValue>(() => ({ state, refresh }), [state, refresh]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function AuthProvider({
  session,
  children,
}: Readonly<{
  session: Session | null;
  children: React.ReactNode;
}>) {
  return (
    <SessionProvider session={session ?? undefined} basePath="/api/auth">
      <AuthContextInner>{children}</AuthContextInner>
    </SessionProvider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
