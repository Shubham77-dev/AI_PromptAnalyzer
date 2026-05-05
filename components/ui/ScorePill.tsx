import type { CSSProperties } from "react";

export interface ScorePillProps {
  value: number;
}

function scoreTier(value: number): "high" | "mid" | "low" | "poor" {
  if (value >= 80) return "high";
  if (value >= 50) return "mid";
  if (value >= 30) return "low";
  return "poor";
}

function pillStyle(value: number): CSSProperties {
  if (value >= 80) {
    return {
      background: "color-mix(in srgb, var(--pa-acc2) 15%, transparent)",
      color: "var(--pa-acc2)",
      border: "1px solid color-mix(in srgb, var(--pa-acc2) 30%, transparent)",
    };
  }
  if (value >= 50) {
    return {
      background: "color-mix(in srgb, var(--pa-acc1) 15%, transparent)",
      color: "color-mix(in srgb, var(--pa-acc1) 78%, white)",
      border: "1px solid color-mix(in srgb, var(--pa-acc1) 30%, transparent)",
    };
  }
  if (value >= 30) {
    return {
      background: "color-mix(in srgb, var(--pa-acc4) 15%, transparent)",
      color: "var(--pa-acc4)",
      border: "1px solid color-mix(in srgb, var(--pa-acc4) 30%, transparent)",
    };
  }
  return {
    background: "color-mix(in srgb, var(--pa-acc3) 15%, transparent)",
    color: "color-mix(in srgb, var(--pa-acc3) 85%, white)",
    border: "1px solid color-mix(in srgb, var(--pa-acc3) 30%, transparent)",
  };
}

export function ScorePill({ value }: Readonly<ScorePillProps>) {
  return (
    <span className="inline-flex font-medium pa-score-pill" data-tier={scoreTier(value)} style={pillStyle(value)}>
      {value}
    </span>
  );
}
