import { Suspense } from "react";
import { ResetPasswordWithTokenForm } from "@/components/auth/ResetPasswordWithTokenForm";

export default function ResetPasswordPage() {
  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-10">
      <div
        className="rounded-2xl p-8"
        style={{ border: "1px solid var(--pa-card-border)", background: "var(--pa-card)" }}
      >
        <h1 className="text-2xl font-semibold tracking-tight" style={{ color: "var(--pa-text)" }}>
          Set a new password
        </h1>
        <p className="mt-2 text-sm leading-6" style={{ color: "var(--pa-muted)" }}>
          Choose a strong password. This link can only be used once.
        </p>
        <div className="mt-6">
          <Suspense fallback={<p className="text-sm text-[var(--pa-muted)]">Loading…</p>}>
            <ResetPasswordWithTokenForm />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
