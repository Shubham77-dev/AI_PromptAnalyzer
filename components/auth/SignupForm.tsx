"use client";

import { useState, useTransition } from "react";
import type { FormEvent } from "react";
import { useRouter } from "next/navigation";
import { getSession, signIn } from "next-auth/react";
import { SignupFormFields } from "@/components/auth/SignupFormFields";
import { validatePasswordStrength } from "@/lib/password-policy";
import type { PlanChoice } from "@/components/auth/PlanSelector";
import { SIMPLE_AUTH_MODE } from "@/lib/auth-flags";

function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

export function SignupForm({
  showGoogle,
}: Readonly<{
  showGoogle: boolean;
}>) {
  const router = useRouter();
  const [first, setFirst] = useState("");
  const [last, setLast] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);
  const [plan, setPlan] = useState<PlanChoice>("FREE");
  const [terms, setTerms] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{
    email?: string;
    password?: string;
    confirmPassword?: string;
  }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPending, startTransition] = useTransition();

  function validateFields(): boolean {
    const next: typeof fieldErrors = {};
    if (!email.trim()) next.email = "Email is required.";
    else if (!isValidEmail(email)) next.email = "Enter a valid email address.";
    const strength = validatePasswordStrength(password);
    if (!strength.ok) next.password = strength.error;
    if (confirmPassword !== password) next.confirmPassword = "Passwords do not match";
    setFieldErrors(next);
    return Object.keys(next).length === 0;
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    if (!validateFields()) return;
    if (!terms) {
      setError("Please accept the Terms of Service and Privacy Policy.");
      return;
    }

    void plan;
    setIsSubmitting(true);
    try {
      const name = `${first} ${last}`.trim() || undefined;
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          password,
          name,
        }),
      });
      const body = (await res.json().catch(() => null)) as { error?: string } | null;
      if (!res.ok) {
        if (res.status === 409) {
          setError("duplicate_email");
        } else {
          setError(body?.error || "Could not create account.");
        }
        return;
      }

      setSuccess("Account created! Signing you in…");

      const sign = await signIn("credentials", {
        email: email.trim().toLowerCase(),
        password: SIMPLE_AUTH_MODE ? "" : password,
        redirect: false,
        callbackUrl: "/dashboard",
      });
      if (sign?.error) {
        setError("Account created but sign-in failed. Try logging in.");
        return;
      }
      const session = await getSession();
      const dest = session?.user?.role === "ADMIN" ? "/admin" : "/dashboard";
      startTransition(() => {
        router.push(dest);
        router.refresh();
      });
    } catch {
      setError("Connection failed. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function onGoogle() {
    setError(null);
    await signIn("google", { callbackUrl: "/dashboard" });
  }

  const busy = isSubmitting || isPending;

  return (
    <SignupFormFields
      first={first}
      setFirst={setFirst}
      last={last}
      setLast={setLast}
      email={email}
      setEmail={setEmail}
      password={password}
      setPassword={setPassword}
      confirmPassword={confirmPassword}
      setConfirmPassword={setConfirmPassword}
      showPw={showPw}
      setShowPw={setShowPw}
      showConfirmPw={showConfirmPw}
      setShowConfirmPw={setShowConfirmPw}
      plan={plan}
      setPlan={setPlan}
      terms={terms}
      setTerms={setTerms}
      error={error}
      success={success}
      fieldErrors={fieldErrors}
      setFieldErrors={setFieldErrors}
      isPending={busy}
      showGoogle={showGoogle}
      onSubmit={onSubmit}
      onGoogle={onGoogle}
      validatePasswordStrength={validatePasswordStrength}
    />
  );
}
