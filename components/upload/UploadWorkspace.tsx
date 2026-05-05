"use client";

import { useEffect, useState } from "react";
import AnalyzingLoader from "@/components/ui/AnalyzingLoader";
import { AnalysisSteps } from "@/components/ui/AnalysisSteps";
import { UploadLeftColumn } from "@/components/upload/UploadLeftColumn";
import { UploadRecentCard } from "@/components/upload/UploadRecentCard";
import { UploadScorePanel } from "@/components/upload/UploadScorePanel";
import type { AnalysisPayload, RecentPromptRow } from "@/components/upload/uploadTypes";

export function UploadWorkspace({ recent }: Readonly<{ recent: RecentPromptRow[] }>) {
  const [content, setContent] = useState("");
  const [analysis, setAnalysis] = useState<AnalysisPayload | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [step, setStep] = useState<1 | 2 | 3 | 4 | 5>(1);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isAnalyzing) return;
    setStep(1);
    const id = globalThis.setInterval(() => {
      setStep((s) => (s < 5 ? ((s + 1) as 1 | 2 | 3 | 4 | 5) : s));
    }, 900);
    return () => globalThis.clearInterval(id);
  }, [isAnalyzing]);

  async function analyze() {
    setError(null);
    setIsAnalyzing(true);
    setAnalysis(null);
    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          content,
          ...(process.env.NODE_ENV === "development" ? { debug: true } : {}),
        }),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => null)) as { error?: string } | null;
        throw new Error(body?.error || "Analyze failed");
      }
      const data = (await res.json()) as AnalysisPayload;
      setAnalysis(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Analyze failed");
    } finally {
      setIsAnalyzing(false);
    }
  }

  return (
    <div className="grid gap-[14px] lg:grid-cols-2">
      <div className="flex flex-col gap-3">
        <UploadLeftColumn
          content={content}
          setContent={setContent}
          onAnalyze={analyze}
          isAnalyzing={isAnalyzing}
          error={error}
        />
        <UploadRecentCard rows={recent} onPick={setContent} />
      </div>

      <div>
        {!analysis && !isAnalyzing ? (
          <div
            className="flex min-h-[200px] flex-col items-center justify-center border border-dashed"
            style={{ borderColor: "var(--pa-hint)", borderRadius: 12 }}
          >
            <div
              className="grid h-9 w-9 place-items-center rounded-full"
              style={{ background: "var(--pa-hint)" }}
            >
              <span style={{ color: "var(--pa-muted)" }}>i</span>
            </div>
            <div className="mt-2 text-center" style={{ fontSize: 11, color: "var(--pa-muted)" }}>
              Score and suggestions will appear here
            </div>
          </div>
        ) : null}

        {isAnalyzing ? (
          <div>
            <AnalyzingLoader />
            <AnalysisSteps currentStep={step} />
          </div>
        ) : null}

        {analysis && !isAnalyzing ? (
          <UploadScorePanel analysis={analysis} content={content} onError={setError} />
        ) : null}
      </div>
    </div>
  );
}
