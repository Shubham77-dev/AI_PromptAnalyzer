"use client";

import Link from "next/link";
import { ButtonOutline } from "@/components/ui/ButtonOutline";
import type { DuplicateCheckResult } from "@/lib/prompt-duplicates";
import { formatDateTimeStable } from "@/lib/format-date";

function truncate(text: string, max = 80): string {
  const t = text.trim();
  if (t.length <= max) return t;
  return `${t.slice(0, max - 1).trimEnd()}…`;
}

export function DuplicateWarningCard({
  result,
  onPublishAnyway,
  onRejectDuplicate,
  busy,
}: Readonly<{
  result: DuplicateCheckResult;
  onPublishAnyway: () => void;
  onRejectDuplicate: () => void;
  busy?: boolean;
}>) {
  const top = result.similarPrompts[0];
  if (!top) return null;

  return (
    <div
      className="mb-4 rounded-xl p-4"
      style={{
        background: "rgba(245,158,11,0.08)",
        border: "1px solid rgba(245,158,11,0.35)",
      }}
    >
      <div style={{ fontSize: 12, fontWeight: 600, color: "#b45309" }}>⚠️ Duplicate detected</div>
      <p className="mt-1" style={{ fontSize: 11, color: "var(--pa-text)", lineHeight: 1.5 }}>
        Similarity: {Math.round(top.similarityScore * 100)}% match with existing library prompt
      </p>
      <p className="mt-1" style={{ fontSize: 11, color: "var(--pa-muted)", lineHeight: 1.5 }}>
        &ldquo;{truncate(top.text, 80)}&rdquo; — by {top.publishedBy} • {formatDateTimeStable(top.publishedAt)}
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        <Link
          href={top.libraryUrl}
          className="text-xs font-medium"
          style={{ color: "var(--pa-acc1)" }}
          target="_blank"
        >
          View in library
        </Link>
        <ButtonOutline type="button" onClick={onPublishAnyway} disabled={busy}>
          Publish anyway
        </ButtonOutline>
        <button
          type="button"
          onClick={onRejectDuplicate}
          disabled={busy}
          className="rounded-lg px-3 py-1.5 text-xs font-semibold text-white"
          style={{ background: "var(--pa-acc3)" }}
        >
          Reject as duplicate
        </button>
      </div>
    </div>
  );
}
