import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { SignupForm } from "@/components/auth/SignupForm";
import { AuthCard } from "@/components/auth/AuthCard";
import { LogoOrb } from "@/components/ui/LogoOrb";
import { SIMPLE_AUTH_MODE } from "@/lib/auth-flags";

function googleEnabled() {
  return Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
}

export default async function SignupPage() {
  const session = await auth();
  if (session?.user?.id) {
    redirect(session.user.role === "ADMIN" ? "/admin" : "/dashboard");
  }

  const showGoogle = googleEnabled() && !SIMPLE_AUTH_MODE;

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-10" style={{ background: "var(--pa-bg)" }}>
      <div className="w-full max-w-[400px]">
        <AuthCard width={360}>
          <div className="mb-6 text-center">
            <div className="flex justify-center">
              <LogoOrb size={48} radius={14} />
            </div>
            <h1 className="mt-4 text-xl font-medium" style={{ color: "var(--pa-text)" }}>
              Create account
            </h1>
            <p className="mt-1 text-xs" style={{ color: "var(--pa-muted)" }}>
              Start analyzing prompts for free
            </p>
          </div>
          <SignupForm showGoogle={showGoogle} />
        </AuthCard>
      </div>
    </div>
  );
}
