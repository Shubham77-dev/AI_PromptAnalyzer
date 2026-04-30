"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

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

    const body = (await res.json()) as { token?: string } | null;
    if (body?.token) globalThis.localStorage.setItem("pl_token", body.token);
    globalThis.dispatchEvent(new Event("auth-changed"));

    startTransition(() => {
      router.push("/dashboard");
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
      <div className="flex items-center gap-3">
        <span className="text-sm text-zinc-600">Signed in as</span>
        <span className="text-sm font-medium">{initialEmail}</span>
        <button
          onClick={logout}
          disabled={isPending}
          className="rounded-md border border-zinc-200 bg-white px-3 py-1.5 text-sm font-medium hover:bg-zinc-50 disabled:opacity-60"
        >
          Log out
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={login} className="flex items-center gap-2">
      <input
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="you@company.com"
        className="w-52 rounded-md border border-zinc-200 bg-white px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-zinc-900/10"
      />
      <button
        type="submit"
        disabled={isPending || !email}
        className="rounded-md bg-zinc-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-60"
      >
        Sign in
      </button>
      {error ? <span className="text-xs text-red-600">{error}</span> : null}
    </form>
  );
}

