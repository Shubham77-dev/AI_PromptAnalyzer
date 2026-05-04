"use client";

import { useMemo, useTransition } from "react";
import { useRouter } from "next/navigation";
import { SidebarNavItem } from "@/components/layout/SidebarNavItem";
import { AnalyzeGlyph, DashboardGlyph, LibraryGlyph, SettingsGlyph } from "@/components/layout/NavGlyph";
import { signOut } from "next-auth/react";
import { requireAuth } from "@/app/_lib/auth-guard";
import { useAuth } from "@/components/auth/AuthProvider";
import { ThemeSwitcher } from "@/components/ui/ThemeSwitcher";
import { UserAvatar } from "@/components/ui/UserAvatar";
import { Shield } from "lucide-react";
import type { UserRole } from "@prisma/client";

export interface SidebarProps {
  activePath: string;
  userEmail: string | null;
  userRole: UserRole | null;
}

function initials(email: string) {
  const name = email.split("@")[0] ?? email;
  const a = name[0] ?? "U";
  const b = name[1] ?? "";
  return (a + b).toUpperCase();
}

export function Sidebar({ activePath, userEmail, userRole }: Readonly<SidebarProps>) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const { refresh } = useAuth();

  const avatar = useMemo(() => (userEmail ? initials(userEmail) : "G"), [userEmail]);

  async function goProtected(href: string) {
    await requireAuth(() => router.push(href), { router });
  }

  async function onSignOut() {
    await signOut({ callbackUrl: "/" });
    globalThis.dispatchEvent(new Event("auth-changed"));
    await refresh();
    startTransition(() => router.refresh());
  }

  return (
    <aside className="pa-transition fixed left-0 top-0 z-20 flex h-screen w-10 flex-col border-r border-[var(--pa-sb-border)] bg-[var(--pa-sidebar)] md:w-[220px]">
      <div className="flex h-12 items-center gap-2 border-b border-[var(--pa-sb-border)] px-3">
        <span
          className="grid h-[26px] w-[26px] shrink-0 place-items-center rounded-lg pa-float-orb"
          style={{ background: "var(--pa-grad)" }}
          aria-hidden
        >
          <svg width={14} height={14} viewBox="0 0 16 16" aria-hidden>
            <path d="M8 2l1.8 4H14l-3.4 2.4 1.3 4L8 10l-3.9 2.4 1.3-4L2 6h4.2z" fill="white" />
          </svg>
        </span>
        <span className="hidden text-[15px] font-medium md:block" style={{ color: "var(--pa-text)" }}>
          PromptAnalyzer
        </span>
      </div>

      <nav className="flex-1 overflow-auto p-2">
        <div className="grid gap-1">
          <SidebarNavItem
            href="/dashboard"
            label="Dashboard"
            active={activePath.startsWith("/dashboard")}
            icon={<DashboardGlyph className="text-current" />}
            onClick={userEmail ? undefined : () => void goProtected("/dashboard")}
          />
          <SidebarNavItem
            href="/upload"
            label="Analyze"
            active={activePath.startsWith("/upload")}
            icon={<AnalyzeGlyph className="text-current" />}
            onClick={userEmail ? undefined : () => void goProtected("/upload")}
          />
          <SidebarNavItem
            href="/library"
            label="Library"
            active={activePath.startsWith("/library")}
            icon={<LibraryGlyph className="text-current" />}
          />
          {userRole === "ADMIN" ? (
            <SidebarNavItem
              href="/admin"
              label="Admin"
              active={activePath.startsWith("/admin")}
              icon={<Shield className="h-[15px] w-[15px] text-current" strokeWidth={1.75} />}
              onClick={userEmail ? undefined : () => void goProtected("/admin")}
            />
          ) : null}
          <SidebarNavItem
            href="/settings"
            label="Settings"
            active={activePath.startsWith("/settings")}
            icon={<SettingsGlyph className="text-current" />}
            onClick={userEmail ? undefined : () => void goProtected("/settings")}
          />
        </div>
      </nav>

      <div className="mt-auto border-t border-[var(--pa-sb-border)]">
        <ThemeSwitcher />
        <div className="p-2">
          <div className="flex items-center gap-2 rounded-lg px-2 py-2">
            <UserAvatar initials={avatar} size="sm" />
            <div className="hidden min-w-0 md:block">
              <div className="truncate text-xs font-medium" style={{ color: "var(--pa-text)" }}>
                {userEmail ?? "Guest"}
              </div>
              {userEmail ? (
                <button
                  type="button"
                  onClick={onSignOut}
                  disabled={isPending}
                  className="mt-0.5 text-xs font-medium disabled:opacity-60"
                  style={{ color: "var(--pa-muted)" }}
                >
                  Sign out
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => router.push("/login")}
                  className="mt-0.5 text-xs font-medium"
                  style={{ color: "var(--pa-muted)" }}
                >
                  Sign in
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
