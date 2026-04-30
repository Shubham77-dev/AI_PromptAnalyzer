import { prisma } from "@/lib/prisma";
import { SettingsToggle } from "@/components/admin/SettingsToggle";
import { adminUpsertAppConfig } from "@/app/admin/actions";

export default async function AdminSettingsPage() {
  const config =
    (await prisma.appConfig.findUnique({ where: { id: 1 } }).catch(() => null)) ??
    ({
      minPublishScore: 60,
      freeTierDailyLimit: 10,
      requireEmailVerification: false,
      allowPublicRegistration: true,
      maintenanceMode: false,
    } as const);

  return (
    <div className="grid gap-4">
      <div>
        <div className="text-lg font-semibold text-gray-900">Settings</div>
        <div className="text-sm text-gray-500">Manage application configuration.</div>
      </div>

      <form action={adminUpsertAppConfig} className="grid gap-4">
        <div className="grid gap-3 lg:grid-cols-2">
          <label className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-black/10">
            <div className="text-sm font-medium text-gray-900">min_publish_score</div>
            <div className="mt-1 text-xs text-gray-500">Minimum score required to publish automatically.</div>
            <input
              type="number"
              name="min_publish_score"
              min={0}
              max={100}
              defaultValue={config.minPublishScore}
              className="mt-3 w-full rounded-lg border border-black/10 bg-white px-3 py-2 text-sm outline-none focus:border-red-300 focus:ring-2 focus:ring-red-100"
            />
          </label>

          <label className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-black/10">
            <div className="text-sm font-medium text-gray-900">free_tier_daily_limit</div>
            <div className="mt-1 text-xs text-gray-500">Daily analysis limit for free tier users.</div>
            <input
              type="number"
              name="free_tier_daily_limit"
              min={0}
              max={10000}
              defaultValue={config.freeTierDailyLimit}
              className="mt-3 w-full rounded-lg border border-black/10 bg-white px-3 py-2 text-sm outline-none focus:border-red-300 focus:ring-2 focus:ring-red-100"
            />
          </label>
        </div>

        <div className="grid gap-3 lg:grid-cols-2">
          <SettingsToggle
            name="require_email_verification"
            label="Require email verification"
            description="When enabled, new accounts must verify email before using protected features."
            defaultChecked={config.requireEmailVerification}
          />
          <SettingsToggle
            name="allow_public_registration"
            label="Allow public registration"
            description="When disabled, only admins can create accounts."
            defaultChecked={config.allowPublicRegistration}
          />
          <SettingsToggle
            name="maintenance_mode"
            label="Maintenance mode"
            description="Put the app into read-only / maintenance state."
            defaultChecked={config.maintenanceMode}
          />
        </div>

        <div className="flex items-center gap-3">
          <button
            type="submit"
            className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
          >
            Save
          </button>
          <div className="text-xs text-gray-500">Model name is still sourced from `.env`.</div>
        </div>
      </form>
    </div>
  );
}

