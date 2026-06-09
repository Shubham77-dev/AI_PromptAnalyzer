import { Suspense } from "react";
import { ForgotPasswordForm } from "@/components/auth/ForgotPasswordForm";

export default function ForgotPasswordPage() {
  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-10">
      <div
        className="rounded-2xl p-8"
        style={{ border: "1px solid var(--pa-card-border)", background: "var(--pa-card)" }}
      >
        <h1 className="text-2xl font-semibold tracking-tight" style={{ color: "var(--pa-text)" }}>
          Forgot password
        </h1>
        <p className="mt-2 text-sm leading-6" style={{ color: "var(--pa-muted)" }}>
          Enter your email address. If an account exists, we will send a link to reset your password (expires in 15
          minutes).
        </p>
        <div className="mt-6">
          <Suspense fallback={<p className="text-sm text-[var(--pa-muted)]">Loading…</p>}>
            <ForgotPasswordForm />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
