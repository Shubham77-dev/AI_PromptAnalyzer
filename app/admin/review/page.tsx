import { prisma } from "@/lib/prisma";
import { PageMeta } from "@/components/layout/PageMeta";
import { ReviewQueueWorkspace } from "@/components/admin/ReviewQueueWorkspace";
import { parseStoredDimensions } from "@/lib/prompt-display-score";
import type { AdminReviewPrompt, ReviewTab } from "@/lib/admin/review-types";

const PROMPT_SELECT = {
  id: true,
  content: true,
  score: true,
  promptTypeLabel: true,
  maturityLevel: true,
  qualityDimensions: true,
  moderationStatus: true,
  status: true,
  reason: true,
  rejectReason: true,
  flags: true,
  createdAt: true,
  updatedAt: true,
  reviewedAt: true,
  user: { select: { email: true, name: true } },
} as const;

function serializePrompt(p: {
  id: string;
  content: string;
  score: number | null;
  promptTypeLabel: string | null;
  maturityLevel: string | null;
  qualityDimensions: unknown;
  moderationStatus: "APPROVED" | "PENDING" | "REJECTED";
  status: "DRAFT" | "PUBLISHED" | "UNDER_REVIEW";
  reason: string | null;
  rejectReason: string | null;
  flags: string[];
  createdAt: Date;
  updatedAt: Date;
  reviewedAt: Date | null;
  user: { email: string; name: string | null };
}): AdminReviewPrompt {
  return {
    id: p.id,
    content: p.content,
    score: p.score,
    promptTypeLabel: p.promptTypeLabel,
    maturityLevel: p.maturityLevel,
    qualityDimensions: parseStoredDimensions(p.qualityDimensions),
    moderationStatus: p.moderationStatus,
    status: p.status,
    reason: p.reason,
    rejectReason: p.rejectReason,
    flags: p.flags,
    createdAt: p.createdAt.toISOString(),
    updatedAt: p.updatedAt.toISOString(),
    reviewedAt: p.reviewedAt?.toISOString() ?? null,
    user: p.user,
  };
}

export default async function AdminReviewPage({
  searchParams,
}: Readonly<{
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}>) {
  const sp = await searchParams;
  const tabRaw = Array.isArray(sp.tab) ? sp.tab[0] : sp.tab;
  const initialTab: ReviewTab =
    tabRaw === "published" || tabRaw === "rejected" ? tabRaw : "pending";

  const [rows, pendingCount, publishedCount, rejectedCount] = await Promise.all([
    prisma.prompt.findMany({
      where: {
        OR: [
          { moderationStatus: "PENDING" },
          { moderationStatus: "APPROVED", status: "PUBLISHED" },
          { moderationStatus: "REJECTED" },
        ],
      },
      orderBy: { createdAt: "desc" },
      take: 200,
      select: PROMPT_SELECT,
    }),
    prisma.prompt.count({ where: { moderationStatus: "PENDING" } }),
    prisma.prompt.count({ where: { moderationStatus: "APPROVED", status: "PUBLISHED" } }),
    prisma.prompt.count({ where: { moderationStatus: "REJECTED" } }),
  ]);

  const prompts = rows.map(serializePrompt);

  return (
    <div className="grid gap-4">
      <PageMeta title="Review queue" />
      <p style={{ fontSize: 12, color: "var(--pa-muted)", lineHeight: 1.5 }}>
        Review submitted prompts, inspect quality scores, and publish or reject with optional feedback.
      </p>
      <ReviewQueueWorkspace
        prompts={prompts}
        counts={{ pending: pendingCount, published: publishedCount, rejected: rejectedCount }}
        initialTab={initialTab}
      />
    </div>
  );
}
