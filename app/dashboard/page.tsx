import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { formatDateTimeStable } from "@/lib/format-date";
import { effectiveDisplayScore } from "@/lib/prompt-display-score";
import { prisma } from "@/lib/prisma";
import { DeleteButton } from "@/app/_components/DeleteButton";
import { SuggestionClamp } from "@/app/_components/SuggestionClamp";
import { PageMeta } from "@/components/layout/PageMeta";
import { DashboardMetaActions } from "@/components/dashboard/DashboardMetaActions";
import { GlowLine } from "@/components/ui/GlowLine";
import { ScoreBar } from "@/components/ui/ScoreBar";
import { ScoreRing } from "@/components/ui/ScoreRing";
import { StatCard } from "@/components/ui/StatCard";
import { Card } from "@/components/ui/Card";
import { SeeMoreText } from "@/components/ui/SeeMoreText";

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?callbackUrl=/dashboard");

  const isAdmin = user.role === "ADMIN";

  const prompts = await prisma.prompt
    .findMany({
      where: isAdmin
        ? {
            OR: [{ status: "UNDER_REVIEW" }, { moderationStatus: "PENDING" }],
          }
        : { userId: user.id },
      orderBy: { createdAt: "desc" },
      include: isAdmin
        ? { analysis: true, stats: true, user: { select: { email: true } } }
        : { analysis: true, stats: true },
    })
    .catch(() => null);

  const list = prompts ?? [];
  const weekMs = 7 * 86400000;
  const now = Date.now();
  const weekCount = list.filter((p) => now - +p.createdAt <= weekMs).length;

  const scored = list.filter((p) => p.analysis);
  const avgRound =
    scored.length === 0
      ? 0
      : Math.round(
          scored.reduce((a, p) => a + (p.analysis!.accuracy + p.analysis!.clarity) / 2, 0) / scored.length,
        );

  const saves = list.filter((p) => p.status === "PUBLISHED").length;
  const issuesFound = list.filter(
    (p) => p.analysis && (p.analysis.accuracy + p.analysis.clarity) / 2 < 60,
  ).length;

  const latest = list.find((p) => p.analysis) ?? null;
  const la = latest?.analysis;

  return (
    <div className="mx-auto w-full max-w-5xl">
      <PageMeta title="Dashboard" actions={<DashboardMetaActions />} />

      <GlowLine />

      <div className="mb-3.5 grid gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Prompts analyzed" value={list.length} sub={`+${weekCount} this week`} accentColor="var(--pa-acc1)" />
        <StatCard label="Avg. score" value={avgRound} sub="out of 100" accentColor="var(--pa-acc2)" />
        <StatCard label="Library saves" value={saves} sub="published" accentColor="var(--pa-acc3)" />
        <StatCard label="Issues found" value={issuesFound} sub="below 60 avg" accentColor="var(--pa-acc4)" />
      </div>

      <div className="mb-6 grid gap-3 lg:grid-cols-2">
        <Card>
          <div className="p-4">
            <div style={{ fontSize: 10, fontWeight: 500, textTransform: "uppercase", color: "var(--pa-muted)" }}>
              Score breakdown (latest)
            </div>
            {la ? (
              <>
                <div className="mt-3 flex justify-center">
                  <ScoreRing score={Math.round((la.accuracy + la.clarity) / 2)} />
                </div>
                <div className="mt-3 grid gap-1">
                  <ScoreBar label="Accuracy" value={la.accuracy} color="var(--pa-acc1)" />
                  <ScoreBar label="Clarity" value={la.clarity} color="var(--pa-acc2)" />
                </div>
              </>
            ) : (
              <div className="mt-3" style={{ fontSize: 11, color: "var(--pa-muted)" }}>
                No analyzed prompt yet.
              </div>
            )}
          </div>
        </Card>
        <Card>
          <div className="p-4">
            <div style={{ fontSize: 10, fontWeight: 500, textTransform: "uppercase", color: "var(--pa-muted)" }}>
              Recent activity
            </div>
            <div className="mt-3 grid gap-2">
              {list.slice(0, 8).map((p) => (
                <div key={p.id} className="flex items-center gap-2 rounded-lg px-2 py-2" style={{ background: "var(--pa-hint)" }}>
                  <div
                    className="grid h-[26px] w-[26px] shrink-0 place-items-center rounded-lg"
                    style={{ background: "var(--pa-hint)", color: "var(--pa-muted)" }}
                  >
                    <svg width={12} height={12} viewBox="0 0 24 24" aria-hidden>
                      <path d="M4 6h16v2H4V6zm0 5h16v2H4v-2zm0 5h10v2H4v-2z" fill="currentColor" />
                    </svg>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate" style={{ fontSize: 11, color: "var(--pa-text)" }}>
                      {p.content.trim().slice(0, 48) || "—"}
                    </div>
                    <div style={{ fontSize: 10, color: "var(--pa-muted)" }}>
                      {p.status.toLowerCase()}
                      {isAdmin && "user" in p ? ` · ${(p as { user?: { email?: string } }).user?.email ?? ""}` : ""}
                    </div>
                  </div>
                  <span className="shrink-0" style={{ fontSize: 10, color: "var(--pa-muted)" }}>
                    {p.createdAt.toISOString().slice(0, 10)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </Card>
      </div>

      <div className="mb-4">
        <p className="text-sm" style={{ color: "var(--pa-muted)" }}>
          {isAdmin
            ? "Admin view: prompts needing moderation and recent drafts."
            : "Your saved prompts and AI ratings."}
        </p>
      </div>

      <div id="your-prompts" className="grid gap-4">
        {prompts === null ? (
          <div className="rounded-xl p-6" style={{ border: "1px solid var(--pa-card-border)", background: "var(--pa-card)" }}>
            <span style={{ color: "var(--pa-muted)" }}>Database not reachable.</span>
          </div>
        ) : null}

        {prompts?.length === 0 ? (
          <div className="rounded-xl p-6" style={{ border: "1px solid var(--pa-card-border)", background: "var(--pa-card)" }}>
            <span style={{ color: "var(--pa-muted)" }}>
              {isAdmin ? "No prompts waiting for review." : "No prompts yet. Create one from the upload page."}
            </span>
          </div>
        ) : null}

        {prompts?.map((p) => {
          const hasAnalysis = !!p.analysis;
          const moderation = p.moderationStatus;
          const isPublished = moderation === "APPROVED" && p.status === "PUBLISHED";
          const isPending = moderation === "PENDING";
          const isRejected = moderation === "REJECTED";
          return (
            <div
              key={p.id}
              className="rounded-xl p-6"
              style={{ border: "1px solid var(--pa-card-border)", background: "var(--pa-card)" }}
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className="rounded-full px-2 py-0.5 text-xs font-medium"
                      style={{ background: "var(--pa-hint)", color: "var(--pa-text)" }}
                    >
                      {moderation.toLowerCase()}
                    </span>
                    {isAdmin && "user" in p ? (
                      <span style={{ fontSize: 11, color: "var(--pa-muted)" }}>
                        Owner: {(p as { user?: { email?: string } }).user?.email ?? "—"}
                      </span>
                    ) : null}
                    <span style={{ fontSize: 11, color: "var(--pa-muted)" }}>
                      {formatDateTimeStable(p.createdAt)}
                    </span>
                    {p.stats ? (
                      <span style={{ fontSize: 11, color: "var(--pa-muted)" }}>Likes: {p.stats.likes}</span>
                    ) : null}
                  </div>

                  <SeeMoreText
                    text={p.content}
                    collapsedMaxHeightPx={160}
                    className="mt-3"
                    contentClassName="rounded-xl p-3 font-mono text-sm"
                    contentStyle={{
                      border: "1px solid var(--pa-card-border)",
                      background: "var(--pa-bg)",
                      color: "var(--pa-text)",
                    }}
                  />

                  <div className="mt-4 grid gap-3 sm:grid-cols-3">
                    <div className="rounded-xl p-3" style={{ border: "1px solid var(--pa-card-border)" }}>
                      <div style={{ fontSize: 11, fontWeight: 500, textTransform: "uppercase", color: "var(--pa-muted)" }}>
                        Score
                      </div>
                      <div className="mt-1 text-lg font-medium" style={{ color: "var(--pa-text)" }}>
                        {effectiveDisplayScore(p) ?? "—"}
                      </div>
                    </div>
                    <div className="rounded-xl p-3" style={{ border: "1px solid var(--pa-card-border)" }}>
                      <div style={{ fontSize: 11, fontWeight: 500, textTransform: "uppercase", color: "var(--pa-muted)" }}>
                        Clarity
                      </div>
                      <div className="mt-1 text-lg font-medium" style={{ color: "var(--pa-text)" }}>
                        {hasAnalysis ? p.analysis!.clarity : "—"}
                      </div>
                    </div>
                    <div className="rounded-xl p-3" style={{ border: "1px solid var(--pa-card-border)" }}>
                      <div style={{ fontSize: 11, fontWeight: 500, textTransform: "uppercase", color: "var(--pa-muted)" }}>
                        Suggestions
                      </div>
                      <SuggestionClamp
                        text={hasAnalysis ? p.analysis!.suggestions : null}
                        placeholder="Analyze before publishing."
                      />
                    </div>
                  </div>
                </div>

                <div className="flex shrink-0 flex-col items-end gap-2">
                  {isPublished ? <span style={{ fontSize: 11, color: "var(--pa-muted)" }}>Published</span> : null}
                  {isPending ? (
                    <span style={{ fontSize: 11, fontWeight: 500, color: "var(--pa-acc4)" }}>In review</span>
                  ) : null}
                  {isRejected ? (
                    <div className="flex flex-col items-end gap-1">
                      <span style={{ fontSize: 11, fontWeight: 500, color: "var(--pa-acc3)" }}>Rejected</span>
                      {p.rejectReason ? (
                        <span style={{ fontSize: 10, color: "var(--pa-muted)", maxWidth: 220, textAlign: "right" }}>
                          Reason: {p.rejectReason}
                        </span>
                      ) : null}
                      {!isAdmin ? (
                        <Link href="/upload" style={{ fontSize: 11, fontWeight: 500, color: "var(--pa-acc1)" }}>
                          Edit and resubmit →
                        </Link>
                      ) : null}
                    </div>
                  ) : null}
                  <DeleteButton promptId={p.id} />
                  {!hasAnalysis && !isPublished ? (
                    <span style={{ fontSize: 11, color: "var(--pa-muted)" }}>Analysis not saved for this prompt.</span>
                  ) : null}
                  {isAdmin && (isPending || p.status === "UNDER_REVIEW") ? (
                    <Link href="/admin/review" style={{ fontSize: 11, fontWeight: 500, color: "var(--pa-acc1)" }}>
                      Review queue →
                    </Link>
                  ) : null}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
