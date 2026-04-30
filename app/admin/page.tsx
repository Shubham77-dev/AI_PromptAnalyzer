import { prisma } from "@/lib/prisma";
import { StatCard } from "@/components/admin/StatCard";

function Bar({ value, total, label }: Readonly<{ value: number; total: number; label: string }>) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0;
  return (
    <div className="grid gap-1">
      <div className="flex items-center justify-between text-xs text-gray-600">
        <span>{label}</span>
        <span>{pct}%</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-gray-100 ring-1 ring-black/10">
        <div className="h-full rounded-full bg-red-600" style={{ width: `${pct}%` }} />
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
        <StatCard title="Total users" value={totalUsers} description="All profiles" tone="neutral" />
        <StatCard title="Analyses" value={totalPrompts} description="Prompts created" tone="neutral" />
        <StatCard title="Published" value={publishedPrompts} description="Visible in library" tone="good" />
        <StatCard title="Flagged" value={flaggedPrompts} description="Needs review" tone="bad" />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-black/10 lg:col-span-1 overflow-hidden">
          <div className="text-sm font-semibold text-gray-900">Recent signups</div>
          <div className="mt-3 grid gap-2">
            {recentUsers.map((u) => (
              <div
                key={u.id}
                className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 rounded-lg bg-gray-50 px-3 py-2 overflow-hidden"
              >
                <div className="min-w-0 max-w-full">
                  <div className="break-all sm:break-normal sm:truncate text-sm font-medium text-gray-900">
                    {u.email}
                  </div>
                  <div className="text-xs text-gray-500">{u.createdAt.toISOString().slice(0, 10)}</div>
                </div>
                <span className="shrink-0 inline-flex items-center rounded-full bg-white px-2 py-0.5 text-[11px] font-semibold text-gray-700 ring-1 ring-black/10">
                  {u.plan}
                </span>
              </div>
            ))}
            {recentUsers.length === 0 ? <div className="text-sm text-gray-500">No signups yet.</div> : null}
          </div>
        </div>

        <div className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-black/10 lg:col-span-1">
          <div className="text-sm font-semibold text-gray-900">Activity feed</div>
          <div className="mt-3 grid gap-2">
            {recentActivity.map((a) => (
              <div key={a.id} className="flex items-center justify-between gap-3 rounded-lg bg-gray-50 px-3 py-2">
                <div className="min-w-0">
                  <div className="truncate text-sm font-medium text-gray-900">{a.user.email}</div>
                  <div className="text-xs text-gray-500">
                    {a.status}
                    {a.flagged ? " • flagged" : ""} • {a.updatedAt.toISOString().slice(0, 19).replace("T", " ")}
                  </div>
                </div>
                <a
                  href={`/admin/prompts?view=${encodeURIComponent(a.id)}`}
                  className="rounded-lg border border-black/10 bg-white px-2.5 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50"
                >
                  View
                </a>
              </div>
            ))}
            {recentActivity.length === 0 ? <div className="text-sm text-gray-500">No activity yet.</div> : null}
          </div>
        </div>

        <div className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-black/10 lg:col-span-1">
          <div className="text-sm font-semibold text-gray-900">Plan distribution</div>
          <div className="mt-3 grid gap-3">
            <Bar label="Free" value={planByKey.get("FREE") ?? 0} total={totalPlans} />
            <Bar label="Pro" value={planByKey.get("PRO") ?? 0} total={totalPlans} />
            <Bar label="Enterprise" value={planByKey.get("ENTERPRISE") ?? 0} total={totalPlans} />
          </div>
        </div>
      </div>
    </div>
  );
}

