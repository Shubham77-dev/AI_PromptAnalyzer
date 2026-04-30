"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ButtonGradient } from "@/components/ui/ButtonGradient";
import { ButtonOutline } from "@/components/ui/ButtonOutline";

export function AuthControls({
  initialEmail,
}: Readonly<{ initialEmail: string | null }>) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  async function login(e: { preventDefault: () => void }) {
    e.preventDefault();
    setError(null);

    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email }),
    });

    if (!res.ok) {
      const body = (await res.json().catch(() => null)) as { error?: string } | null;
      setError(body?.error || "Login failed");
      return;
    }

    const body = (await res.json().catch(() => null)) as
      | { token?: string; user?: { role?: "USER" | "ADMIN" } | null }
      | null;
    if (body?.token) globalThis.localStorage.setItem("pl_token", body.token);
    globalThis.dispatchEvent(new Event("auth-changed"));

    startTransition(() => {
      const role = body?.user?.role;
      router.push(role === "ADMIN" ? "/admin" : "/dashboard");
      router.refresh();
    });
    setEmail("");
  }

  async function logout() {
    setError(null);
    await fetch("/api/auth/logout", { method: "POST" });
    globalThis.localStorage.removeItem("pl_token");
    globalThis.dispatchEvent(new Event("auth-changed"));
    startTransition(() => router.refresh());
  }

  if (initialEmail) {
    return (
      <div className="flex flex-wrap items-center gap-3">
        <span className="text-sm" style={{ color: "var(--pa-muted)" }}>
          Signed in as
        </span>
        <span className="text-sm font-medium" style={{ color: "var(--pa-text)" }}>
          {initialEmail}
        </span>
        <ButtonOutline onClick={logout} disabled={isPending}>
          Log out
        </ButtonOutline>
      </div>
    );
  }

  return (
    <form onSubmit={login} className="flex flex-wrap items-center gap-2">
      <input
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="you@company.com"
        className="pa-search-input w-52 rounded-md px-3 py-1.5 text-sm outline-none"
        style={{
          border: "1px solid var(--pa-card-border)",
          background: "color-mix(in srgb, var(--pa-bg) 60%, var(--pa-card))",
          color: "var(--pa-text)",
        }}
      />
      <ButtonGradient type="submit" disabled={isPending || !email}>
        Sign in
      </ButtonGradient>
      {error ? (
        <span className="text-xs" style={{ color: "var(--pa-acc3)" }}>
          {error}
        </span>
      ) : null}
    </form>
  );
}
