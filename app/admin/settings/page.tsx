import { prisma } from "@/lib/prisma";
import { AdminSettingsView } from "@/components/admin/AdminSettingsView";

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
    <AdminSettingsView
      initial={{
        minPublishScore: config.minPublishScore,
        freeTierDailyLimit: config.freeTierDailyLimit,
        requireEmailVerification: config.requireEmailVerification,
        allowPublicRegistration: config.allowPublicRegistration,
        maintenanceMode: config.maintenanceMode,
      }}
    />
  );
}
