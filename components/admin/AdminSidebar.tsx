"use client";

import { useMemo, useTransition } from "react";
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import { SidebarNavItem } from "@/components/layout/SidebarNavItem";
import { ThemeSwitcher } from "@/components/ui/ThemeSwitcher";
import { DashboardGlyph } from "@/components/layout/NavGlyph";
import {
  AllPromptsGlyph,
  AppSettingsGlyph,
  FlaggedGlyph,
  ReportsGlyph,
  UsersGlyph,
} from "@/components/layout/AdminNavGlyph";

function ReviewGlyph() {
  return (
    <svg width={14} height={14} viewBox="0 0 14 14" aria-hidden>
      <path
        d="M3 2h8v10H3V2zm2 2h4M5 7h4M5 10h2"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.2}
        strokeLinecap="round"
      />
    </svg>
  );
}

function initials(email: string) {
  const name = email.split("@")[0] ?? email;
  const a = name[0] ?? "A";
  const b = name[1] ?? "";
  return (a + b).toUpperCase();
}

export interface AdminSidebarProps {
  activePath: string;
  userEmail: string | null;
  flaggedCount: number;
}

export function AdminSidebar({ activePath, userEmail, flaggedCount }: Readonly<AdminSidebarProps>) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const avatar = useMemo(() => (userEmail ? initials(userEmail) : "A"), [userEmail]);

  async function onSignOut() {
    await signOut({ callbackUrl: "/" });
    globalThis.dispatchEvent(new Event("auth-changed"));
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
        <div className="hidden min-w-0 flex-1 items-center gap-2 md:flex">
          <span className="truncate text-[15px] font-medium" style={{ color: "var(--pa-text)" }}>
            PromptAnalyzer
          </span>
          <span
            className="ml-auto shrink-0 rounded-full px-1.5 py-0.5 font-semibold"
            style={{
              fontSize: 9,
              background: "rgba(255,107,53,.18)",
              color: "var(--pa-acc4)",
            }}
          >
            Admin
          </span>
        </div>
      </div>

      <nav className="flex-1 overflow-auto p-2">
        <div className="grid gap-1">
          <SidebarNavItem
            href="/admin"
            label="Dashboard"
            active={activePath === "/admin"}
            icon={<DashboardGlyph className="text-current" />}
          />
          <SidebarNavItem
            href="/admin/reports"
            label="Reports"
            active={activePath.startsWith("/admin/reports")}
            icon={<ReportsGlyph className="text-current" />}
          />
          <SidebarNavItem
            href="/admin/users"
            label="Users"
            active={activePath.startsWith("/admin/users")}
            icon={<UsersGlyph className="text-current" />}
          />
          <SidebarNavItem
            href="/admin/prompts"
            label="All prompts"
            active={activePath.startsWith("/admin/prompts")}
            icon={<AllPromptsGlyph className="text-current" />}
          />
          <SidebarNavItem
            href="/admin/review"
            label="Review queue"
            active={activePath.startsWith("/admin/review")}
            icon={<ReviewGlyph />}
          />
          <SidebarNavItem
            href="/admin/flags"
            title="Flagged"
            label={
              <span className="inline-flex items-center gap-1.5">
                Flagged
                {flaggedCount > 0 ? (
                  <span
                    className="min-w-[18px] rounded-full px-1 text-center text-[9px] font-semibold text-white"
                    style={{ background: "var(--pa-acc3)" }}
                  >
                    {Math.min(99, flaggedCount)}
                  </span>
                ) : null}
              </span>
            }
            active={activePath.startsWith("/admin/flags") || activePath.startsWith("/admin/flagged")}
            icon={<FlaggedGlyph className="text-current" />}
          />
          <SidebarNavItem
            href="/admin/settings"
            label="App settings"
            active={activePath.startsWith("/admin/settings")}
            icon={<AppSettingsGlyph className="text-current" />}
          />
        </div>
      </nav>

      <div className="mt-auto border-t border-[var(--pa-sb-border)]">
        <ThemeSwitcher />
        <div className="p-2">
          <div className="flex items-center gap-2 rounded-lg px-2 py-2">
            <div
              className="flex h-[26px] w-[26px] shrink-0 items-center justify-center rounded-lg text-xs font-medium text-white"
              style={{ background: "linear-gradient(135deg,#FF6B35,#FF006E)" }}
            >
              {avatar}
            </div>
            <div className="hidden min-w-0 md:block">
              <div className="truncate text-xs font-medium" style={{ color: "var(--pa-text)" }}>
                {userEmail ?? "Admin"}
              </div>
              <div style={{ fontSize: 10, color: "var(--pa-acc4)" }}>admin role</div>
              <button
                type="button"
                onClick={onSignOut}
                disabled={isPending}
                className="mt-0.5 text-xs font-medium disabled:opacity-60"
                style={{ color: "var(--pa-muted)" }}
              >
                Sign out
              </button>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
