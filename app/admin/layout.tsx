import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { isAdmin } from "@/lib/rbac";
import { AdminShell } from "@/components/admin/AdminShell";

export default async function AdminLayout({ children }: Readonly<{ children: ReactNode }>) {
  const user = await getCurrentUser();
  if (!user || !isAdmin(user)) redirect("/");

  return <AdminShell title="Admin" userEmail={user.email}>{children}</AdminShell>;
}

