"use client";

import type { FormEvent } from "react";
import Link from "next/link";
import { ArrowRightIcon, EmailIcon, EyeIcon, LockIcon } from "@/components/auth/AuthIcons";
import { ButtonGradient } from "@/components/ui/ButtonGradient";
import { SocialButton } from "@/components/auth/SocialButton";
import { GoogleMark } from "@/components/auth/GoogleMark";
import { Spinner } from "@/components/ui/Spinner";

export interface LoginFormFieldsProps {
  email: string;
  setEmail: (v: string) => void;
  password: string;
  setPassword: (v: string) => void;
  showPw: boolean;
  setShowPw: (v: boolean) => void;
  rememberMe: boolean;
  setRememberMe: (v: boolean) => void;
  error: string | null;
  isPending: boolean;
  showGoogle: boolean;
  simpleAuthMode: boolean;
  onSubmit: (e: FormEvent) => void;
  onGoogle: () => void;
}

export function LoginFormFields({
  email,
  setEmail,
  password,
  setPassword,
  showPw,
  setShowPw,
  rememberMe,
  setRememberMe,
  error,
  isPending,
  showGoogle,
  simpleAuthMode,
  onSubmit,
  onGoogle,
}: Readonly<LoginFormFieldsProps>) {
  const canSubmit = simpleAuthMode ? Boolean(email.trim()) : Boolean(email.trim() && password);

  return (
    <div className="grid gap-5">
      <form onSubmit={(e) => void onSubmit(e)} className="grid gap-4">
        <label className="grid gap-1">
          <span className="text-[11px]" style={{ color: "var(--pa-muted)" }}>
            Email address
          </span>
          <span className="flex items-center gap-2 pa-input">
            <EmailIcon style={{ color: "var(--pa-muted)" }} />
            <input
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={isPending}
              className="min-w-0 flex-1 bg-transparent outline-none"
              style={{ color: "var(--pa-text)" }}
            />
          </span>
        </label>
        {simpleAuthMode ? null : (
          <div className="grid gap-1">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[11px]" style={{ color: "var(--pa-muted)" }}>
                Password
              </span>
              <Link href="/forgot-password" className="cursor-pointer text-[11px]" style={{ color: "var(--pa-acc1)" }}>
                Forgot password?
              </Link>
            </div>
            <span className="flex items-center gap-2 pa-input">
              <LockIcon style={{ color: "var(--pa-muted)" }} />
              <input
                type={showPw ? "text" : "password"}
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={1}
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
          </div>
        )}
        {!simpleAuthMode ? (
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              disabled={isPending}
            />
            <span className="text-[11px]" style={{ color: "var(--pa-muted)" }}>
              Remember me
            </span>
          </label>
        ) : null}
        {error ? (
          <p className="text-sm" style={{ color: "var(--pa-acc3)" }} role="alert">
            {error}
          </p>
        ) : null}
        <ButtonGradient
          type="submit"
          fullWidth
          disabled={isPending || !canSubmit}
          className="inline-flex items-center justify-center gap-2 rounded-[10px] py-2.5 text-[13px]"
        >
          {isPending ? (
            <>
              <Spinner size="sm" /> Signing in…
            </>
          ) : (
            <>
              {simpleAuthMode ? "Continue" : "Sign In"} <ArrowRightIcon style={{ color: "white" }} />
            </>
          )}
        </ButtonGradient>
      </form>
      {showGoogle && !simpleAuthMode ? (
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
        Don&apos;t have an account?{" "}
        <Link href="/signup" style={{ color: "var(--pa-acc1)" }}>
          Sign up
        </Link>
      </p>
    </div>
  );
}
