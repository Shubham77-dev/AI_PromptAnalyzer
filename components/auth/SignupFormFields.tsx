"use client";

import type { FormEvent } from "react";
import Link from "next/link";
import { EmailIcon } from "@/components/auth/AuthIcons";
import { ButtonGradient } from "@/components/ui/ButtonGradient";
import { PasswordStrength } from "@/components/auth/PasswordStrength";
import { PlanSelector, type PlanChoice } from "@/components/auth/PlanSelector";
import { SocialButton } from "@/components/auth/SocialButton";
import { GoogleMark } from "@/components/auth/GoogleMark";

export interface SignupFormFieldsProps {
  first: string;
  setFirst: (v: string) => void;
  last: string;
  setLast: (v: string) => void;
  email: string;
  setEmail: (v: string) => void;
  password: string;
  setPassword: (v: string) => void;
  plan: PlanChoice;
  setPlan: (p: PlanChoice) => void;
  terms: boolean;
  setTerms: (v: boolean) => void;
  error: string | null;
  isPending: boolean;
  showGoogle: boolean;
  onSubmit: (e: FormEvent) => void;
  onGoogle: () => void;
}

export function SignupFormFields({
  first,
  setFirst,
  last,
  setLast,
  email,
  setEmail,
  password,
  setPassword,
  plan,
  setPlan,
  terms,
  setTerms,
  error,
  isPending,
  showGoogle,
  onSubmit,
  onGoogle,
}: Readonly<SignupFormFieldsProps>) {
  return (
    <div className="grid gap-5">
      <form onSubmit={(e) => void onSubmit(e)} className="grid gap-4">
        <div className="grid grid-cols-2 gap-2">
          <label className="grid gap-1">
            <span className="text-[11px]" style={{ color: "var(--pa-muted)" }}>
              First name
            </span>
            <input className="pa-input w-full" value={first} onChange={(e) => setFirst(e.target.value)} maxLength={60} />
          </label>
          <label className="grid gap-1">
            <span className="text-[11px]" style={{ color: "var(--pa-muted)" }}>
              Last name
            </span>
            <input className="pa-input w-full" value={last} onChange={(e) => setLast(e.target.value)} maxLength={60} />
          </label>
        </div>
        <label className="grid gap-1">
          <span className="text-[11px]" style={{ color: "var(--pa-muted)" }}>
            Email
          </span>
          <span className="flex items-center gap-2 pa-input">
            <EmailIcon style={{ color: "var(--pa-muted)" }} />
            <input
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="min-w-0 flex-1 bg-transparent outline-none"
              style={{ color: "var(--pa-text)" }}
            />
          </span>
        </label>
        <label className="grid gap-1">
          <span className="text-[11px]" style={{ color: "var(--pa-muted)" }}>
            Password
          </span>
          <input
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
            maxLength={256}
            className="pa-input w-full"
          />
          <PasswordStrength password={password} />
        </label>
        <div className="grid gap-2">
          <div className="text-[11px]" style={{ color: "var(--pa-muted)" }}>
            Plan
          </div>
          <PlanSelector value={plan} onChange={setPlan} />
        </div>
        <label className="flex items-start gap-2">
          <button
            type="button"
            role="checkbox"
            aria-checked={terms}
            onClick={() => setTerms(!terms)}
            className="mt-0.5 grid h-[14px] w-[14px] place-items-center rounded"
            style={{
              border: terms ? "none" : "1px solid var(--pa-card-border)",
              background: terms ? "var(--pa-acc1)" : "transparent",
            }}
          >
            {terms ? (
              <svg width={10} height={10} viewBox="0 0 10 10" aria-hidden>
                <path d="M1.5 4.5L3.5 6.5 7.5 2.5" stroke="white" strokeWidth={1.2} strokeLinecap="round" fill="none" />
              </svg>
            ) : null}
          </button>
          <span className="text-[11px] leading-snug" style={{ color: "var(--pa-muted)" }}>
            I agree to the{" "}
            <Link href="/" style={{ color: "var(--pa-acc1)" }}>
              Terms of Service
            </Link>{" "}
            and{" "}
            <Link href="/" style={{ color: "var(--pa-acc1)" }}>
              Privacy Policy
            </Link>
          </span>
        </label>
        {error ? (
          <p className="text-sm" style={{ color: "var(--pa-acc3)" }} role="alert">
            {error}
          </p>
        ) : null}
        <ButtonGradient type="submit" fullWidth disabled={isPending || !email || password.length < 8 || !terms}>
          {isPending ? "Creating account…" : "Create account"}
        </ButtonGradient>
      </form>
      {showGoogle ? (
        <>
          <div className="flex items-center gap-2">
            <div className="h-px flex-1" style={{ background: "var(--pa-card-border)" }} />
            <span className="text-[10px]" style={{ color: "var(--pa-muted)" }}>
              or
            </span>
            <div className="h-px flex-1" style={{ background: "var(--pa-card-border)" }} />
          </div>
          <SocialButton onClick={() => void onGoogle()} disabled={isPending} icon={<GoogleMark />}>
            Continue with Google
          </SocialButton>
        </>
      ) : null}
      <p className="text-center text-xs" style={{ color: "var(--pa-muted)" }}>
        Already have an account?{" "}
        <Link href="/login" style={{ color: "var(--pa-acc1)" }}>
          Sign in
        </Link>
      </p>
    </div>
  );
}
