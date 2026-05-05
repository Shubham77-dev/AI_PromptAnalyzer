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

type SaveOutcome = "published" | "under_review" | "rejected" | "draft_saved";

type SaveApiResponse = {
  message?: string;
  outcome?: SaveOutcome;
  debug?: Record<string, unknown>;
  error?: string;
};

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
  const [saveResult, setSaveResult] = useState<{
    message: string;
    outcome: SaveOutcome | "unknown";
    debug?: Record<string, unknown>;
  } | null>(null);

  const b = analysis.breakdown ?? {
    clarity: analysis.score,
    structure: analysis.score,
    specificity: analysis.score,
    outputDefinition: analysis.score,
    accuracy: analysis.score,
  };

  const canAutoPublish = Boolean(analysis.moderation?.canAutoPublish);

  async function saveToLibrary(saveIntent: "draft" | "publish") {
    onError(null);
    setSaveResult(null);
    const ok = await requireAuth(
      async () => {
        const res = await fetch("/api/prompt", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            content,
            saveIntent,
          }),
        });
        const body = (await res.json().catch(() => null)) as SaveApiResponse | null;
        if (!res.ok) {
          onError(body?.error || "Save failed");
          return;
        }
        const outcome = body?.outcome ?? "unknown";
        const message =
          body?.message ??
          (outcome === "published"
            ? "Your prompt has been published successfully."
            : "Your prompt was saved.");
        setSaveResult({
          message,
          outcome,
          debug: body?.debug,
        });
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

  function feedbackToneFor(outcome: SaveOutcome | "unknown") {
    if (outcome === "published") {
      return { bg: "rgba(34,197,94,0.12)", border: "rgba(34,197,94,0.35)", color: "var(--pa-acc2)" };
    }
    if (outcome === "rejected") {
      return { bg: "rgba(239,68,68,0.08)", border: "rgba(239,68,68,0.35)", color: "var(--pa-acc3)" };
    }
    return { bg: "var(--pa-hint)", border: "var(--pa-card-border)", color: "var(--pa-muted)" };
  }

  const debugPayload = saveResult?.debug ?? analysis.debug;

  return (
    <div className="flex flex-col gap-3" style={{ animation: "pa-fadein 0.45s ease forwards" }}>
      {saveResult ? (
        (() => {
          const tone = feedbackToneFor(saveResult.outcome);
          return (
            <Card>
              <div className="p-4" style={{ background: tone.bg, borderBottom: `1px solid ${tone.border}` }}>
                <div style={{ fontSize: 13, color: tone.color, lineHeight: 1.5 }}>{saveResult.message}</div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <ButtonOutline
                    type="button"
                    onClick={() => {
                      startTransition(() => router.push("/dashboard"));
                    }}
                    disabled={pending}
                  >
                    Go to dashboard
                  </ButtonOutline>
                  <ButtonOutline type="button" onClick={() => setSaveResult(null)} disabled={pending}>
                    Continue editing
                  </ButtonOutline>
                </div>
              </div>
            </Card>
          );
        })()
      ) : null}

      <Card>
        <CardHeader
          title="Score"
          right={<span style={{ color: "var(--pa-acc1)", fontSize: 11 }}>{analysis.score} / 100</span>}
        />
        <div className="p-4">
          <ScoreRing score={analysis.score} />
          {analysis.moderation ? (
            <p className="mt-3" style={{ fontSize: 11, color: "var(--pa-muted)", lineHeight: 1.5 }}>
              This is the same blended score used when you save. Auto-publish when the pipeline status is{" "}
              <strong>approved</strong> (blended score &gt;{" "}
              <strong>{analysis.moderation.autoPublishThresholdExclusive}</strong>). Yours:{" "}
              <strong>{analysis.moderation.pipelineStatus}</strong>
              {canAutoPublish ? " — eligible for Save & publish." : " — use Submit for review or save as draft."}
            </p>
          ) : null}
          <div className="mt-4 grid gap-1">
            {barsFromBreakdown(b).map((row) => (
              <ScoreBar key={row.label} label={row.label} value={row.value} color={row.color} />
            ))}
          </div>
        </div>
        <div
          className="flex flex-col gap-2 border-t"
          style={{ borderColor: "var(--pa-card-border)", padding: "10px 14px" }}
        >
          <div className="flex flex-col gap-2 sm:flex-row">
            <ButtonOutline className="flex-1" onClick={() => void saveToLibrary("draft")} disabled={pending}>
              Save as draft
            </ButtonOutline>
            <span
              className="flex-1 min-w-0"
              title={
                canAutoPublish
                  ? "Publishes immediately if strict role/task/output checks pass."
                  : "Sends to the library under admin review (same score as shown here)."
              }
            >
              <ButtonGradient
                className="w-full"
                onClick={() => void saveToLibrary("publish")}
                disabled={pending}
              >
                {canAutoPublish ? "Save & publish" : "Submit for review"}
              </ButtonGradient>
            </span>
          </div>
          <div style={{ fontSize: 10, color: "var(--pa-muted)", lineHeight: 1.45 }}>
            {canAutoPublish
              ? "Save & publish goes live when your prompt also passes the strict checklist (role, task, output format)."
              : "Submit for review keeps this session’s score for moderation. Save as draft keeps the prompt private."}
          </div>
        </div>
      </Card>

      {debugPayload ? (
        <Card>
          <CardHeader title="Debug (publish decision)" />
          <pre
            className="max-h-48 overflow-auto p-3 whitespace-pre-wrap"
            style={{
              fontSize: 10,
              fontFamily: "var(--font-geist-mono), monospace",
              color: "var(--pa-muted)",
              borderTop: "1px solid var(--pa-card-border)",
            }}
          >
            {JSON.stringify(debugPayload, null, 2)}
          </pre>
        </Card>
      ) : null}

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
        <div className="p-3 pt-0">
          <ButtonOutline className="w-full" onClick={() => void copyImproved()}>
            {copied ? "Copied" : "Copy improved"}
          </ButtonOutline>
        </div>
      </Card>
    </div>
  );
}
