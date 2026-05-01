"use client";

import { useMemo, useTransition } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Settings } from "lucide-react";
import { InnerTopbar } from "@/components/layout/InnerTopbar";
import { usePageMeta } from "@/components/layout/PageMetaProvider";
import { SidebarNavItem } from "@/components/layout/SidebarNavItem";
import { ThemeSwitcher } from "@/components/ui/ThemeSwitcher";

export interface AdminShellProps {
  title: string;
  userEmail: string | null;
  children: React.ReactNode;
}

function Icon({ d }: Readonly<{ d: string }>) {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
      <path d={d} fill="currentColor" />
    </svg>
  );
}

function initials(email: string) {
  const name = email.split("@")[0] ?? email;
  const a = name[0] ?? "A";
  const b = name[1] ?? "";
  return (a + b).toUpperCase();
}

function AdminSidebar({ activePath, userEmail }: Readonly<{ activePath: string; userEmail: string | null }>) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const avatar = useMemo(() => (userEmail ? initials(userEmail) : "A"), [userEmail]);

  async function signOut() {
    await fetch("/api/auth/logout", { method: "POST" }).catch(() => null);
    globalThis.localStorage?.removeItem("pl_token");
    globalThis.dispatchEvent(new Event("auth-changed"));
    startTransition(() => router.refresh());
  }

  return (
    <aside className="pa-transition fixed left-0 top-0 z-20 flex h-screen w-10 flex-col border-r border-[var(--pa-sb-border)] bg-[var(--pa-sidebar)] md:w-[220px]">
      <div className="flex h-[52px] items-center gap-2 border-b border-[var(--pa-sb-border)] px-3">
        <span
          className="h-2.5 w-2.5 shrink-0 rounded-full pa-float-orb"
          style={{ backgroundImage: "var(--pa-grad)" }}
          aria-hidden
        />
        <div className="hidden min-w-0 flex-1 items-center gap-2 md:flex">
          <span className="truncate text-[15px] font-medium" style={{ color: "var(--pa-text)" }}>
            PromptAnalyzer
          </span>
          <span
            className="ml-auto shrink-0 rounded-full px-1.5 py-0.5 font-semibold"
            style={{
              fontSize: 9,
              background: "rgba(255,107,53,.2)",
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
            icon={<Icon d="M4 4h7v7H4V4zm9 0h7v7h-7V4zM4 13h7v7H4v-7zm9 0h7v7h-7v-7z" />}
          />
          <SidebarNavItem
            href="/admin/reports"
            label="Reports"
            active={activePath.startsWith("/admin/reports")}
            icon={<Icon d="M4 19h16v2H4v-2zM6 10h3v7H6v-7zm5-4h3v11h-3V6zm5 7h3v4h-3v-4z" />}
          />
          <SidebarNavItem
            href="/admin/users"
            label="Users"
            active={activePath.startsWith("/admin/users")}
            icon={<Icon d="M16 11c1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3 1.34 3 3 3zM8 11c1.66 0 3-1.34 3-3S9.66 5 8 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5C15 14.17 10.33 13 8 13zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z" />}
          />
          <SidebarNavItem
            href="/admin/prompts"
            label="Prompts"
            active={activePath.startsWith("/admin/prompts")}
            icon={<Icon d="M6 6h14v2H6V6zM6 11h14v2H6v-2zM6 16h14v2H6v-2zM4 6h1v2H4V6zm0 5h1v2H4v-2zm0 5h1v2H4v-2z" />}
          />
          <SidebarNavItem
            href="/admin/review"
            label="Review queue"
            active={activePath.startsWith("/admin/review")}
            icon={<Icon d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-9 14l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />}
          />
          <SidebarNavItem
            href="/admin/flagged"
            label="Flagged"
            active={activePath.startsWith("/admin/flagged")}
            icon={<Icon d="M6 2h2v20H6V2zm4 1h10l-2 5 2 5H10l-2 5V3z" />}
          />
          <SidebarNavItem
            href="/admin/settings"
            label="Settings"
            active={activePath.startsWith("/admin/settings")}
            icon={<Settings className="h-4 w-4" aria-hidden />}
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
                onClick={signOut}
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

export function AdminShell({ title, userEmail, children }: Readonly<AdminShellProps>) {
  const pathname = usePathname() || "/admin";
  const { meta } = usePageMeta();
  const topTitle = meta.title.trim() ? meta.title : title;
  return (
    <div className="min-h-screen bg-[var(--pa-bg)] text-[var(--pa-text)]">
      <AdminSidebar activePath={pathname} userEmail={userEmail} />
      <div className="ml-10 min-h-screen md:ml-[220px]">
        <InnerTopbar title={topTitle} actions={meta.actions} />
        <div className="px-4 py-6">{children}</div>
      </div>
    </div>
  );
}
