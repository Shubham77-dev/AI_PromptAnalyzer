import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { SettingsPageClient } from "@/components/settings/SettingsPageClient";

/**
 * Settings UI uses the shared shell from `RootShell` (sidebar + top bar).
 * `PageMeta` sets title + “Save changes” in the top bar (same contract as `AppShell`’s title/actions).
 */
export default async function SettingsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?callbackUrl=/settings");

  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-5xl px-1 py-8 text-sm text-gray-600">Loading settings…</div>
      }
    >
      <SettingsPageClient initialEmail={user.email} />
    </Suspense>
  );
}
