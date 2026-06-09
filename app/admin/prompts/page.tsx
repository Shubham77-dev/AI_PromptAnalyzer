import type { CSSProperties } from "react";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { PromptTable } from "@/components/admin/PromptTable";
import type { AdminPromptsSearchParams } from "@/components/admin/PromptTable";
import { PromptDetailPanel } from "@/components/admin/PromptDetailPanel";
import { AdminPromptsTopActions } from "@/components/admin/AdminPromptsTopActions";
import { PageMeta } from "@/components/layout/PageMeta";
import { MiniStat } from "@/components/ui/MiniStat";
import { z } from "zod";

function tagStyle(active: boolean): CSSProperties {
  return {
    fontSize: 10,
    padding: "3px 10px",
    borderRadius: 20,
    border: active ? "1px solid var(--pa-acc1)" : "1px solid var(--pa-card-border)",
    color: active ? "var(--pa-acc1)" : "var(--pa-muted)",
    background: active ? "color-mix(in srgb, var(--pa-acc1) 10%, transparent)" : "transparent",
  };
}

export default async function AdminPromptsPage({
  searchParams,
}: Readonly<{
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}>) {
  const sp = await searchParams;
  const get = (k: string) => {
    const v = sp[k];
    return Array.isArray(v) ? v[0] : v;
  };

  const statusValue = get("status");
  const status: AdminPromptsSearchParams["status"] =
    statusValue === "PUBLISHED" || statusValue === "DRAFT" || statusValue === "UNDER_REVIEW" || statusValue === "all"
      ? statusValue
      : "all";

  const viewIdRaw = get("view");
  const viewId = viewIdRaw && z.string().uuid().safeParse(viewIdRaw).success ? viewIdRaw : null;

  const closeParams = new URLSearchParams();
  if (status !== "all") closeParams.set("status", status);
  const minScore = get("minScore");
  const maxScore = get("maxScore");
  const page = get("page");
  if (minScore) closeParams.set("minScore", minScore);
  if (maxScore) closeParams.set("maxScore", maxScore);
  if (page) closeParams.set("page", page);
  const closeHref = `/admin/prompts${closeParams.toString() ? `?${closeParams.toString()}` : ""}`;

  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const [published, avgRow, flaggedToday] = await Promise.all([
    prisma.prompt.count({ where: { status: "PUBLISHED" } }),
    prisma.prompt.aggregate({
      where: { status: "PUBLISHED", score: { not: null } },
      _avg: { score: true },
    }),
    prisma.prompt.count({
      where: {
        status: "PUBLISHED",
        flagged: true,
        updatedAt: { gte: startOfDay },
      },
    }),
  ]);

  const avg = avgRow._avg.score;
  const avgLabel = typeof avg === "number" && Number.isFinite(avg) ? avg.toFixed(1) : "—";

  const activeAll = !minScore && !maxScore;
  const activeHigh = minScore === "80";
  const activeLow = maxScore === "49";

  return (
    <div className="grid gap-3">
      <PageMeta title="All prompts" actions={<AdminPromptsTopActions />} />

      {viewId ? <PromptDetailPanel promptId={viewId} closeHref={closeHref} /> : null}

      <div className="mb-3 grid grid-cols-3 gap-2.5">
        <MiniStat value={new Intl.NumberFormat("en-US").format(published)} label="Total published" valueColor="var(--pa-acc1)" />
        <MiniStat value={avgLabel} label="Avg score" valueColor="var(--pa-acc2)" />
        <MiniStat value={String(flaggedToday)} label="Flagged today" valueColor="var(--pa-acc3)" />
      </div>

      <div className="mb-3 flex flex-wrap items-center gap-2">
        <Link href="/admin/prompts" style={tagStyle(activeAll)}>
          All
        </Link>
        <Link href="/admin/prompts?minScore=80&status=PUBLISHED" style={tagStyle(activeHigh)}>
          High score (80+)
        </Link>
        <Link href="/admin/prompts?maxScore=49&status=PUBLISHED" style={tagStyle(activeLow)}>
          Low score (&lt;50)
        </Link>
        <span style={tagStyle(false)} className="cursor-not-allowed opacity-50" title="Sorting is not available in this build">
          Most liked
        </span>
        <span style={tagStyle(false)} className="cursor-not-allowed opacity-50" title="Use the Flagged queue">
          Flagged
        </span>
      </div>

      <PromptTable
        searchParams={{
          status,
          minScore: get("minScore"),
          maxScore: get("maxScore"),
          page: get("page"),
        }}
      />
    </div>
  );
}
