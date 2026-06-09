"use client";

import type { FormEvent } from "react";
import Link from "next/link";
import { EmailIcon, EyeIcon } from "@/components/auth/AuthIcons";
import { ButtonGradient } from "@/components/ui/ButtonGradient";
import { PasswordStrength } from "@/components/auth/PasswordStrength";
import { PlanSelector, type PlanChoice } from "@/components/auth/PlanSelector";
import { SocialButton } from "@/components/auth/SocialButton";
import { GoogleMark } from "@/components/auth/GoogleMark";
import { Spinner } from "@/components/ui/Spinner";

export interface SignupFormFieldsProps {
  first: string;
  setFirst: (v: string) => void;
  last: string;
  setLast: (v: string) => void;
  email: string;
  setEmail: (v: string) => void;
  password: string;
  setPassword: (v: string) => void;
  confirmPassword: string;
  setConfirmPassword: (v: string) => void;
  showPw: boolean;
  setShowPw: (v: boolean) => void;
  showConfirmPw: boolean;
  setShowConfirmPw: (v: boolean) => void;
  plan: PlanChoice;
  setPlan: (p: PlanChoice) => void;
  terms: boolean;
  setTerms: (v: boolean) => void;
  error: string | null;
  success: string | null;
  fieldErrors: { email?: string; password?: string; confirmPassword?: string };
  setFieldErrors: (v: { email?: string; password?: string; confirmPassword?: string }) => void;
  isPending: boolean;
  showGoogle: boolean;
  onSubmit: (e: FormEvent) => void;
  onGoogle: () => void;
  validatePasswordStrength: (password: string) => { ok: true } | { ok: false; error: string };
}

function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
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
  confirmPassword,
  setConfirmPassword,
  showPw,
  setShowPw,
  showConfirmPw,
  setShowConfirmPw,
  plan,
  setPlan,
  terms,
  setTerms,
  error,
  success,
  fieldErrors,
  setFieldErrors,
  isPending,
  showGoogle,
  onSubmit,
  onGoogle,
  validatePasswordStrength,
}: Readonly<SignupFormFieldsProps>) {
  return (
    <div className="grid gap-5">
      <form onSubmit={(e) => void onSubmit(e)} className="grid gap-4">
        <div className="grid grid-cols-2 gap-2">
          <label className="grid gap-1">
            <span className="text-[11px]" style={{ color: "var(--pa-muted)" }}>
              First name
            </span>
            <input
              className="pa-input w-full"
              value={first}
              onChange={(e) => setFirst(e.target.value)}
              maxLength={60}
              disabled={isPending}
              placeholder="Your name (optional)"
            />
          </label>
          <label className="grid gap-1">
            <span className="text-[11px]" style={{ color: "var(--pa-muted)" }}>
              Last name
            </span>
            <input
              className="pa-input w-full"
              value={last}
              onChange={(e) => setLast(e.target.value)}
              maxLength={60}
              disabled={isPending}
            />
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
              onBlur={() => {
                if (!email.trim()) setFieldErrors({ ...fieldErrors, email: "Email is required." });
                else if (!isValidEmail(email)) setFieldErrors({ ...fieldErrors, email: "Enter a valid email address." });
                else setFieldErrors({ ...fieldErrors, email: undefined });
              }}
              required
              disabled={isPending}
              className="min-w-0 flex-1 bg-transparent outline-none"
              style={{ color: "var(--pa-text)" }}
            />
          </span>
          {fieldErrors.email ? (
            <span className="text-[11px]" style={{ color: "var(--pa-acc3)" }}>
              {fieldErrors.email}
            </span>
          ) : null}
        </label>
        <label className="grid gap-1">
          <span className="text-[11px]" style={{ color: "var(--pa-muted)" }}>
            Password
          </span>
          <span className="flex items-center gap-2 pa-input">
            <input
              type={showPw ? "text" : "password"}
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onBlur={() => {
                const strength = validatePasswordStrength(password);
                setFieldErrors({
                  ...fieldErrors,
                  password: strength.ok ? undefined : strength.error,
                });
              }}
              required
              minLength={8}
              maxLength={256}
              disabled={isPending}
              className="min-w-0 flex-1 bg-transparent outline-none"
              style={{ color: "var(--pa-text)" }}
            />
            <button
              type="button"
              className="shrink-0"
              onClick={() => setShowPw(!showPw)}
              aria-label={showPw ? "Hide password" : "Show password"}
              disabled={isPending}
            >
              <EyeIcon style={{ color: "var(--pa-muted)" }} />
            </button>
          </span>
          <span className="text-[10px]" style={{ color: "var(--pa-muted)" }}>
            At least 8 characters, 1 uppercase letter, 1 number
          </span>
          <PasswordStrength password={password} />
          {fieldErrors.password ? (
            <span className="text-[11px]" style={{ color: "var(--pa-acc3)" }}>
              {fieldErrors.password}
            </span>
          ) : null}
        </label>
        <label className="grid gap-1">
          <span className="text-[11px]" style={{ color: "var(--pa-muted)" }}>
            Confirm password
          </span>
          <span className="flex items-center gap-2 pa-input">
            <input
              type={showConfirmPw ? "text" : "password"}
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              onBlur={() => {
                setFieldErrors({
                  ...fieldErrors,
                  confirmPassword:
                    confirmPassword !== password ? "Passwords do not match" : undefined,
                });
              }}
              required
              disabled={isPending}
              className="min-w-0 flex-1 bg-transparent outline-none"
              style={{ color: "var(--pa-text)" }}
            />
            <button
              type="button"
              className="shrink-0"
              onClick={() => setShowConfirmPw(!showConfirmPw)}
              aria-label={showConfirmPw ? "Hide confirm password" : "Show confirm password"}
              disabled={isPending}
            >
              <EyeIcon style={{ color: "var(--pa-muted)" }} />
            </button>
          </span>
          {fieldErrors.confirmPassword ? (
            <span className="text-[11px]" style={{ color: "var(--pa-acc3)" }}>
              {fieldErrors.confirmPassword}
            </span>
          ) : null}
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
            disabled={isPending}
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
        {success ? (
          <p className="text-sm" style={{ color: "var(--pa-acc2)" }} role="status">
            {success}
          </p>
        ) : null}
        {error === "duplicate_email" ? (
          <p className="text-sm" style={{ color: "var(--pa-acc3)" }} role="alert">
            An account with this email already exists.{" "}
            <Link href="/login" style={{ color: "var(--pa-acc1)" }}>
              Sign in instead?
            </Link>
          </p>
        ) : error ? (
          <p className="text-sm" style={{ color: "var(--pa-acc3)" }} role="alert">
            {error}
          </p>
        ) : null}
        <ButtonGradient
          type="submit"
          fullWidth
          disabled={isPending || !email || password.length < 8 || !confirmPassword || !terms}
        >
          {isPending ? (
            <span className="inline-flex items-center justify-center gap-2">
              <Spinner size="sm" /> Creating account…
            </span>
          ) : (
            "Create Account"
          )}
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
