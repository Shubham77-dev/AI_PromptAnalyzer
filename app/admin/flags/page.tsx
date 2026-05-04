import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { CardHeader } from "@/components/ui/CardHeader";
import { MiniStat } from "@/components/ui/MiniStat";
import { FlagReviewCard, type FlagKind } from "@/components/admin/FlagReviewCard";
import { PageMeta } from "@/components/layout/PageMeta";

function scoreFor(p: { score: number | null; analysis: { accuracy: number } | null }) {
  if (typeof p.score === "number" && Number.isFinite(p.score)) return Math.round(p.score);
  return p.analysis?.accuracy ?? null;
}

function classify(p: { flagged: boolean; reason: string | null; score: number | null; analysis: { accuracy: number } | null }): FlagKind {
  const reason = (p.reason ?? "").toLowerCase();
  if (p.flagged && (reason.includes("rate") || reason.includes("abuse") || reason.includes("scrap"))) return "abuse";
  const s = scoreFor(p);
  if (typeof s === "number" && s >= 40 && s < 55) return "ambiguous";
  return "low";
}

export default async function AdminFlagsPage() {
  const prompts = await prisma.prompt.findMany({
    where: {
      status: "PUBLISHED",
      OR: [{ flagged: true }, { score: { lt: 40 } }, { analysis: { accuracy: { lt: 40 } } }],
    },
    orderBy: [{ flagged: "desc" }, { updatedAt: "desc" }],
    take: 30,
    select: {
      id: true,
      content: true,
      flagged: true,
      reason: true,
      score: true,
      userId: true,
      user: { select: { email: true } },
      analysis: { select: { accuracy: true } },
    },
  });

  const flagged = prompts.length;
  const abuse = prompts.filter((p) => classify(p) === "abuse").length;

  return (
    <div className="grid gap-3">
      <PageMeta title="Flagged" />
      <div className="grid grid-cols-3 gap-2.5">
        <MiniStat value={String(flagged)} label="Flagged" valueColor="var(--pa-acc3)" />
        <MiniStat value="0" label="Resolved" valueColor="var(--pa-acc2)" />
        <MiniStat value={String(abuse)} label="Abuse" valueColor="var(--pa-acc4)" />
      </div>

      <div className="pa-card overflow-hidden">
        <CardHeader
          title="Review queue"
          right={
            <span
              className="pa-score-pill"
              style={{
                background: "color-mix(in srgb, var(--pa-acc4) 15%, transparent)",
                color: "var(--pa-acc4)",
                border: "1px solid color-mix(in srgb, var(--pa-acc4) 30%, transparent)",
              }}
            >
              {Math.min(99, flagged)} pending
            </span>
          }
        />
        <div className="divide-y" style={{ borderColor: "var(--pa-card-border)" }}>
          {prompts.map((p) => (
            <FlagReviewCard
              key={p.id}
              promptId={p.id}
              userId={p.userId}
              email={p.user.email}
              content={p.content}
              score={scoreFor(p)}
              kind={classify(p)}
            />
          ))}
        </div>
        {prompts.length === 0 ? (
          <div className="px-3.5 py-6 text-center text-xs" style={{ color: "var(--pa-muted)" }}>
            Nothing to review right now.{" "}
            <Link href="/admin/prompts" style={{ color: "var(--pa-acc1)" }} className="underline">
              Back to prompts
            </Link>
          </div>
        ) : null}
      </div>
    </div>
  );
}
