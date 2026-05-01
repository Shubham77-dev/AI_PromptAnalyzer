import type { CSSProperties } from "react";
import { prisma } from "@/lib/prisma";
import { adminSetUserRole, adminSuspendUser } from "@/app/admin/actions";
import { ButtonOutline } from "@/components/ui/ButtonOutline";
import { Card } from "@/components/ui/Card";
import { UserAvatar } from "@/components/ui/UserAvatar";

export type AdminUsersSearchParams = {
  q?: string;
  plan?: "FREE" | "PRO" | "ENTERPRISE" | "all";
  status?: "ACTIVE" | "SUSPENDED" | "all";
  page?: string;
  /** URL `flagged=1` — users with at least one flagged prompt */
  flagged?: string;
};

function initials(email: string) {
  const name = email.split("@")[0] ?? email;
  const a = name[0] ?? "U";
  const b = name[1] ?? "";
  return (a + b).toUpperCase();
}

function displayName(email: string) {
  const local = email.split("@")[0] ?? email;
  return local.replace(/[._]/g, " ").trim() || email;
}

function parsePage(page: string | undefined) {
  const n = Number(page ?? "1");
  if (!Number.isFinite(n) || n < 1) return 1;
  return Math.floor(n);
}

function fmtDate(d: Date) {
  return d.toISOString().slice(0, 10);
}

function listParams(sp: Readonly<AdminUsersSearchParams>, pageNum: number) {
  const p = new URLSearchParams();
  const qv = (sp.q ?? "").trim();
  if (qv) p.set("q", qv);
  if (sp.plan && sp.plan !== "all") p.set("plan", sp.plan);
  if (sp.status && sp.status !== "all") p.set("status", sp.status);
  if (sp.flagged === "1") p.set("flagged", "1");
  if (pageNum > 1) p.set("page", String(pageNum));
  return p;
}

function listHref(sp: Readonly<AdminUsersSearchParams>, pageNum: number) {
  const s = listParams(sp, pageNum).toString();
  return s ? `/admin/users?${s}` : "/admin/users";
}

function viewHref(sp: Readonly<AdminUsersSearchParams>, userId: string) {
  const p = listParams(sp, parsePage(sp.page));
  p.set("view", userId);
  return `/admin/users?${p.toString()}`;
}

export async function UserTable({ searchParams }: Readonly<{ searchParams: AdminUsersSearchParams }>) {
  const pageSize = 20;
  const page = parsePage(searchParams.page);
  const q = (searchParams.q ?? "").trim().toLowerCase();
  const plan = searchParams.plan ?? "all";
  const status = searchParams.status ?? "all";

  const where = {
    ...(q ? { email: { contains: q, mode: "insensitive" as const } } : null),
    ...(plan !== "all" ? { plan } : null),
    ...(status !== "all" ? { status } : null),
    ...(searchParams.flagged === "1" ? { prompts: { some: { flagged: true } } } : null),
  };

  const [total, users] = await Promise.all([
    prisma.user.count({ where }),
    prisma.user.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: pageSize,
      skip: (page - 1) * pageSize,
      select: { id: true, email: true, role: true, plan: true, status: true, createdAt: true },
    }),
  ]);

  const ids = users.map((u) => u.id);
  const [counts, flaggedRows] = await Promise.all([
    ids.length
      ? prisma.prompt.groupBy({
          by: ["userId"],
          _count: { _all: true },
          where: { userId: { in: ids } },
        })
      : Promise.resolve([]),
    ids.length
      ? prisma.prompt.findMany({
          where: { userId: { in: ids }, flagged: true },
          select: { userId: true },
          distinct: ["userId"],
        })
      : Promise.resolve([]),
  ]);

  const countByUserId = new Map<string, number>(counts.map((c) => [c.userId, c._count._all]));
  const flaggedSet = new Set(flaggedRows.map((r) => r.userId));
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const thStyle = { color: "var(--pa-muted)", fontSize: 10 } as const;
  const cellBorder = { borderBottom: "1px solid var(--pa-card-border)" } as const;

  return (
    <Card className="overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b px-4 py-3" style={cellBorder}>
        <div style={{ fontSize: 11, color: "var(--pa-muted)" }}>
          {total} users · page {page} / {totalPages}
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-[900px] w-full text-left">
          <thead>
            <tr style={{ background: "var(--pa-hint)" }}>
              {(["User", "Plan", "Prompts", "Joined", "Status", "Actions"] as const).map((label) => (
                <th key={label} className="px-4 py-2.5 font-semibold uppercase tracking-wide" style={thStyle}>
                  {label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {users.map((u) => {
              const promptCount = countByUserId.get(u.id) ?? 0;
              const isPro = u.plan === "PRO" || u.plan === "ENTERPRISE";
              const planPill = isPro
                ? {
                    background: "color-mix(in srgb, var(--pa-acc1) 16%, transparent)",
                    color: "var(--pa-acc1)",
                    border: "1px solid color-mix(in srgb, var(--pa-acc1) 35%, transparent)",
                  }
                : {
                    background: "var(--pa-hint)",
                    color: "var(--pa-muted)",
                    border: "1px solid var(--pa-card-border)",
                  };

              let statusLabel: string;
              let statusStyle: CSSProperties;
              if (u.status === "SUSPENDED") {
                statusLabel = "Suspended";
                statusStyle = {
                  background: "color-mix(in srgb, var(--pa-acc3) 14%, transparent)",
                  color: "var(--pa-acc3)",
                  border: "1px solid color-mix(in srgb, var(--pa-acc3) 35%, transparent)",
                };
              } else if (flaggedSet.has(u.id)) {
                statusLabel = "Flagged";
                statusStyle = {
                  background: "color-mix(in srgb, var(--pa-acc4) 14%, transparent)",
                  color: "var(--pa-acc4)",
                  border: "1px solid color-mix(in srgb, var(--pa-acc4) 35%, transparent)",
                };
              } else {
                statusLabel = "Active";
                statusStyle = {
                  background: "color-mix(in srgb, var(--pa-acc2) 14%, transparent)",
                  color: "var(--pa-acc2)",
                  border: "1px solid color-mix(in srgb, var(--pa-acc2) 35%, transparent)",
                };
              }

              return (
                <tr
                  key={u.id}
                  className="pa-transition hover:bg-[var(--pa-hint)]"
                  style={{ borderBottom: "1px solid var(--pa-card-border)" }}
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <UserAvatar initials={initials(u.email)} size="md" />
                      <div className="min-w-0">
                        <div className="truncate font-medium" style={{ fontSize: 11, color: "var(--pa-text)" }}>
                          {displayName(u.email)}
                        </div>
                        <div className="truncate" style={{ fontSize: 10, color: "var(--pa-muted)" }}>
                          {u.email}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className="inline-flex rounded-full px-2 py-0.5 font-semibold"
                      style={{ fontSize: 10, ...planPill }}
                    >
                      {u.plan === "ENTERPRISE" ? "Enterprise" : u.plan === "PRO" ? "Pro" : "Free"}
                    </span>
                  </td>
                  <td className="px-4 py-3" style={{ fontSize: 12, color: "var(--pa-text)" }}>
                    {promptCount}
                  </td>
                  <td className="px-4 py-3" style={{ fontSize: 12, color: "var(--pa-muted)" }}>
                    {fmtDate(u.createdAt)}
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-flex rounded-full px-2 py-0.5 font-semibold" style={{ fontSize: 10, ...statusStyle }}>
                      {statusLabel}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <ButtonOutline href={viewHref(searchParams, u.id)}>View</ButtonOutline>
                      <form action={adminSetUserRole} className="flex flex-wrap items-center gap-1">
                        <input type="hidden" name="userId" value={u.id} />
                        <select
                          name="role"
                          defaultValue={u.role}
                          className="pa-btn-transition rounded-lg px-2 py-1 font-semibold outline-none"
                          style={{
                            fontSize: 10,
                            border: "1px solid var(--pa-card-border)",
                            background: "var(--pa-card)",
                            color: "var(--pa-text)",
                          }}
                        >
                          <option value="USER">USER</option>
                          <option value="ADMIN">ADMIN</option>
                        </select>
                        <ButtonOutline type="submit">Save role</ButtonOutline>
                      </form>
                      <form action={adminSuspendUser}>
                        <input type="hidden" name="userId" value={u.id} />
                        <button type="submit" className="pa-admin-suspend">
                          Suspend
                        </button>
                      </form>
                    </div>
                  </td>
                </tr>
              );
            })}
            {users.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center" style={{ fontSize: 12, color: "var(--pa-muted)" }}>
                  No users found.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      <div
        className="flex items-center justify-between gap-2 px-4 py-3"
        style={{ borderTop: "1px solid var(--pa-card-border)" }}
      >
        <ButtonOutline href={page <= 1 ? undefined : listHref(searchParams, page - 1)} disabled={page <= 1}>
          Prev
        </ButtonOutline>
        <ButtonOutline
          href={page >= totalPages ? undefined : listHref(searchParams, page + 1)}
          disabled={page >= totalPages}
        >
          Next
        </ButtonOutline>
      </div>
    </Card>
  );
}
