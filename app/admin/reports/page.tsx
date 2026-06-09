import { prisma } from "@/lib/prisma";
import { GlowLine } from "@/components/ui/GlowLine";
import { StatCard } from "@/components/ui/StatCard";
import { Card } from "@/components/ui/Card";
import { UserAvatar } from "@/components/ui/UserAvatar";
import { PageMeta } from "@/components/layout/PageMeta";

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

function initials(email: string) {
  const name = email.split("@")[0] ?? email;
  const a = name[0] ?? "U";
  const b = name[1] ?? "";
  return (a + b).toUpperCase();
}

function labelFromEmail(email: string) {
  const local = email.split("@")[0] ?? email;
  return local.replace(/[._]/g, " ").trim() || email;
}

export default async function AdminReportsPage() {
  const today = startOfDay(new Date());
  const from = addDays(today, -6);
  const to = addDays(today, 1);

  // We don't have createdAt on PromptAnalysis; approximate "analyses" by prompts that have analysis + were updated recently.
  const analyzedPrompts = await prisma.prompt.findMany({
    where: { updatedAt: { gte: from, lt: to }, analysis: { isNot: null } },
    select: {
      updatedAt: true,
      score: true,
      flagged: true,
      analysis: { select: { accuracy: true, clarity: true } },
      userId: true,
    },
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

  const avgScore = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
  const activeUsers = new Set(analyzedPrompts.map((p) => p.userId)).size;
  const flaggedCount = analyzedPrompts.filter((p) => p.flagged).length;
  const flagRate = analyzedPrompts.length ? Math.round((flaggedCount / analyzedPrompts.length) * 100) : 0;

  const topUserIds = await prisma.prompt.groupBy({
    by: ["userId"],
    _count: { _all: true },
    orderBy: { _count: { id: "desc" } },
    take: 8,
  });
  const users = await prisma.user.findMany({
    where: { id: { in: topUserIds.map((u) => u.userId) } },
    select: { id: true, email: true },
  });
  const emailById = new Map(users.map((u) => [u.id, u.email]));

  const scoreByUser = new Map<string, number[]>();
  for (const p of analyzedPrompts) {
    const s =
      typeof p.score === "number" && Number.isFinite(p.score) ? p.score : p.analysis?.accuracy ?? p.analysis?.clarity ?? null;
    if (s == null) continue;
    const arr = scoreByUser.get(p.userId) ?? [];
    arr.push(clamp(Math.round(s)));
    scoreByUser.set(p.userId, arr);
  }

  return (
    <div className="grid gap-6">
      <PageMeta title="Reports & analytics" />
      <GlowLine />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Daily analyses"
          value={analyzedPrompts.length}
          sub="Last 7 days"
          accentColor="var(--pa-acc1)"
          subColor="var(--pa-muted)"
        />
        <StatCard
          label="Avg score"
          value={avgScore}
          sub={scores.length ? "Across analyzed prompts" : "No scores yet"}
          accentColor="var(--pa-acc2)"
          subColor="var(--pa-muted)"
        />
        <StatCard
          label="Active users"
          value={activeUsers}
          sub="7-day window"
          accentColor="var(--pa-acc4)"
          subColor="var(--pa-muted)"
        />
        <StatCard
          label="Flag rate"
          value={`${flagRate}%`}
          sub={`${flaggedCount} flagged`}
          accentColor="var(--pa-acc3)"
          subColor="var(--pa-muted)"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="p-4">
          <div className="text-sm font-semibold" style={{ color: "var(--pa-text)" }}>
            Usage trend
          </div>
          <div className="mt-3 grid grid-cols-7 items-end gap-2">
            {buckets.map((b) => {
              const h = Math.max(6, Math.round((b.count / maxCount) * 120));
              return (
                <div key={b.day} className="grid justify-items-center gap-2">
                  <div
                    className="w-full"
                    style={{
                      height: h,
                      borderRadius: 10,
                      background: "color-mix(in srgb, var(--pa-acc1) 55%, transparent)",
                      border: "1px solid color-mix(in srgb, var(--pa-acc1) 35%, transparent)",
                    }}
                  />
                  <div style={{ fontSize: 10, fontWeight: 500, color: "var(--pa-muted)" }}>{b.day.slice(5)}</div>
                </div>
              );
            })}
          </div>
          <div className="mt-3" style={{ fontSize: 10, color: "var(--pa-muted)" }}>
            Counts reflect analyzed prompts updated per day.
          </div>
        </Card>

        <Card className="p-4">
          <div className="text-sm font-semibold" style={{ color: "var(--pa-text)" }}>
            Score distribution
          </div>
          <div className="mt-3 grid gap-2">
            {scoreDist.map((b) => {
              const total = Math.max(1, scores.length);
              const pct = Math.round((b.count / total) * 100);
              return (
                <div key={b.label} className="grid gap-1">
                  <div className="flex items-center justify-between" style={{ fontSize: 11, color: "var(--pa-muted)" }}>
                    <span>{b.label}</span>
                    <span>
                      {b.count} ({pct}%)
                    </span>
                  </div>
                  <div
                    className="h-2 overflow-hidden rounded-full"
                    style={{ background: "var(--pa-hint)", border: "1px solid var(--pa-card-border)" }}
                  >
                    <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundImage: "var(--pa-grad)" }} />
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        <Card className="p-4">
          <div className="text-sm font-semibold" style={{ color: "var(--pa-text)" }}>
            Top users
          </div>
          <div className="mt-3 grid gap-2">
            {topUserIds.map((u) => {
              const email = emailById.get(u.userId) ?? u.userId;
              const arr = scoreByUser.get(u.userId) ?? [];
              const avg = arr.length ? Math.round(arr.reduce((a, b) => a + b, 0) / arr.length) : null;
              return (
                <div
                  key={u.userId}
                  className="flex items-center justify-between gap-3 rounded-xl px-3 py-2"
                  style={{ background: "var(--pa-hint)", border: "1px solid var(--pa-card-border)" }}
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <UserAvatar initials={initials(email)} size="sm" />
                    <div className="min-w-0">
                      <div className="truncate" style={{ fontSize: 11, fontWeight: 500, color: "var(--pa-text)" }}>
                        {labelFromEmail(email)}
                      </div>
                      <div className="truncate" style={{ fontSize: 10, color: "var(--pa-muted)" }}>
                        {email}
                      </div>
                    </div>
                  </div>
                  <div className="shrink-0 text-right">
                    <div style={{ fontSize: 12, fontWeight: 600, color: "var(--pa-text)" }}>{avg ?? "—"}</div>
                    <div style={{ fontSize: 10, color: "var(--pa-muted)" }}>Score</div>
                  </div>
                </div>
              );
            })}
            {topUserIds.length === 0 ? <div style={{ fontSize: 12, color: "var(--pa-muted)" }}>No data yet.</div> : null}
          </div>
        </Card>
      </div>
    </div>
  );
}

