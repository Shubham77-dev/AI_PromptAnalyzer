"use client";

import { useState, type ReactNode } from "react";
import { Card } from "@/components/ui/Card";
import { CardHeader } from "@/components/ui/CardHeader";
import type { AnalysisPayload, AnalysisReview } from "@/components/upload/uploadTypes";

function ReviewSection({
  title,
  titleColor,
  children,
}: Readonly<{
  title: string;
  titleColor?: string;
  children: ReactNode;
}>) {
  return (
    <div className="px-4 pb-3">
      <div
        style={{
          fontSize: 9,
          textTransform: "uppercase",
          letterSpacing: "0.04em",
          color: titleColor ?? "var(--pa-muted)",
          marginBottom: 8,
          fontWeight: 600,
        }}
      >
        {title}
      </div>
      {children}
    </div>
  );
}

function BulletList({
  items,
  icon,
  iconColor,
}: Readonly<{ items: string[]; icon: string; iconColor: string }>) {
  if (items.length === 0) return null;
  return (
    <ul className="flex flex-col gap-2">
      {items.map((item) => (
        <li key={item} className="flex items-start gap-2" style={{ fontSize: 11, color: "var(--pa-text)", lineHeight: 1.5 }}>
          <span style={{ color: iconColor, flexShrink: 0, fontSize: 10, marginTop: 2 }}>{icon}</span>
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

function DimensionScoreRows({ rows }: Readonly<{ rows: NonNullable<AnalysisReview["dimensionBreakdown"]> }>) {
  return (
    <div className="flex flex-col gap-1.5">
      {rows.map((row) => (
        <div key={row.key} className="flex items-center gap-2" style={{ fontFamily: "var(--font-geist-mono), monospace", fontSize: 10 }}>
          <span style={{ width: 110, color: "var(--pa-muted)", flexShrink: 0 }}>{row.label}</span>
          <span style={{ color: "var(--pa-hint)", flex: 1, overflow: "hidden" }}>
            {".".repeat(24)}
          </span>
          <span style={{ color: "var(--pa-text)", width: 48, textAlign: "right", flexShrink: 0 }}>
            {row.earnedPoints}/{row.maxPoints}
          </span>
        </div>
      ))}
    </div>
  );
}

function maturityBadgeStyle(level: string) {
  const map: Record<string, { bg: string; color: string }> = {
    Beginner: { bg: "rgba(239,68,68,0.12)", color: "var(--pa-acc3)" },
    Developing: { bg: "rgba(245,158,11,0.10)", color: "#b45309" },
    Intermediate: { bg: "rgba(245,158,11,0.12)", color: "#d97706" },
    Advanced: { bg: "rgba(34,197,94,0.12)", color: "var(--pa-acc2)" },
    Expert: { bg: "rgba(99,102,241,0.12)", color: "var(--pa-acc1)" },
  };
  return map[level] ?? { bg: "var(--pa-hint)", color: "var(--pa-muted)" };
}

export function PromptReviewPanel({ review }: Readonly<{ review: AnalysisReview }>) {
  const [whyOpen, setWhyOpen] = useState(false);
  const badge = maturityBadgeStyle(review.promptMaturityLevel);

  const highImpact = review.highImpactImprovements ?? [];
  const optional = review.optionalEnhancements ?? [];

  return (
    <Card>
      <CardHeader
        title="Prompt Review"
        right={
          <span
            style={{
              fontSize: 10,
              fontWeight: 600,
              padding: "3px 10px",
              borderRadius: 999,
              background: badge.bg,
              color: badge.color,
            }}
          >
            {review.promptMaturityLevel}
          </span>
        }
      />

      {review.aiEnhancementNote ? (
        <div
          className="mx-4 mb-2 rounded-lg px-3 py-2"
          style={{
            background: "rgba(245,158,11,0.12)",
            border: "1px solid rgba(245,158,11,0.35)",
            fontSize: 11,
            color: "#b45309",
            lineHeight: 1.5,
          }}
        >
          {review.aiEnhancementNote}
        </div>
      ) : null}

      <ReviewSection title="Review Summary">
        <p style={{ fontSize: 12, color: "var(--pa-text)", lineHeight: 1.6 }}>{review.reviewSummary}</p>
      </ReviewSection>

      {review.strengths.length > 0 ? (
        <ReviewSection title="Strengths" titleColor="var(--pa-acc2)">
          <BulletList items={review.strengths} icon="✓" iconColor="var(--pa-acc2)" />
        </ReviewSection>
      ) : null}

      {highImpact.length > 0 ? (
        <ReviewSection title="High Impact Improvements" titleColor="var(--pa-acc3)">
          <BulletList items={highImpact} icon="●" iconColor="var(--pa-acc3)" />
        </ReviewSection>
      ) : null}

      {optional.length > 0 ? (
        <ReviewSection title="Optional Enhancements" titleColor="#d97706">
          <BulletList items={optional} icon="●" iconColor="#d97706" />
        </ReviewSection>
      ) : null}

      <div className="border-t px-4 py-3" style={{ borderColor: "var(--pa-card-border)" }}>
        <button
          type="button"
          onClick={() => setWhyOpen((o) => !o)}
          className="flex w-full items-center justify-between gap-2 text-left"
          style={{
            fontSize: 11,
            fontWeight: 600,
            color: "var(--pa-text)",
            background: "transparent",
            border: "none",
            cursor: "pointer",
            padding: 0,
          }}
        >
          <span>Why this score?</span>
          <span style={{ fontSize: 10, color: "var(--pa-muted)" }}>{whyOpen ? "▲" : "▼"}</span>
        </button>

        {whyOpen ? (
          <div className="mt-3 flex flex-col gap-3">
            <p style={{ fontSize: 11, color: "var(--pa-muted)", lineHeight: 1.55 }}>{review.whyThisScore}</p>
            {review.dimensionBreakdown && review.dimensionBreakdown.length > 0 ? (
              <DimensionScoreRows rows={review.dimensionBreakdown} />
            ) : null}
          </div>
        ) : null}
      </div>
    </Card>
  );
}

export function PromptReviewFallback({ analysis }: Readonly<{ analysis: AnalysisPayload }>) {
  const issues = analysis.issues ?? [];
  const suggestions = analysis.suggestions ?? [];
  if (issues.length === 0 && suggestions.length === 0) return null;

  return (
    <Card>
      <CardHeader title="Prompt Review" />
      {issues.length > 0 ? (
        <ReviewSection title="Issues" titleColor="var(--pa-acc3)">
          <BulletList items={issues} icon="●" iconColor="var(--pa-acc3)" />
        </ReviewSection>
      ) : null}
      {suggestions.length > 0 ? (
        <ReviewSection title="Suggestions">
          <BulletList items={suggestions} icon="●" iconColor="var(--pa-acc1)" />
        </ReviewSection>
      ) : null}
    </Card>
  );
}
