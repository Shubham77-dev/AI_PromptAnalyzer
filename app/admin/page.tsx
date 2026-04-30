import { prisma } from "@/lib/prisma";
import { StatCard } from "@/components/ui/StatCard";
import { Card } from "@/components/ui/Card";

function Bar({ value, total, label }: Readonly<{ value: number; total: number; label: string }>) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0;
  return (
    <div className="grid gap-1">
      <div className="flex items-center justify-between" style={{ fontSize: 11, color: "var(--pa-muted)" }}>
        <span>{label}</span>
        <span>{pct}%</span>
      </div>
      <div className="overflow-hidden rounded-full" style={{ height: 8, background: "var(--pa-hint)" }}>
        <div className="h-full rounded-full" style={{ width: `${pct}%`, background: "var(--pa-acc3)" }} />
      </div>
    </div>
  );
}

export default async function AdminDashboardPage() {
  const [totalUsers, totalPrompts, publishedPrompts, flaggedPrompts, recentUsers, planCounts] =
    await Promise.all([
      prisma.user.count(),
      prisma.prompt.count(),
      prisma.prompt.count({ where: { status: "PUBLISHED" } }),
      prisma.prompt.count({ where: { flagged: true } }),
      prisma.user.findMany({
        orderBy: { createdAt: "desc" },
        take: 8,
        select: { id: true, email: true, createdAt: true, plan: true },
      }),
      prisma.user.groupBy({
        by: ["plan"],
        _count: { _all: true },
      }),
    ]);

  const totalPlans = planCounts.reduce((acc, c) => acc + c._count._all, 0);
  const planByKey = new Map(planCounts.map((c) => [c.plan, c._count._all]));

  const recentActivity = await prisma.prompt.findMany({
    orderBy: { updatedAt: "desc" },
    take: 10,
    select: {
      id: true,
      status: true,
      flagged: true,
      updatedAt: true,
      user: { select: { email: true } },
    },
  });

  return (
    <div className="grid gap-6">
      <div className="grid gap-3 md:grid-cols-4">
        <StatCard label="Total users" value={totalUsers} sub="All profiles" accentColor="var(--pa-acc1)" />
        <StatCard label="Prompts analyzed" value={totalPrompts} sub="Prompts created" accentColor="var(--pa-acc2)" />
        <StatCard label="Published" value={publishedPrompts} sub="Visible in library" accentColor="var(--pa-acc3)" />
        <StatCard
          label="Flagged"
          value={flaggedPrompts}
          sub="Needs review"
          accentColor="var(--pa-acc4)"
          subColor="var(--pa-acc3)"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <div className="p-4">
            <div style={{ fontSize: 13, fontWeight: 600, color: "var(--pa-text)" }}>Recent signups</div>
            <div className="mt-3 grid gap-2">
              {recentUsers.map((u) => (
                <div
                  key={u.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-lg px-3 py-2"
                  style={{ background: "var(--pa-hint)" }}
                >
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium" style={{ color: "var(--pa-text)" }}>
                      {u.email}
                    </div>
                    <div style={{ fontSize: 11, color: "var(--pa-muted)" }}>{u.createdAt.toISOString().slice(0, 10)}</div>
                  </div>
                  <span
                    className="shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold"
                    style={{
                      background: "var(--pa-card)",
                      color: "var(--pa-text)",
                      border: "1px solid var(--pa-card-border)",
                    }}
                  >
                    {u.plan}
                  </span>
                </div>
              ))}
              {recentUsers.length === 0 ? (
                <div style={{ fontSize: 11, color: "var(--pa-muted)" }}>No signups yet.</div>
              ) : null}
            </div>
          </div>
        </Card>

        <Card className="lg:col-span-1">
          <div className="p-4">
            <div style={{ fontSize: 13, fontWeight: 600, color: "var(--pa-text)" }}>Activity feed</div>
            <div className="mt-3 grid gap-2">
              {recentActivity.map((a) => (
                <div
                  key={a.id}
                  className="flex items-center justify-between gap-3 rounded-lg px-3 py-2"
                  style={{ background: "var(--pa-hint)" }}
                >
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium" style={{ color: "var(--pa-text)" }}>
                      {a.user.email}
                    </div>
                    <div style={{ fontSize: 11, color: "var(--pa-muted)" }}>
                      {a.status}
                      {a.flagged ? " • flagged" : ""} · {a.updatedAt.toISOString().slice(0, 19).replace("T", " ")}
                    </div>
                  </div>
                  <a
                    href={`/admin/prompts?view=${encodeURIComponent(a.id)}`}
                    className="rounded-lg px-2.5 py-1.5 text-xs font-semibold"
                    style={{
                      border: "1px solid var(--pa-card-border)",
                      background: "var(--pa-card)",
                      color: "var(--pa-text)",
                    }}
                  >
                    View
                  </a>
                </div>
              ))}
              {recentActivity.length === 0 ? (
                <div style={{ fontSize: 11, color: "var(--pa-muted)" }}>No activity yet.</div>
              ) : null}
            </div>
          </div>
        </Card>

        <Card className="lg:col-span-1">
          <div className="p-4">
            <div style={{ fontSize: 13, fontWeight: 600, color: "var(--pa-text)" }}>Plan distribution</div>
            <div className="mt-3 grid gap-3">
              <Bar label="Free" value={planByKey.get("FREE") ?? 0} total={totalPlans} />
              <Bar label="Pro" value={planByKey.get("PRO") ?? 0} total={totalPlans} />
              <Bar label="Enterprise" value={planByKey.get("ENTERPRISE") ?? 0} total={totalPlans} />
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
