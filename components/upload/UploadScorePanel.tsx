"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { requireAuth } from "@/app/_lib/auth-guard";
import { ButtonGradient } from "@/components/ui/ButtonGradient";
import { ButtonOutline } from "@/components/ui/ButtonOutline";
import { Card } from "@/components/ui/Card";
import { CardHeader } from "@/components/ui/CardHeader";
import { ScoreBar } from "@/components/ui/ScoreBar";
import { ScoreRing } from "@/components/ui/ScoreRing";
import { UploadSuggestionsBlock } from "@/components/upload/UploadSuggestionsBlock";
import type { AnalysisPayload } from "@/components/upload/uploadTypes";

function barsFromBreakdown(b: NonNullable<AnalysisPayload["breakdown"]>) {
  return [
    { label: "Accuracy", value: b.accuracy, color: "var(--pa-acc1)" },
    { label: "Clarity", value: b.clarity, color: "var(--pa-acc2)" },
    { label: "Structure", value: b.structure, color: "var(--pa-acc3)" },
    { label: "Conciseness", value: b.specificity, color: "var(--pa-acc4)" },
  ];
}

export function UploadScorePanel({
  analysis,
  content,
  onError,
}: Readonly<{
  analysis: AnalysisPayload;
  content: string;
  onError: (e: string | null) => void;
}>) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [copied, setCopied] = useState(false);
  const b = analysis.breakdown ?? {
    clarity: analysis.score,
    structure: analysis.score,
    specificity: analysis.score,
    outputDefinition: analysis.score,
    accuracy: analysis.score,
  };

  async function saveLibrary() {
    onError(null);
    const ok = await requireAuth(
      async () => {
        const res = await fetch("/api/prompt", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            content,
            analysis: {
              score: analysis.score,
              issues: analysis.issues,
              suggestions: analysis.suggestions,
              improvedPrompt: analysis.improvedPrompt,
            },
          }),
        });
        if (!res.ok) {
          const body = (await res.json().catch(() => null)) as { error?: string } | null;
          onError(body?.error || "Save failed");
          return;
        }
        startTransition(() => router.push("/dashboard"));
      },
      { router },
    );
    if (!ok) return;
  }

  async function copyImproved() {
    await globalThis.navigator?.clipboard?.writeText(analysis.improvedPrompt);
    setCopied(true);
    globalThis.setTimeout(() => setCopied(false), 900);
  }

  return (
    <div className="flex flex-col gap-3" style={{ animation: "pa-fadein 0.45s ease forwards" }}>
      <Card>
        <CardHeader
          title="Score"
          right={<span style={{ color: "var(--pa-acc1)", fontSize: 11 }}>{analysis.score} / 100</span>}
        />
        <div className="p-4">
          <ScoreRing score={analysis.score} />
          <div className="mt-4 grid gap-1">
            {barsFromBreakdown(b).map((row) => (
              <ScoreBar key={row.label} label={row.label} value={row.value} color={row.color} />
            ))}
          </div>
        </div>
        <div
          className="flex gap-2 border-t"
          style={{ borderColor: "var(--pa-card-border)", padding: "10px 14px" }}
        >
          <ButtonOutline className="flex-1" onClick={saveLibrary} disabled={pending}>
            Save to library
          </ButtonOutline>
          <ButtonGradient
            className="flex-1"
            onClick={() => void copyImproved()}
            style={copied ? { backgroundImage: "none", background: "var(--pa-acc2)" } : undefined}
          >
            {copied ? "Copied" : "Copy improved"}
          </ButtonGradient>
        </div>
      </Card>

      <Card>
        <CardHeader title="Suggestions" />
        <UploadSuggestionsBlock issues={analysis.issues} suggestions={analysis.suggestions} />
        <div className="p-3">
          <div style={{ fontSize: 9, textTransform: "uppercase", color: "var(--pa-muted)" }}>
            Improved prompt
          </div>
          <pre
            className="mt-2 whitespace-pre-wrap"
            style={{
              borderRadius: 10,
              padding: "10px 12px",
              background: "var(--pa-hint)",
              fontFamily: "var(--font-geist-mono), monospace",
              fontSize: 11,
              color: "var(--pa-muted)",
              lineHeight: 1.6,
            }}
          >
            {analysis.improvedPrompt}
          </pre>
        </div>
      </Card>
    </div>
  );
}
