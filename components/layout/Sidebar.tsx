"use client";

import { useMemo, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Settings } from "lucide-react";
import { SidebarNavItem } from "@/components/layout/SidebarNavItem";
import { requireAuth } from "@/app/_lib/auth-guard";
import { useAuth } from "@/components/auth/AuthProvider";
import { ThemeSwitcher } from "@/components/ui/ThemeSwitcher";
import { UserAvatar } from "@/components/ui/UserAvatar";

export interface SidebarProps {
  activePath: string;
  userEmail: string | null;
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
  const a = name[0] ?? "U";
  const b = name[1] ?? "";
  return (a + b).toUpperCase();
}

export function Sidebar({ activePath, userEmail }: Readonly<SidebarProps>) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const { refresh } = useAuth();

  const avatar = useMemo(() => (userEmail ? initials(userEmail) : "G"), [userEmail]);

  async function goProtected(href: string) {
    await requireAuth(() => router.push(href), { router });
  }

  async function signOut() {
    await fetch("/api/auth/logout", { method: "POST" }).catch(() => null);
    globalThis.localStorage?.removeItem("pl_token");
    globalThis.dispatchEvent(new Event("auth-changed"));
    await refresh();
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
        <span className="hidden text-[15px] font-medium md:block" style={{ color: "var(--pa-text)" }}>
          PromptAnalyzer
        </span>
      </div>

      <nav className="flex-1 overflow-auto p-2">
        <div className="grid gap-1">
          <SidebarNavItem
            href="/"
            label="Home"
            active={activePath === "/"}
            icon={<Icon d="M4 4h7v7H4V4zm9 0h7v7h-7V4zM4 13h7v7H4v-7zm9 0h7v7h-7v-7z" />}
          />
          <SidebarNavItem
            href="/upload"
            label="Upload"
            active={activePath.startsWith("/upload")}
            icon={<Icon d="M12 3l4 4h-3v7h-2V7H8l4-4zm-7 14h14v2H5v-2z" />}
            onClick={userEmail ? undefined : () => void goProtected("/upload")}
          />
          <SidebarNavItem
            href="/dashboard"
            label="Dashboard"
            active={activePath.startsWith("/dashboard")}
            icon={<Icon d="M4 19h16v2H4v-2zM6 10h3v7H6v-7zm5-4h3v11h-3V6zm5 7h3v4h-3v-4z" />}
            onClick={userEmail ? undefined : () => void goProtected("/dashboard")}
          />
          <SidebarNavItem
            href="/library"
            label="Library"
            active={activePath.startsWith("/library")}
            icon={<Icon d="M6 6h14v2H6V6zM6 11h14v2H6v-2zM6 16h14v2H6v-2zM4 6h1v2H4V6zm0 5h1v2H4v-2zm0 5h1v2H4v-2z" />}
          />
          <SidebarNavItem
            href="/settings"
            label="Settings"
            active={activePath.startsWith("/settings")}
            icon={<Settings className="h-4 w-4" aria-hidden />}
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
                  onClick={signOut}
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
