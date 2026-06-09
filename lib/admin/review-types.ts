import type { StoredQualityDimensions } from "@/lib/prompt-display-score";

export type AdminReviewPrompt = {
  id: string;
  content: string;
  score: number | null;
  promptTypeLabel: string | null;
  maturityLevel: string | null;
  qualityDimensions: StoredQualityDimensions | null;
  moderationStatus: "APPROVED" | "PENDING" | "REJECTED";
  status: "DRAFT" | "PUBLISHED" | "UNDER_REVIEW";
  reason: string | null;
  rejectReason: string | null;
  flags: string[];
  createdAt: string;
  updatedAt: string;
  reviewedAt: string | null;
  user: { email: string; name: string | null };
};

export type ReviewTab = "pending" | "published" | "rejected";
export type ReviewSort = "newest" | "oldest" | "scoreHigh" | "scoreLow";
export type ReviewFilter = "all" | "noScore" | "low" | "mid" | "high";

export type ReviewCounts = {
  pending: number;
  published: number;
  rejected: number;
};

export function effectiveScoreForAdmin(prompt: Pick<AdminReviewPrompt, "score">): number | null {
  if (typeof prompt.score === "number" && Number.isFinite(prompt.score) && prompt.score > 0) {
    return Math.round(prompt.score);
  }
  return null;
}

export function filterReviewPrompts(
  prompts: AdminReviewPrompt[],
  filter: ReviewFilter,
): AdminReviewPrompt[] {
  return prompts.filter((p) => {
    const score = effectiveScoreForAdmin(p);
    if (filter === "all") return true;
    if (filter === "noScore") return score === null;
    if (score === null) return false;
    if (filter === "low") return score <= 40;
    if (filter === "mid") return score >= 41 && score <= 70;
    return score >= 71;
  });
}

export function sortReviewPrompts(prompts: AdminReviewPrompt[], sort: ReviewSort): AdminReviewPrompt[] {
  const copy = [...prompts];
  copy.sort((a, b) => {
    if (sort === "newest") return +new Date(b.createdAt) - +new Date(a.createdAt);
    if (sort === "oldest") return +new Date(a.createdAt) - +new Date(b.createdAt);
    const sa = effectiveScoreForAdmin(a) ?? -1;
    const sb = effectiveScoreForAdmin(b) ?? -1;
    if (sort === "scoreHigh") return sb - sa;
    return sa - sb;
  });
  return copy;
}
