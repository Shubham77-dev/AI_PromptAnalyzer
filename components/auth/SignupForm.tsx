"use client";

import { useState, useTransition } from "react";
import type { FormEvent } from "react";
import { useRouter } from "next/navigation";
import { getSession, signIn } from "next-auth/react";
import { SignupFormFields } from "@/components/auth/SignupFormFields";
import { validatePasswordStrength } from "@/lib/password-policy";
import type { PlanChoice } from "@/components/auth/PlanSelector";
import { SIMPLE_AUTH_MODE } from "@/lib/auth-flags";

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
  const [plan, setPlan] = useState<PlanChoice>("FREE");
  const [terms, setTerms] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    void plan;
    const strength = validatePasswordStrength(password);
    if (!strength.ok) {
      setError(strength.error);
      return;
    }
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
      setError(body?.error || "Could not create account.");
      return;
    }
    const sign = await signIn("credentials", {
      email: email.trim().toLowerCase(),
      password: SIMPLE_AUTH_MODE ? "" : password,
      redirect: false,
      callbackUrl: "/dashboard",
    });
    if (sign?.error) {
      setError(
        SIMPLE_AUTH_MODE
          ? "Account created but sign-in failed. Try the Log in page with the same email."
          : "Account created but sign-in failed. Try logging in.",
      );
      return;
    }
    const session = await getSession();
    const dest = session?.user?.role === "ADMIN" ? "/admin" : "/dashboard";
    startTransition(() => {
      router.push(dest);
      router.refresh();
    });
  }

  async function onGoogle() {
    setError(null);
    await signIn("google", { callbackUrl: "/dashboard" });
  }

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
      plan={plan}
      setPlan={setPlan}
      terms={terms}
      setTerms={setTerms}
      error={error}
      isPending={isPending}
      showGoogle={showGoogle}
      onSubmit={onSubmit}
      onGoogle={onGoogle}
    />
  );
}
