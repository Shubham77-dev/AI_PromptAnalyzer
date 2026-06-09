import { redirect } from "next/navigation";
import { Suspense } from "react";
import { auth } from "@/auth";
import { LoginForm } from "@/components/auth/LoginForm";
import { DefaultPasswordBanner } from "@/components/auth/DefaultPasswordBanner";
import { AuthCard } from "@/components/auth/AuthCard";
import { LogoOrb } from "@/components/ui/LogoOrb";
import { SIMPLE_AUTH_MODE } from "@/lib/auth-flags";

function googleEnabled() {
  return Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
}

export default async function LoginPage() {
  const session = await auth();
  if (session?.user?.id) {
    const role = session.user.role;
    redirect(role === "ADMIN" ? "/admin" : "/dashboard");
  }

  const showGoogle = googleEnabled() && !SIMPLE_AUTH_MODE;

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-10" style={{ background: "var(--pa-bg)" }}>
      <div className="w-full max-w-[360px]">
        <AuthCard width={340}>
          <div className="mb-6 text-center">
            <div className="flex justify-center">
              <LogoOrb size={48} radius={14} />
            </div>
            <h1 className="mt-4 text-xl font-medium" style={{ color: "var(--pa-text)" }}>
              Welcome back
            </h1>
            <p className="mt-1 text-xs" style={{ color: "var(--pa-muted)" }}>
              Sign in to your PromptAnalyzer account
            </p>
          </div>
          <Suspense fallback={<div className="text-center text-xs" style={{ color: "var(--pa-muted)" }}>Loading…</div>}>
            <DefaultPasswordBanner />
            <LoginForm showGoogle={showGoogle} />
          </Suspense>
        </AuthCard>
      </div>
    </div>
  );
}
