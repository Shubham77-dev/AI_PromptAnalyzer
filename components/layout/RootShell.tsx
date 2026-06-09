"use client";

import { usePathname } from "next/navigation";
import { Sidebar } from "@/components/layout/Sidebar";
import { InnerTopbar } from "@/components/layout/InnerTopbar";
import { useAuth } from "@/components/auth/AuthProvider";
import { usePageMeta } from "@/components/layout/PageMetaProvider";
import SidebarSkeleton from "@/components/skeletons/SidebarSkeleton";

const STANDALONE = new Set(["/", "/login", "/signup", "/forgot-password", "/reset-password"]);

export function RootShell({ children }: Readonly<{ children: React.ReactNode }>) {
  const pathname = usePathname() || "/";
  const { state } = useAuth();
  const { meta } = usePageMeta();

  const userEmail = state.status === "authenticated" ? state.user.email : null;
  const userRole = state.status === "authenticated" ? state.user.role : null;

  // Admin routes have their own shell; avoid double sidebars/margins.
  if (pathname.startsWith("/admin")) {
    return <>{children}</>;
  }

  if (STANDALONE.has(pathname)) {
    return <div className="min-h-screen bg-[var(--pa-bg)] text-[var(--pa-text)]">{children}</div>;
  }

  return (
    <div className="min-h-screen bg-[var(--pa-bg)] text-[var(--pa-text)]">
      {state.status === "loading" ? (
        <SidebarSkeleton />
      ) : (
        <Sidebar activePath={pathname} userEmail={userEmail} userRole={userRole} />
      )}
      <div className="ml-10 min-h-screen md:ml-[220px]">
        <InnerTopbar title={meta.title || ""} actions={meta.actions} />
        <div className="px-4 py-6">{children}</div>
      </div>
    </div>
  );
}

