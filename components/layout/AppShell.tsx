"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { Sidebar } from "@/components/layout/Sidebar";
import { InnerTopbar } from "@/components/layout/InnerTopbar";
import type { UserRole } from "@prisma/client";

export interface AppShellProps {
  title: string;
  actions?: ReactNode;
  userEmail?: string | null;
  userRole?: UserRole | null;
  children: ReactNode;
}

export function AppShell({ title, actions, userEmail = null, userRole = null, children }: Readonly<AppShellProps>) {
  const pathname = usePathname() || "/";

  return (
    <div className="min-h-screen bg-[var(--pa-bg)] text-[var(--pa-text)]">
      <Sidebar activePath={pathname} userEmail={userEmail} userRole={userRole} />
      <div className="ml-10 min-h-screen md:ml-[220px]">
        <InnerTopbar title={title} actions={actions} />
        <div className="px-4 py-6">{children}</div>
      </div>
    </div>
  );
}

