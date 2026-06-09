"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ScoreBadge } from "@/components/admin/ScoreBadge";
import { ScoreBar } from "@/components/ui/ScoreBar";
import { ButtonOutline } from "@/components/ui/ButtonOutline";
import { ButtonGradient } from "@/components/ui/ButtonGradient";
import { formatDateTimeStable, formatTimeAgo } from "@/lib/format-date";
import type {
  AdminReviewPrompt,
  ReviewCounts,
  ReviewFilter,
  ReviewSort,
  ReviewTab,
} from "@/lib/admin/review-types";
import { DuplicateWarningCard } from "@/components/admin/DuplicateWarningCard";
import type { DuplicateCheckResult } from "@/lib/prompt-duplicates";
import {
  effectiveScoreForAdmin,
  filterReviewPrompts,
  sortReviewPrompts,
} from "@/lib/admin/review-types";

async function fetchDuplicateCheck(content: string, excludePromptId?: string): Promise<DuplicateCheckResult | null> {
  const res = await fetch("/api/prompts/check-duplicates", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ content, excludePromptId }),
  });
  const json = (await res.json().catch(() => null)) as DuplicateCheckResult | null;
  if (!res.ok || !json) return null;
  return json;
}

const DIMENSION_ROWS = [
  { key: "clarity", label: "Clarity" },
  { key: "specificity", label: "Specificity" },
  { key: "completeness", label: "Completeness" },
  { key: "context", label: "Context" },
  { key: "actionability", label: "Actionability" },
  { key: "outputDefinition", label: "Output Definition" },
] as const;

function scoreBarColor(value: number): string {
  if (value <= 40) return "var(--pa-acc3)";
  if (value <= 70) return "#f59e0b";
  return "var(--pa-acc2)";
}

function truncate(text: string, max = 80): string {
  const t = text.trim();
  if (t.length <= max) return t;
  return `${t.slice(0, max - 1).trimEnd()}…`;
}

async function adminPatch(url: string, body?: object) {
  const res = await fetch(url, {
    method: "PATCH",
    headers: body ? { "content-type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  const json = await res.json().catch(() => null);
  if (!res.ok) throw new Error(json?.error || json?.message || "Request failed");
  return json;
}

function RecalculateScoreButton({
  promptId,
  hasScore,
  onDone,
}: Readonly<{ promptId: string; hasScore: boolean; onDone: () => void }>) {
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  async function run() {
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/prompts/${encodeURIComponent(promptId)}/recalculate-score`, {
        method: "POST",
      });
      const json = await res.json().catch(() => null);
      if (!res.ok) throw new Error(json?.error || "Failed to calculate score");
      setDone(true);
      toast.success("Score updated");
      onDone();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to calculate score");
    } finally {
      setBusy(false);
    }
  }

  if (done) {
    return (
      <span style={{ fontSize: 11, color: "var(--pa-acc2)", fontWeight: 600 }}>Score updated ✓</span>
    );
  }

  return (
    <ButtonOutline type="button" onClick={() => void run()} disabled={busy}>
      {busy ? "Calculating…" : hasScore ? "🔄 Recalculate" : "🔄 Calculate Score"}
    </ButtonOutline>
  );
}

function ReviewDetail({
  prompt,
  onClose,
  onRefresh,
}: Readonly<{ prompt: AdminReviewPrompt; onClose: () => void; onRefresh: () => void }>) {
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [publishOpen, setPublishOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [duplicateResult, setDuplicateResult] = useState<DuplicateCheckResult | null>(null);
  const score = effectiveScoreForAdmin(prompt);
  const dims = prompt.qualityDimensions;

  useEffect(() => {
    let cancelled = false;
    void fetchDuplicateCheck(prompt.content, prompt.id).then((result) => {
      if (!cancelled && result?.isDuplicate) setDuplicateResult(result);
      else if (!cancelled) setDuplicateResult(null);
    });
    return () => {
      cancelled = true;
    };
  }, [prompt.id, prompt.content]);

  async function publish() {
    setBusy(true);
    try {
      await adminPatch(`/api/admin/prompts/${encodeURIComponent(prompt.id)}/publish`);
      toast.success("Prompt published successfully");
      setPublishOpen(false);
      onRefresh();
      onClose();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Publish failed");
    } finally {
      setBusy(false);
    }
  }

  async function reject() {
    setBusy(true);
    try {
      await adminPatch(`/api/admin/prompts/${encodeURIComponent(prompt.id)}/reject`, {
        reason: rejectReason.trim() || undefined,
      });
      toast.success("Prompt rejected");
      setRejectOpen(false);
      onRefresh();
      onClose();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Reject failed");
    } finally {
      setBusy(false);
    }
  }

  async function reconsider() {
    setBusy(true);
    try {
      await adminPatch(`/api/admin/prompts/${encodeURIComponent(prompt.id)}/reconsider`);
      toast.success("Prompt returned to review queue");
      onRefresh();
      onClose();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Action failed");
    } finally {
      setBusy(false);
    }
  }

  async function unpublish() {
    setBusy(true);
    try {
      await adminPatch(`/api/admin/prompts/${encodeURIComponent(prompt.id)}/unpublish`);
      toast.success("Prompt unpublished");
      onRefresh();
      onClose();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Unpublish failed");
    } finally {
      setBusy(false);
    }
  }

  async function copyContent() {
    await globalThis.navigator?.clipboard?.writeText(prompt.content);
    toast.success("Copied to clipboard");
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-4" style={{ background: "var(--pa-overlay)" }}>
      <div
        className="flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-t-2xl sm:rounded-2xl"
        style={{ background: "var(--pa-card)", border: "1px solid var(--pa-card-border)" }}
      >
        <div className="flex items-center justify-between gap-3 border-b px-4 py-3" style={{ borderColor: "var(--pa-card-border)" }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: "var(--pa-text)" }}>Prompt review</div>
          <button type="button" onClick={onClose} className="text-sm" style={{ color: "var(--pa-muted)" }}>
            Close
          </button>
        </div>

        <div className="overflow-y-auto p-4">
          <section className="mb-4">
            <div style={{ fontSize: 10, fontWeight: 600, textTransform: "uppercase", color: "var(--pa-muted)" }}>
              Prompt info
            </div>
            <div className="mt-2 grid gap-1" style={{ fontSize: 12, color: "var(--pa-text)" }}>
              <div>
                <span style={{ color: "var(--pa-muted)" }}>Submitted by: </span>
                {prompt.user.name ? `${prompt.user.name} (${prompt.user.email})` : prompt.user.email}
              </div>
              <div>
                <span style={{ color: "var(--pa-muted)" }}>Submitted at: </span>
                {formatDateTimeStable(prompt.createdAt)} ({formatTimeAgo(prompt.createdAt)})
              </div>
              {prompt.promptTypeLabel ? (
                <div>
                  <span style={{ color: "var(--pa-muted)" }}>Prompt type: </span>
                  {prompt.promptTypeLabel}
                </div>
              ) : null}
            </div>
          </section>

          <section className="mb-4">
            <div className="mb-2 flex items-center justify-between gap-2">
              <div style={{ fontSize: 10, fontWeight: 600, textTransform: "uppercase", color: "var(--pa-muted)" }}>
                Prompt content
              </div>
              <ButtonOutline type="button" onClick={() => void copyContent()}>
                Copy
              </ButtonOutline>
            </div>
            <pre
              className="whitespace-pre-wrap rounded-lg p-3"
              style={{
                fontSize: 12,
                lineHeight: 1.55,
                background: "var(--pa-hint)",
                color: "var(--pa-text)",
                fontFamily: "var(--font-geist-mono), monospace",
              }}
            >
              {prompt.content}
            </pre>
          </section>

          <section className="mb-4">
            <div style={{ fontSize: 10, fontWeight: 600, textTransform: "uppercase", color: "var(--pa-muted)" }}>
              Score &amp; analysis
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <ScoreBadge score={score} />
              {prompt.maturityLevel ? (
                <span
                  className="rounded-full px-2 py-0.5 font-semibold"
                  style={{ fontSize: 10, background: "var(--pa-hint)", color: "var(--pa-acc1)" }}
                >
                  {prompt.maturityLevel}
                </span>
              ) : null}
              <RecalculateScoreButton promptId={prompt.id} hasScore={score !== null} onDone={onRefresh} />
            </div>
            {dims ? (
              <div className="mt-3 grid gap-1">
                {DIMENSION_ROWS.map(({ key, label }) => (
                  <ScoreBar key={key} label={label} value={dims[key]} color={scoreBarColor(dims[key])} />
                ))}
              </div>
            ) : score === null ? (
              <p className="mt-2" style={{ fontSize: 11, color: "var(--pa-muted)" }}>
                No dimension data yet. Use Calculate Score to run the local analyzer.
              </p>
            ) : null}
            {prompt.rejectReason ? (
              <p className="mt-3" style={{ fontSize: 11, color: "var(--pa-acc3)" }}>
                Rejection reason: {prompt.rejectReason}
              </p>
            ) : null}
          </section>

          {duplicateResult?.isDuplicate ? (
            <DuplicateWarningCard
              result={duplicateResult}
              busy={busy}
              onPublishAnyway={() => setPublishOpen(true)}
              onRejectDuplicate={() => {
                setRejectReason("Duplicate of existing library prompt");
                setRejectOpen(true);
              }}
            />
          ) : null}

          <section>
            <div style={{ fontSize: 10, fontWeight: 600, textTransform: "uppercase", color: "var(--pa-muted)" }}>
              Admin actions
            </div>
            <div className="mt-2 flex flex-wrap gap-2">
              {prompt.moderationStatus === "PENDING" || prompt.status === "UNDER_REVIEW" ? (
                <>
                  <ButtonGradient type="button" disabled={busy} onClick={() => setPublishOpen(true)}>
                    Publish
                  </ButtonGradient>
                  <ButtonOutline type="button" disabled={busy} onClick={() => setRejectOpen(true)}>
                    Reject
                  </ButtonOutline>
                </>
              ) : null}
              {prompt.moderationStatus === "APPROVED" && prompt.status === "PUBLISHED" ? (
                <ButtonOutline type="button" disabled={busy} onClick={() => void unpublish()}>
                  Unpublish
                </ButtonOutline>
              ) : null}
              {prompt.moderationStatus === "REJECTED" ? (
                <ButtonOutline type="button" disabled={busy} onClick={() => void reconsider()}>
                  Reconsider
                </ButtonOutline>
              ) : null}
            </div>
          </section>
        </div>
      </div>

      {publishOpen ? (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4" style={{ background: "var(--pa-overlay)" }}>
          <div className="w-full max-w-md rounded-xl p-5" style={{ background: "var(--pa-card)", border: "1px solid var(--pa-card-border)" }}>
            <p style={{ fontSize: 14, fontWeight: 600, color: "var(--pa-text)" }}>Publish this prompt to the public library?</p>
            <div className="mt-4 flex justify-end gap-2">
              <ButtonOutline type="button" onClick={() => setPublishOpen(false)} disabled={busy}>
                Cancel
              </ButtonOutline>
              <ButtonGradient type="button" onClick={() => void publish()} disabled={busy}>
                Yes, publish
              </ButtonGradient>
            </div>
          </div>
        </div>
      ) : null}

      {rejectOpen ? (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4" style={{ background: "var(--pa-overlay)" }}>
          <div className="w-full max-w-md rounded-xl p-5" style={{ background: "var(--pa-card)", border: "1px solid var(--pa-card-border)" }}>
            <p style={{ fontSize: 14, fontWeight: 600, color: "var(--pa-text)" }}>Reject this prompt?</p>
            <textarea
              className="mt-3 w-full rounded-lg p-2"
              rows={3}
              placeholder="Reason for rejection (optional) — e.g. Too vague, Off topic, Low quality"
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              style={{ fontSize: 12, border: "1px solid var(--pa-card-border)", background: "var(--pa-hint)", color: "var(--pa-text)" }}
            />
            <div className="mt-4 flex justify-end gap-2">
              <ButtonOutline type="button" onClick={() => setRejectOpen(false)} disabled={busy}>
                Cancel
              </ButtonOutline>
              <button
                type="button"
                disabled={busy}
                onClick={() => void reject()}
                className="rounded-lg px-3 py-2 text-sm font-semibold text-white"
                style={{ background: "var(--pa-acc3)" }}
              >
                Reject
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function PromptCard({
  prompt,
  tab,
  onOpen,
  onRefresh,
}: Readonly<{
  prompt: AdminReviewPrompt;
  tab: ReviewTab;
  onOpen: () => void;
  onRefresh: () => void;
}>) {
  const [busy, setBusy] = useState(false);
  const score = effectiveScoreForAdmin(prompt);

  async function quickPublish() {
    const dup = await fetchDuplicateCheck(prompt.content, prompt.id);
    const dupNote =
      dup?.isDuplicate && dup.similarPrompts[0]
        ? `\n\nWarning: ${Math.round(dup.similarPrompts[0].similarityScore * 100)}% similar to an existing library prompt.`
        : "";
    if (!globalThis.confirm(`Publish this prompt to the public library?${dupNote}`)) return;
    setBusy(true);
    try {
      await adminPatch(`/api/admin/prompts/${encodeURIComponent(prompt.id)}/publish`);
      toast.success("Prompt published successfully");
      onRefresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Publish failed");
    } finally {
      setBusy(false);
    }
  }

  async function quickReject() {
    const reason = globalThis.prompt("Optional rejection reason:") ?? "";
    setBusy(true);
    try {
      await adminPatch(`/api/admin/prompts/${encodeURIComponent(prompt.id)}/reject`, {
        reason: reason.trim() || undefined,
      });
      toast.success("Prompt rejected");
      onRefresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Reject failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      className="rounded-xl p-4"
      style={{ background: "var(--pa-card)", border: "1px solid var(--pa-card-border)" }}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p style={{ fontSize: 12, color: "var(--pa-text)", lineHeight: 1.5 }}>{truncate(prompt.content)}</p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <span style={{ fontSize: 10, color: "var(--pa-muted)" }}>{prompt.user.email}</span>
            <span style={{ fontSize: 10, color: "var(--pa-muted)" }}>{formatTimeAgo(prompt.createdAt)}</span>
            <ScoreBadge score={score} />
            {prompt.promptTypeLabel ? (
              <span
                className="rounded-full px-2 py-0.5 font-semibold"
                style={{ fontSize: 9, background: "var(--pa-hint)", color: "var(--pa-acc1)" }}
              >
                {prompt.promptTypeLabel}
              </span>
            ) : null}
          </div>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        {tab === "pending" ? (
          <>
            <ButtonGradient type="button" disabled={busy} onClick={() => void quickPublish()}>
              Publish
            </ButtonGradient>
            <ButtonOutline type="button" disabled={busy} onClick={() => void quickReject()}>
              Reject
            </ButtonOutline>
          </>
        ) : null}
        <ButtonOutline type="button" onClick={onOpen}>
          View details
        </ButtonOutline>
      </div>
    </div>
  );
}

export function ReviewQueueWorkspace({
  prompts,
  counts,
  initialTab,
}: Readonly<{
  prompts: AdminReviewPrompt[];
  counts: ReviewCounts;
  initialTab: ReviewTab;
}>) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [tab, setTab] = useState<ReviewTab>(initialTab);
  const [sort, setSort] = useState<ReviewSort>("newest");
  const [filter, setFilter] = useState<ReviewFilter>("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const refresh = () => startTransition(() => router.refresh());

  const filtered = useMemo(() => {
    const byTab = prompts.filter((p) => {
      if (tab === "pending") return p.moderationStatus === "PENDING";
      if (tab === "published") return p.moderationStatus === "APPROVED" && p.status === "PUBLISHED";
      return p.moderationStatus === "REJECTED";
    });
    return sortReviewPrompts(filterReviewPrompts(byTab, filter), sort);
  }, [prompts, tab, sort, filter]);

  const selected = selectedId ? prompts.find((p) => p.id === selectedId) ?? null : null;

  const tabBtn = (id: ReviewTab, label: string, count: number) => (
    <button
      type="button"
      onClick={() => setTab(id)}
      className="rounded-full px-3 py-1.5 font-semibold"
      style={{
        fontSize: 11,
        border: tab === id ? "1px solid var(--pa-acc1)" : "1px solid var(--pa-card-border)",
        color: tab === id ? "var(--pa-acc1)" : "var(--pa-muted)",
        background: tab === id ? "color-mix(in srgb, var(--pa-acc1) 10%, transparent)" : "transparent",
      }}
    >
      {label} ({count})
    </button>
  );

  return (
    <>
      <div className="mb-3 flex flex-wrap gap-2">
        {tabBtn("pending", "Pending", counts.pending)}
        {tabBtn("published", "Published", counts.published)}
        {tabBtn("rejected", "Rejected", counts.rejected)}
      </div>

      <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <p style={{ fontSize: 12, color: "var(--pa-muted)" }}>
          {tab === "pending" ? `${counts.pending} prompts pending review` : `${filtered.length} shown`}
        </p>
        <div className="flex flex-wrap gap-2">
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as ReviewSort)}
            className="rounded-lg px-2 py-1.5"
            style={{ fontSize: 11, border: "1px solid var(--pa-card-border)", background: "var(--pa-card)", color: "var(--pa-text)" }}
          >
            <option value="newest">Newest first</option>
            <option value="oldest">Oldest first</option>
            <option value="scoreHigh">Highest score</option>
            <option value="scoreLow">Lowest score</option>
          </select>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as ReviewFilter)}
            className="rounded-lg px-2 py-1.5"
            style={{ fontSize: 11, border: "1px solid var(--pa-card-border)", background: "var(--pa-card)", color: "var(--pa-text)" }}
          >
            <option value="all">All</option>
            <option value="noScore">No score</option>
            <option value="low">Low (0–40)</option>
            <option value="mid">Mid (41–70)</option>
            <option value="high">High (71+)</option>
          </select>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div
          className="rounded-xl p-8 text-center"
          style={{ background: "var(--pa-card)", border: "1px solid var(--pa-card-border)" }}
        >
          <div style={{ fontSize: 28, marginBottom: 8 }}>✅</div>
          <p style={{ fontSize: 14, fontWeight: 600, color: "var(--pa-text)" }}>
            {tab === "pending" ? "All caught up! No prompts pending review." : "No prompts in this tab."}
          </p>
        </div>
      ) : (
        <div className="grid gap-3">
          {filtered.map((p) => (
            <PromptCard
              key={p.id}
              prompt={p}
              tab={tab}
              onOpen={() => setSelectedId(p.id)}
              onRefresh={refresh}
            />
          ))}
        </div>
      )}

      {selected ? (
        <ReviewDetail prompt={selected} onClose={() => setSelectedId(null)} onRefresh={refresh} />
      ) : null}
    </>
  );
}
