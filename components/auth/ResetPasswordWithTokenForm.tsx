"use client";

import { useState, useTransition } from "react";
import type { FormEvent } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { getSession, signIn } from "next-auth/react";
import { ButtonGradient } from "@/components/ui/ButtonGradient";
import { validatePasswordStrength } from "@/lib/password-policy";

export function ResetPasswordWithTokenForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tokenFromUrl = searchParams.get("token")?.trim() ?? "";

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  if (!tokenFromUrl) {
    return (
      <div className="grid gap-3 text-sm" style={{ color: "var(--pa-muted)" }}>
        <p>Invalid or missing reset link.</p>
        <Link href="/forgot-password" className="font-medium underline-offset-2 hover:underline" style={{ color: "var(--pa-acc1)" }}>
          Request a new link
        </Link>
      </div>
    );
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }

    const strength = validatePasswordStrength(password);
    if (!strength.ok) {
      setError(strength.error);
      return;
    }

    const res = await fetch("/api/auth/reset-password", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ token: tokenFromUrl, password }),
    });

    const body = (await res.json().catch(() => null)) as { error?: string; email?: string } | null;
    if (!res.ok) {
      setError(body?.error || "Could not reset password.");
      return;
    }

    const email = typeof body?.email === "string" ? body.email : null;
    if (email) {
      const sign = await signIn("credentials", {
        email,
        password,
        redirect: false,
        callbackUrl: "/dashboard",
      });
      if (!sign?.error) {
        const session = await getSession();
        const dest = session?.user?.role === "ADMIN" ? "/admin" : "/dashboard";
        startTransition(() => {
          router.refresh();
          router.replace(dest);
        });
        return;
      }
    }

    startTransition(() => {
      router.push("/login");
      router.refresh();
    });
  }

  return (
    <form onSubmit={(ev) => void onSubmit(ev)} className="grid gap-4">
      <label className="grid gap-1.5 text-sm">
        <span style={{ color: "var(--pa-muted)" }}>New password</span>
        <input
          type="password"
          autoComplete="new-password"
          value={password}
          onChange={(ev) => setPassword(ev.target.value)}
          required
          minLength={8}
          maxLength={256}
          className="pa-search-input w-full rounded-md px-3 py-2 text-sm outline-none"
          style={{
            border: "1px solid var(--pa-card-border)",
            background: "color-mix(in srgb, var(--pa-bg) 60%, var(--pa-card))",
            color: "var(--pa-text)",
          }}
        />
      </label>
      <label className="grid gap-1.5 text-sm">
        <span style={{ color: "var(--pa-muted)" }}>Confirm password</span>
        <input
          type="password"
          autoComplete="new-password"
          value={confirm}
          onChange={(ev) => setConfirm(ev.target.value)}
          required
          minLength={8}
          maxLength={256}
          className="pa-search-input w-full rounded-md px-3 py-2 text-sm outline-none"
          style={{
            border: "1px solid var(--pa-card-border)",
            background: "color-mix(in srgb, var(--pa-bg) 60%, var(--pa-card))",
            color: "var(--pa-text)",
          }}
        />
      </label>

      {error ? (
        <p className="text-sm" style={{ color: "var(--pa-acc3)" }} role="alert">
          {error}
        </p>
      ) : null}

      <ButtonGradient type="submit" disabled={isPending || password.length < 8 || confirm.length < 8}>
        {isPending ? "Saving…" : "Update password"}
      </ButtonGradient>

      <p className="text-sm" style={{ color: "var(--pa-muted)" }}>
        <Link href="/login" className="font-medium underline-offset-2 hover:underline" style={{ color: "var(--pa-acc1)" }}>
          Back to sign in
        </Link>
      </p>
    </form>
  );
}
