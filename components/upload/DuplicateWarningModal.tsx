"use client";

import Link from "next/link";
import { ButtonOutline } from "@/components/ui/ButtonOutline";
import { ButtonGradient } from "@/components/ui/ButtonGradient";
import type { DuplicateCheckResult } from "@/lib/prompt-duplicates";
import { formatDateTimeStable } from "@/lib/format-date";

function truncate(text: string, max = 80): string {
  const t = text.trim();
  if (t.length <= max) return t;
  return `${t.slice(0, max - 1).trimEnd()}…`;
}

export function DuplicateWarningModal({
  result,
  onCancel,
  onSubmitAnyway,
  busy,
}: Readonly<{
  result: DuplicateCheckResult;
  onCancel: () => void;
  onSubmitAnyway: () => void;
  busy?: boolean;
}>) {
  const top = result.similarPrompts[0];
  const isHigh = result.riskLevel === "high";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "var(--pa-overlay)" }}
    >
      <div
        className="w-full max-w-md rounded-xl p-5"
        style={{ background: "var(--pa-card)", border: "1px solid var(--pa-card-border)" }}
      >
        <div style={{ fontSize: 14, fontWeight: 600, color: "var(--pa-text)" }}>
          {isHigh ? "⚠️ Very similar prompt exists" : "💡 Similar prompt found"}
        </div>
        <p className="mt-2" style={{ fontSize: 12, color: "var(--pa-muted)", lineHeight: 1.5 }}>
          {isHigh
            ? "A nearly identical prompt is already in the library:"
            : "A similar prompt already exists in the library. Consider checking if it meets your needs first."}
        </p>
        {top ? (
          <div
            className="mt-3 rounded-lg p-3"
            style={{ background: "var(--pa-hint)", border: "1px solid var(--pa-card-border)" }}
          >
            <p style={{ fontSize: 11, color: "var(--pa-text)", lineHeight: 1.5 }}>
              &ldquo;{truncate(top.text, 80)}&rdquo;
            </p>
            <p className="mt-2" style={{ fontSize: 10, color: "var(--pa-muted)" }}>
              Published by: {top.publishedBy} • {formatDateTimeStable(top.publishedAt)}
            </p>
            {top.similarityScore < 1 ? (
              <p style={{ fontSize: 10, color: "var(--pa-muted)" }}>
                Similarity: {Math.round(top.similarityScore * 100)}%
              </p>
            ) : null}
          </div>
        ) : null}
        <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:justify-end">
          {top ? (
            <Link
              href={top.libraryUrl}
              className="text-center text-sm font-medium"
              style={{ color: "var(--pa-acc1)", padding: "8px 12px" }}
              target="_blank"
            >
              View existing prompt
            </Link>
          ) : null}
          <ButtonOutline type="button" onClick={onCancel} disabled={busy}>
            Cancel
          </ButtonOutline>
          <ButtonGradient type="button" onClick={onSubmitAnyway} disabled={busy}>
            Submit anyway
          </ButtonGradient>
        </div>
      </div>
    </div>
  );
}
