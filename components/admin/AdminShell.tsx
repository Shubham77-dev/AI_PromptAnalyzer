"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { InnerTopbar } from "@/components/layout/InnerTopbar";
import { usePageMeta } from "@/components/layout/PageMetaProvider";
import { AdminSidebar } from "@/components/admin/AdminSidebar";

export interface AdminShellProps {
  title: string;
  userEmail: string | null;
  flaggedCount: number;
  children: ReactNode;
}

export function AdminShell({ title, userEmail, flaggedCount, children }: Readonly<AdminShellProps>) {
  const pathname = usePathname() || "/admin";
  const { meta } = usePageMeta();
  const topTitle = meta.title.trim() ? meta.title : title;
  return (
    <div className="min-h-screen bg-[var(--pa-bg)] text-[var(--pa-text)]">
      <AdminSidebar activePath={pathname} userEmail={userEmail} flaggedCount={flaggedCount} />
      <div className="ml-10 min-h-screen md:ml-[220px]">
        <InnerTopbar title={topTitle} actions={meta.actions} />
        <div className="px-4 py-6">{children}</div>
      </div>
    </div>
  );
}
