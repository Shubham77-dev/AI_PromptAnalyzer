"use client";

import { scoreBadgeTone } from "@/lib/prompt-display-score";

const TONE_STYLES = {
  none: {
    background: "var(--pa-hint)",
    color: "var(--pa-muted)",
    border: "1px solid var(--pa-card-border)",
  },
  low: {
    background: "rgba(239,68,68,0.12)",
    color: "var(--pa-acc3)",
    border: "1px solid rgba(239,68,68,0.35)",
  },
  mid: {
    background: "rgba(245,158,11,0.12)",
    color: "#b45309",
    border: "1px solid rgba(245,158,11,0.35)",
  },
  high: {
    background: "rgba(34,197,94,0.12)",
    color: "var(--pa-acc2)",
    border: "1px solid rgba(34,197,94,0.35)",
  },
} as const;

export function ScoreBadge({ score }: Readonly<{ score: number | null }>) {
  const tone = scoreBadgeTone(score);
  const style = TONE_STYLES[tone];
  const label = score === null || score <= 0 ? "No score" : `Score: ${score}`;

  return (
    <span
      className="inline-flex items-center rounded-full px-2.5 py-0.5 font-semibold"
      style={{ fontSize: 10, ...style }}
    >
      {label}
    </span>
  );
}
