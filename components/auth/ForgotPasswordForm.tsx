"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import Link from "next/link";
import { ButtonGradient } from "@/components/ui/ButtonGradient";

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setSubmitting(true);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });

      const body = (await res.json().catch(() => null)) as
        | { ok?: boolean; message?: string; error?: string }
        | null;

      if (!res.ok) {
        setError(body?.error || "Something went wrong.");
        return;
      }

      setMessage(body?.message ?? "If an account exists for that email, you will receive reset instructions shortly.");
      setEmail("");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={(ev) => void onSubmit(ev)} className="grid gap-4">
      <label className="grid gap-1.5 text-sm">
        <span style={{ color: "var(--pa-muted)" }}>Email</span>
        <input
          type="email"
          autoComplete="email"
          value={email}
          onChange={(ev) => setEmail(ev.target.value)}
          required
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
      {message ? (
        <p className="text-sm leading-6" style={{ color: "var(--pa-muted)" }} role="status">
          {message}
        </p>
      ) : null}

      <ButtonGradient type="submit" disabled={submitting || !email}>
        {submitting ? "Sending…" : "Send reset link"}
      </ButtonGradient>

      <p className="text-sm" style={{ color: "var(--pa-muted)" }}>
        <Link href="/login" className="font-medium underline-offset-2 hover:underline" style={{ color: "var(--pa-acc1)" }}>
          Back to sign in
        </Link>
      </p>
    </form>
  );
}
