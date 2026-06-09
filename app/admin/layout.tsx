import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { isAdmin } from "@/lib/rbac";
import { AdminShell } from "@/components/admin/AdminShell";
import { prisma } from "@/lib/prisma";

export default async function AdminLayout({ children }: Readonly<{ children: ReactNode }>) {
  const user = await getCurrentUser();
  if (!user || !isAdmin(user)) redirect("/dashboard?error=access_denied");

  const flaggedCount = await prisma.prompt
    .count({
      where: {
        status: "PUBLISHED",
        OR: [{ flagged: true }, { score: { lt: 40 } }, { analysis: { accuracy: { lt: 40 } } }],
      },
    })
    .catch(() => 0);

  return (
    <AdminShell title="Admin" userEmail={user.email} flaggedCount={flaggedCount}>
      {children}
    </AdminShell>
  );
}

