"use client";

import { useEffect, useState, useTransition } from "react";
import type { FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getSession, signIn } from "next-auth/react";
import { LoginFormFields } from "@/components/auth/LoginFormFields";
import { SIMPLE_AUTH_MODE } from "@/lib/auth-flags";

export function LoginForm({
  showGoogle,
}: Readonly<{
  showGoogle: boolean;
}>) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPending, startTransition] = useTransition();

  const rawCallback = searchParams.get("callbackUrl");
  const explicitCallback =
    rawCallback && rawCallback.startsWith("/") && !rawCallback.startsWith("//") ? rawCallback : null;
  const defaultAfterLogin = "/dashboard";

  useEffect(() => {
    const code = searchParams.get("error");
    if (!code) return;
    if (code === "access_denied") {
      setError("Access denied.");
      return;
    }
    const messages: Record<string, string> = {
      OAuthSignin: "Could not start Google sign-in. Try again.",
      OAuthCallback: "Google sign-in failed after redirect.",
      OAuthAccountNotLinked: "This email is already registered with another sign-in method.",
      Callback: "Authentication callback failed.",
      Configuration: "Auth is misconfigured. Check server environment variables.",
      AccessDenied: "Access denied.",
      Verification: "Verification failed.",
      Default: "Sign-in failed. Try again.",
    };
    setError(messages[code] ?? messages.Default);
  }, [searchParams]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const res = await signIn("credentials", {
        email: email.trim().toLowerCase(),
        password: SIMPLE_AUTH_MODE ? "" : password,
        redirect: false,
        callbackUrl: explicitCallback ?? defaultAfterLogin,
      });

      if (res?.error) {
        if (SIMPLE_AUTH_MODE) {
          setError("Could not sign in. Check your email or account status.");
        } else {
          try {
            const hintRes = await fetch("/api/auth/login-hint", {
              method: "POST",
              headers: { "content-type": "application/json" },
              body: JSON.stringify({ email: email.trim().toLowerCase() }),
            });
            const hintBody = (await hintRes.json().catch(() => null)) as { hint?: string } | null;
            if (hintBody?.hint === "oauth_or_reset") {
              setError("Please use Google sign-in or reset your password to set a password for this account.");
            } else {
              setError("Invalid email or password");
            }
          } catch {
            setError("Connection failed. Please try again.");
          }
        }
        return;
      }

      if (rememberMe) {
        try {
          globalThis.localStorage?.setItem("pa-remember-email", email.trim().toLowerCase());
        } catch {
          // ignore storage errors
        }
      }

      const session = await getSession();
      const role = session?.user?.role;
      const dest = explicitCallback ?? (role === "ADMIN" ? "/admin" : defaultAfterLogin);

      if (res?.url) {
        startTransition(() => {
          router.push(res.url ?? dest);
          router.refresh();
        });
        return;
      }
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

  useEffect(() => {
    try {
      const saved = globalThis.localStorage?.getItem("pa-remember-email");
      if (saved) {
        setEmail(saved);
        setRememberMe(true);
      }
    } catch {
      // ignore
    }
  }, []);

  async function onGoogle() {
    setError(null);
    await signIn("google", { callbackUrl: explicitCallback ?? defaultAfterLogin });
  }

  const busy = isSubmitting || isPending;

  return (
    <LoginFormFields
      email={email}
      setEmail={setEmail}
      password={password}
      setPassword={setPassword}
      showPw={showPw}
      setShowPw={setShowPw}
      rememberMe={rememberMe}
      setRememberMe={setRememberMe}
      error={error}
      isPending={busy}
      showGoogle={showGoogle}
      simpleAuthMode={SIMPLE_AUTH_MODE}
      onSubmit={onSubmit}
      onGoogle={onGoogle}
    />
  );
}
