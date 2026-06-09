"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { requireAuth } from "@/app/_lib/auth-guard";
import { DuplicateWarningModal } from "@/components/upload/DuplicateWarningModal";
import { ButtonGradient } from "@/components/ui/ButtonGradient";
import { ButtonOutline } from "@/components/ui/ButtonOutline";
import { Card } from "@/components/ui/Card";
import { CardHeader } from "@/components/ui/CardHeader";
import { ScoreBar } from "@/components/ui/ScoreBar";
import { ScoreRing } from "@/components/ui/ScoreRing";
import { Spinner } from "@/components/ui/Spinner";
import { PromptReviewFallback, PromptReviewPanel } from "@/components/upload/PromptReviewPanel";
import type { AnalysisDimensions, AnalysisPayload } from "@/components/upload/uploadTypes";
import type { DuplicateCheckResult } from "@/lib/prompt-duplicates";

type SaveOutcome = "published" | "under_review" | "rejected" | "draft_saved";

type SaveApiResponse = {
  message?: string;
  outcome?: SaveOutcome;
  debug?: Record<string, unknown>;
  error?: string;
};

const DIMENSION_ORDER: Array<{ key: keyof AnalysisDimensions; label: string }> = [
  { key: "clarity", label: "Clarity" },
  { key: "specificity", label: "Specificity" },
  { key: "completeness", label: "Completeness" },
  { key: "context", label: "Context" },
  { key: "actionability", label: "Actionability" },
  { key: "outputDefinition", label: "Output Definition" },
];

function scoreBarColor(value: number): string {
  if (value <= 40) return "var(--pa-acc3)";
  if (value <= 70) return "#f59e0b";
  return "var(--pa-acc2)";
}

function barsFromLegacyBreakdown(b: NonNullable<AnalysisPayload["breakdown"]>) {
  return [
    { label: "Accuracy", value: b.accuracy, color: scoreBarColor(b.accuracy) },
    { label: "Clarity", value: b.clarity, color: scoreBarColor(b.clarity) },
    { label: "Structure", value: b.structure, color: scoreBarColor(b.structure) },
    { label: "Conciseness", value: b.specificity, color: scoreBarColor(b.specificity) },
  ];
}

const FALLBACK_PROVIDER_LABELS: Record<string, string> = {
  auto: "Auto",
  openai: "OpenAI",
  ollama: "Ollama",
  local: "Local rules",
};

function moderationFallbackLabel(id: string): string {
  return FALLBACK_PROVIDER_LABELS[id] ?? id;
}

function AnalyzerStatusNote({ analysis }: Readonly<{ analysis: AnalysisPayload }>) {
  const aiStatus = analysis.aiStatus;
  const pipelineScore = analysis.moderation?.pipelineScore;
  const qualitySource = analysis.qualitySource ?? "rules";
  const moderationProvider = analysis.moderation?.moderationProvider;
  const moderationProviderLabel = analysis.moderation?.moderationProviderLabel;
  const moderationFallbacks = analysis.moderation?.moderationFallbacks ?? [];
  const noteStyle = {
    background: "rgba(245,158,11,0.12)",
    border: "1px solid rgba(245,158,11,0.35)",
    fontSize: 11,
    color: "#b45309",
    lineHeight: 1.5,
  } as const;
  const infoStyle = {
    background: "var(--pa-hint)",
    border: "1px solid var(--pa-card-border)",
    fontSize: 11,
    color: "var(--pa-muted)",
    lineHeight: 1.5,
  } as const;

  const providerLabel = analysis.providerLabel ?? "Local analyzer";

  // Intentional local analysis — no banner.
  if (qualitySource === "rules" && !analysis.fallbackFrom) {
    return null;
  }

  if (qualitySource === "rules" && analysis.fallbackFrom) {
    const fallbackLabel =
      FALLBACK_PROVIDER_LABELS[analysis.fallbackFrom] ?? analysis.fallbackFrom;
    return (
      <div className="mt-3 rounded-lg px-3 py-2" style={noteStyle}>
        {fallbackLabel} was unavailable. Results use the local analyzer instead.
      </div>
    );
  }

  if (aiStatus === "error") {
    return (
      <div className="mt-3 rounded-lg px-3 py-2" style={noteStyle}>
        Publish moderation could not run. Using rule-only scoring
        {typeof pipelineScore === "number" ? ` (${pipelineScore}/100)` : ""}.
      </div>
    );
  }

  if (aiStatus === "skipped") {
    return (
      <div className="mt-3 rounded-lg px-3 py-2" style={noteStyle}>
        AI moderation was skipped for this prompt (severe rule failure). Quality analysis above used{" "}
        {providerLabel}.
      </div>
    );
  }

  if (
    aiStatus === "ok" &&
    moderationProvider === "local" &&
    moderationFallbacks.length > 0
  ) {
    return (
      <div className="mt-3 rounded-lg px-3 py-2" style={infoStyle}>
        Publish moderation used local rule scoring.{" "}
        {moderationFallbacks.map(moderationFallbackLabel).join(" and ")} were unavailable.
      </div>
    );
  }

  if (aiStatus === "ok" && moderationProvider && moderationProvider !== "local") {
    return null;
  }

  if (
    typeof pipelineScore === "number" &&
    pipelineScore !== analysis.score &&
    analysis.source === "rule+ai"
  ) {
    return (
      <div
        className="mt-3 rounded-lg px-3 py-2"
        style={{
          background: "var(--pa-hint)",
          border: "1px solid var(--pa-card-border)",
          fontSize: 11,
          color: "var(--pa-muted)",
          lineHeight: 1.5,
        }}
      >
        Save &amp; publish uses a separate moderation score ({pipelineScore}/100)
        {moderationProviderLabel ? ` from ${moderationProviderLabel}` : ""}. The score shown here is from{" "}
        {providerLabel}.
      </div>
    );
  }

  return null;
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
  const [saveIntentPending, setSaveIntentPending] = useState<"draft" | "publish" | null>(null);
  const [saveResult, setSaveResult] = useState<{
    message: string;
    outcome: SaveOutcome | "unknown";
    debug?: Record<string, unknown>;
  } | null>(null);
  const [duplicateWarning, setDuplicateWarning] = useState<DuplicateCheckResult | null>(null);

  const displayScore = analysis.score;
  const dimensions = analysis.dimensions;
  const legacyBreakdown = analysis.breakdown ?? {
    clarity: displayScore,
    structure: displayScore,
    specificity: displayScore,
    outputDefinition: displayScore,
    accuracy: displayScore,
  };

  const canAutoPublish = Boolean(analysis.moderation?.canAutoPublish);
  const publishLabel = canAutoPublish ? "Save & publish" : "Submit for review";
  const publishPendingLabel = canAutoPublish ? "Saving & publishing…" : "Submitting…";

  async function performSave(saveIntent: "draft" | "publish") {
    onError(null);
    setSaveResult(null);
    if (saveIntentPending) return;
    setSaveIntentPending(saveIntent);
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
    setSaveIntentPending(null);
    if (!ok) return;
  }

  async function saveToLibrary(saveIntent: "draft" | "publish") {
    if (saveIntent === "draft") {
      await performSave("draft");
      return;
    }

    try {
      const res = await fetch("/api/prompts/check-duplicates", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ content }),
      });
      const body = (await res.json().catch(() => null)) as DuplicateCheckResult | null;
      if (res.ok && body?.isDuplicate && body.riskLevel !== "none") {
        setDuplicateWarning(body);
        return;
      }
    } catch {
      // Best-effort duplicate check — proceed if check fails.
    }

    await performSave("publish");
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
          right={<span style={{ color: "var(--pa-acc1)", fontSize: 11 }}>{displayScore} / 100</span>}
        />
        <div className="p-4">
          <ScoreRing score={displayScore} />

          <AnalyzerStatusNote analysis={analysis} />

          {analysis.promptType || analysis.detectedIntent ? (
            <div
              className="mt-3 flex flex-col gap-2"
              style={{
                padding: "10px 12px",
                borderRadius: 10,
                background: "var(--pa-hint)",
              }}
            >
              {analysis.promptType ? (
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    style={{
                      fontSize: 10,
                      fontWeight: 600,
                      padding: "3px 10px",
                      borderRadius: 999,
                      background: "rgba(99,102,241,0.12)",
                      color: "var(--pa-acc1)",
                    }}
                  >
                    {analysis.promptType}
                  </span>
                </div>
              ) : null}
              {analysis.detectedIntent ? (
                <p style={{ fontSize: 11, color: "var(--pa-muted)", lineHeight: 1.5 }}>
                  <span style={{ fontWeight: 600, color: "var(--pa-text)" }}>Detected intent: </span>
                  {analysis.detectedIntent}
                </p>
              ) : null}
            </div>
          ) : null}

          {analysis.moderation ? (
            <p className="mt-3" style={{ fontSize: 11, color: "var(--pa-muted)", lineHeight: 1.5 }}>
              Publish eligibility uses moderation status{" "}
              <strong>{analysis.moderation.pipelineStatus}</strong> (threshold &gt;{" "}
              <strong>{analysis.moderation.autoPublishThresholdExclusive}</strong>
              {typeof analysis.moderation.pipelineScore === "number"
                ? `, pipeline score ${analysis.moderation.pipelineScore}`
                : ""}
              ).
              {canAutoPublish ? " You may use Save & publish." : " Use Submit for review or save as draft."}
            </p>
          ) : null}
          <div className="mt-4 grid gap-1">
            {dimensions
              ? DIMENSION_ORDER.map(({ key, label }) => (
                  <ScoreBar
                    key={key}
                    label={label}
                    value={dimensions[key]}
                    color={scoreBarColor(dimensions[key])}
                  />
                ))
              : barsFromLegacyBreakdown(legacyBreakdown).map((row) => (
                  <ScoreBar key={row.label} label={row.label} value={row.value} color={row.color} />
                ))}
          </div>
        </div>
        <div
          className="flex flex-col gap-2 border-t"
          style={{ borderColor: "var(--pa-card-border)", padding: "10px 14px" }}
        >
          <div className="flex flex-col gap-2 sm:flex-row">
            <ButtonOutline
              className="flex-1"
              onClick={() => void saveToLibrary("draft")}
              disabled={pending || saveIntentPending !== null}
            >
              {saveIntentPending === "draft" ? (
                <span className="inline-flex items-center justify-center gap-2">
                  <Spinner size="sm" />
                  Saving draft…
                </span>
              ) : (
                "Save as draft"
              )}
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
                disabled={pending || saveIntentPending !== null}
              >
                {saveIntentPending === "publish" ? (
                  <span className="inline-flex items-center justify-center gap-2">
                    <Spinner size="sm" />
                    {publishPendingLabel}
                  </span>
                ) : (
                  publishLabel
                )}
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

      {duplicateWarning ? (
        <DuplicateWarningModal
          result={duplicateWarning}
          busy={saveIntentPending === "publish"}
          onCancel={() => setDuplicateWarning(null)}
          onSubmitAnyway={() => {
            setDuplicateWarning(null);
            void performSave("publish");
          }}
        />
      ) : null}

      {analysis.review ? (
        <PromptReviewPanel review={analysis.review} />
      ) : (
        <PromptReviewFallback analysis={analysis} />
      )}

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
        <CardHeader title="Improved Prompt" />
        <div className="p-3">
          <div style={{ fontSize: 9, textTransform: "uppercase", color: "var(--pa-muted)" }}>
            Improved prompt
          </div>
          <p className="mt-1" style={{ fontSize: 10, color: "var(--pa-muted)", lineHeight: 1.45 }}>
            An expanded development brief inferred from your prompt — concrete UI, logic, and tech
            sections you can paste into your editor or send to an AI. It is not a meta-instruction
            wrapper.
          </p>
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
