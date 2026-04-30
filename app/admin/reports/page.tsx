import { prisma } from "@/lib/prisma";

function startOfDay(d: Date) {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

function addDays(d: Date, days: number) {
  const copy = new Date(d.getTime());
  copy.setUTCDate(copy.getUTCDate() + days);
  return copy;
}

function dayKey(d: Date) {
  return d.toISOString().slice(0, 10);
}

function clamp(n: number, min = 0, max = 100) {
  return Math.max(min, Math.min(max, n));
}

export default async function AdminReportsPage() {
  const today = startOfDay(new Date());
  const from = addDays(today, -6);
  const to = addDays(today, 1);

  // We don't have createdAt on PromptAnalysis; approximate "analyses" by prompts that have analysis + were updated recently.
  const analyzedPrompts = await prisma.prompt.findMany({
    where: { updatedAt: { gte: from, lt: to }, analysis: { isNot: null } },
    select: { updatedAt: true, score: true, analysis: { select: { accuracy: true, clarity: true } }, userId: true },
  });

  const buckets = Array.from({ length: 7 }, (_, i) => {
    const d = addDays(from, i);
    return { day: dayKey(d), count: 0 };
  });
  const indexByDay = new Map(buckets.map((b, i) => [b.day, i]));

  for (const p of analyzedPrompts) {
    const k = dayKey(startOfDay(p.updatedAt));
    const idx = indexByDay.get(k);
    if (idx != null) buckets[idx]!.count += 1;
  }

  const maxCount = Math.max(1, ...buckets.map((b) => b.count));

  const scores = analyzedPrompts
    .map((p) => {
      const s = typeof p.score === "number" && Number.isFinite(p.score) ? p.score : p.analysis?.accuracy ?? null;
      return s == null ? null : clamp(Math.round(s));
    })
    .filter((v): v is number => v != null);

  const scoreDist = [
    { label: "0–39", min: 0, max: 39, count: 0 },
    { label: "40–59", min: 40, max: 59, count: 0 },
    { label: "60–79", min: 60, max: 79, count: 0 },
    { label: "80–100", min: 80, max: 100, count: 0 },
  ];
  for (const s of scores) {
    const bucket = scoreDist.find((b) => s >= b.min && s <= b.max);
    if (bucket) bucket.count += 1;
  }

  const topUserIds = await prisma.prompt.groupBy({
    by: ["userId"],
    _count: { _all: true },
    orderBy: { _count: { userId: "desc" } },
    take: 8,
  });
  const users = await prisma.user.findMany({
    where: { id: { in: topUserIds.map((u) => u.userId) } },
    select: { id: true, email: true },
  });
  const emailById = new Map(users.map((u) => [u.id, u.email]));

  return (
    <div className="grid gap-6">
      <div className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-black/10">
        <div className="text-sm font-semibold text-gray-900">7-day analyses</div>
        <div className="mt-4 grid grid-cols-7 items-end gap-2">
          {buckets.map((b) => {
            const h = Math.max(6, Math.round((b.count / maxCount) * 120));
            return (
              <div key={b.day} className="grid justify-items-center gap-2">
                <div className="w-full rounded-lg bg-red-600/90 ring-1 ring-red-200" style={{ height: `${h}px` }} />
                <div className="text-[11px] font-medium text-gray-600">{b.day.slice(5)}</div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-black/10">
          <div className="text-sm font-semibold text-gray-900">Score distribution</div>
          <div className="mt-3 grid gap-2">
            {scoreDist.map((b) => {
              const total = Math.max(1, scores.length);
              const pct = Math.round((b.count / total) * 100);
              return (
                <div key={b.label} className="grid gap-1">
                  <div className="flex items-center justify-between text-xs text-gray-600">
                    <span>{b.label}</span>
                    <span>
                      {b.count} ({pct}%)
                    </span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-gray-100 ring-1 ring-black/10">
                    <div className="h-full rounded-full bg-red-600" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-black/10">
          <div className="text-sm font-semibold text-gray-900">Top active users</div>
          <div className="mt-3 grid gap-2">
            {topUserIds.map((u) => (
              <div key={u.userId} className="flex items-center justify-between gap-3 rounded-lg bg-gray-50 px-3 py-2">
                <div className="min-w-0">
                  <div className="truncate text-sm font-medium text-gray-900">
                    {emailById.get(u.userId) ?? u.userId}
                  </div>
                  <div className="text-xs text-gray-500">User ID: {u.userId}</div>
                </div>
                <span className="inline-flex items-center rounded-full bg-white px-2 py-0.5 text-[11px] font-semibold text-gray-700 ring-1 ring-black/10">
                  {u._count._all} prompts
                </span>
              </div>
            ))}
            {topUserIds.length === 0 ? <div className="text-sm text-gray-500">No data yet.</div> : null}
          </div>
        </div>
      </div>
    </div>
  );
}

