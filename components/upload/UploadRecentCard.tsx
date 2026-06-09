"use client";

import { Card } from "@/components/ui/Card";
import { CardHeader } from "@/components/ui/CardHeader";
import type { RecentPromptRow } from "@/components/upload/uploadTypes";
import { formatDateStable } from "@/lib/format-date";

function scoreTone(score: number | null) {
  if (score == null) return { bg: "var(--pa-hint)", color: "var(--pa-muted)" };
  if (score >= 80) return { bg: "rgba(6,214,160,.15)", color: "#06D6A0" };
  if (score >= 50) return { bg: "rgba(123,92,240,.15)", color: "#9B7CF0" };
  if (score >= 30) return { bg: "rgba(255,183,3,.15)", color: "#FFB703" };
  return { bg: "rgba(255,107,53,.15)", color: "#FF6B35" };
}

export function UploadRecentCard({
  rows,
  onPick,
}: Readonly<{
  rows: RecentPromptRow[];
  onPick: (content: string) => void;
}>) {
  return (
    <Card>
      <CardHeader title="Recent analyses" />
      <div className="p-2">
        {rows.length === 0 ? (
          <div className="p-3 text-center" style={{ fontSize: 11, color: "var(--pa-muted)" }}>
            No saved prompts yet.
          </div>
        ) : (
          rows.map((r) => {
            const t = scoreTone(r.score);
            return (
              <button
                key={r.id}
                type="button"
                onClick={() => onPick(r.content)}
                className="mb-1 flex w-full cursor-pointer items-center gap-2 rounded-lg border-0 text-left transition-colors"
                style={{ padding: "7px 8px" }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "var(--pa-hint)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "transparent";
                }}
              >
                <span
                  className="grid h-7 w-7 shrink-0 place-items-center rounded-lg text-[11px] font-medium"
                  style={{ background: t.bg, color: t.color }}
                >
                  {r.score ?? "—"}
                </span>
                <span className="min-w-0 flex-1 truncate" style={{ fontSize: 11, color: "var(--pa-text)" }}>
                  {r.content.trim().slice(0, 80) || "—"}
                </span>
                <span className="ml-auto shrink-0" style={{ fontSize: 10, color: "var(--pa-muted)" }}>
                  {formatDateStable(r.createdAt)}
                </span>
              </button>
            );
          })
        )}
      </div>
    </Card>
  );
}
