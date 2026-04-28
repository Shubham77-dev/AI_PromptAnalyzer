import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { AuthControls } from "@/app/_components/AuthControls";
import { ABOUT_MESSAGE } from "@/app/_lib/app-config";

export default async function LoginPage() {
  const user = await getCurrentUser();
  if (user) redirect("/dashboard");

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-10">
      <div className="rounded-2xl border border-zinc-200 bg-white p-8">
        <h1 className="text-2xl font-semibold tracking-tight">Login</h1>
        <p className="mt-2 text-sm leading-6 text-zinc-600">{ABOUT_MESSAGE}</p>
        <div className="mt-6">
          <AuthControls initialEmail={null} />
        </div>
      </div>
    </div>
  );
}

