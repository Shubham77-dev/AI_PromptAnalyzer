"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CopyButton } from "@/app/_components/CopyButton";

type Analysis = {
  score: number;
  issues: string[];
  suggestions: string[];
  improvedPrompt: string;
  source?: "ai" | "rules" | "merged";
};

export function UploadForm() {
  const router = useRouter();
  const [content, setContent] = useState("");
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const canAnalyze = content.trim().length > 0 && !isAnalyzing;
  const canSave = content.trim().length > 0 && !!analysis && !isPending;

  const scoreLabel = useMemo(() => {
    if (!analysis) return null;
    const s = analysis.score;
    if (s >= 80) return "Strong";
    if (s >= 60) return "Good";
    return "Needs work";
  }, [analysis]);

  async function analyze() {
    setError(null);
    setIsAnalyzing(true);
    setAnalysis(null);

    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ content }),
      });

      if (!res.ok) {
        const body = (await res.json().catch(() => null)) as { error?: string } | null;
        throw new Error(body?.error || "Analyze failed");
      }

      const data = (await res.json()) as Analysis;
      setAnalysis(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Analyze failed");
    } finally {
      setIsAnalyzing(false);
    }
  }

  async function saveDraft() {
    setError(null);
    const res = await fetch("/api/prompt", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ content, analysis }),
    });

    if (!res.ok) {
      const body = (await res.json().catch(() => null)) as { error?: string } | null;
      setError(body?.error || "Save failed");
      return;
    }

    startTransition(() => router.push("/dashboard"));
  }

  return (
    <div className="grid gap-6">
      <div className="rounded-2xl border border-zinc-200 bg-white p-6">
        <label htmlFor="prompt-content" className="text-sm font-medium">
          Prompt
        </label>
        <textarea
          id="prompt-content"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Paste your prompt here…"
          className="mt-2 min-h-[220px] w-full resize-y rounded-xl border border-zinc-200 bg-white p-3 text-sm outline-none focus:ring-2 focus:ring-zinc-900/10"
        />
        <div className="mt-4 flex flex-wrap gap-3">
          <button
            onClick={analyze}
            disabled={!canAnalyze}
            className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-60"
          >
            {isAnalyzing ? "Analyzing…" : "Analyze"}
          </button>
          <button
            onClick={saveDraft}
            disabled={!canSave}
            className="rounded-md border border-zinc-200 bg-white px-4 py-2 text-sm font-medium hover:bg-zinc-50 disabled:opacity-60"
            title={!analysis ? "Analyze before saving to store ratings" : undefined}
          >
            Save draft
          </button>
          {error ? <div className="text-sm text-red-600">{error}</div> : null}
        </div>
      </div>

      <div className="rounded-2xl border border-zinc-200 bg-white p-6">
        <div className="flex items-baseline justify-between gap-3">
          <div>
            <div className="text-sm font-semibold">AI analysis</div>
            <div className="mt-1 text-sm text-zinc-600">
              {analysis
                ? `Overall: ${scoreLabel} (${analysis.score}/100)${analysis.source ? ` · ${analysis.source}` : ""}`
                : "Run analysis to get accuracy, clarity, and suggestions."}
            </div>
          </div>
        </div>

        {analysis ? (
          <div className="mt-4 grid gap-4 md:grid-cols-3">
            <div className="rounded-xl border border-zinc-200 p-4">
              <div className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                Score
              </div>
              <div className="mt-1 text-2xl font-semibold">{analysis.score}</div>
            </div>
            <div className="rounded-xl border border-zinc-200 p-4">
              <div className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                Issues
              </div>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-zinc-700">
                {analysis.issues.length ? (
                  analysis.issues.slice(0, 6).map((s, i) => <li key={i}>{s}</li>)
                ) : (
                  <li>No major issues detected.</li>
                )}
              </ul>
            </div>
            <div className="rounded-xl border border-zinc-200 p-4 md:col-span-1">
              <div className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                Suggestions
              </div>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-zinc-700">
                {analysis.suggestions.slice(0, 8).map((s, i) => (
                  <li key={i}>{s}</li>
                ))}
              </ul>
            </div>

            <div className="rounded-xl border border-zinc-200 p-4 md:col-span-3">
              <div className="flex items-center justify-between gap-3">
                <div className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                  Improved prompt
                </div>
                <CopyButton text={analysis.improvedPrompt} />
              </div>
              <div className="mt-2 whitespace-pre-wrap rounded-lg border border-zinc-200 bg-zinc-50 p-3 text-sm text-zinc-800">
                {analysis.improvedPrompt}
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

