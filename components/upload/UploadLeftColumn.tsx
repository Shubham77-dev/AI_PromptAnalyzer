"use client";

import { useRef } from "react";
import { AnalyzerProviderSelect } from "@/components/upload/AnalyzerProviderSelect";
import type { QualityAnalyzerId, QualityAnalyzerProviderOption } from "@/components/upload/uploadTypes";
import { ButtonGradient } from "@/components/ui/ButtonGradient";
import { Card } from "@/components/ui/Card";
import { CardHeader } from "@/components/ui/CardHeader";
import { Spinner } from "@/components/ui/Spinner";

const MAX = 4000;

const CHIPS: { label: string; text: string }[] = [
  { label: "+ Role", text: "You are a " },
  { label: "+ Task", text: "Your task is to " },
  { label: "+ Format", text: "Return the result as " },
  { label: "+ Example", text: "\nExample:\nInput: ...\nOutput: ...\n\n" },
];

function UploadOrb() {
  return (
    <div
      className="mx-auto grid place-items-center pa-float-orb"
      style={{ background: "var(--pa-grad)", width: 40, height: 40, borderRadius: 12 }}
    >
      <svg width={18} height={18} viewBox="0 0 20 20" aria-hidden>
        <path
          d="M10 13V5M10 5L7 8M10 5l3 3"
          stroke="white"
          strokeWidth="1.4"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
        <path
          d="M4 15v1a1.5 1.5 0 001.5 1.5h9A1.5 1.5 0 0016 16v-1"
          stroke="white"
          strokeWidth="1.4"
          strokeLinecap="round"
          fill="none"
        />
      </svg>
    </div>
  );
}

export function UploadLeftColumn({
  content,
  setContent,
  onAnalyze,
  isAnalyzing,
  error,
  analyzerProvider,
  onAnalyzerProviderChange,
  providers,
}: Readonly<{
  content: string;
  setContent: (s: string) => void;
  onAnalyze: () => void;
  isAnalyzing: boolean;
  error: string | null;
  analyzerProvider: QualityAnalyzerId;
  onAnalyzerProviderChange: (id: QualityAnalyzerId) => void;
  providers: QualityAnalyzerProviderOption[];
}>) {
  const inputRef = useRef<HTMLInputElement>(null);
  const len = content.length;
  const can = len >= 20 && !isAnalyzing;

  function onFile(f: File | null) {
    if (!f) return;
    f.text().then((t) => setContent(t.slice(0, MAX))).catch(() => null);
  }

  return (
    <Card>
      <CardHeader title="Upload or paste" />
      <div className="p-4">
        <input
          ref={inputRef}
          type="file"
          accept=".txt,.md,.json"
          className="hidden"
          onChange={(e) => onFile(e.target.files?.[0] ?? null)}
        />
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="w-full border-2 border-dashed text-center transition-colors"
          style={{
            borderColor: "var(--pa-hint)",
            borderRadius: 10,
            padding: 20,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = "var(--pa-acc1)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = "var(--pa-hint)";
          }}
        >
          <UploadOrb />
          <div className="mt-3 text-xs font-medium" style={{ color: "var(--pa-text)" }}>
            Drop file or click to browse
          </div>
          <div className="mt-1 text-[10px]" style={{ color: "var(--pa-muted)" }}>
            .txt .md .json — up to 2 MB
          </div>
        </button>

        <div className="my-4 flex items-center gap-2">
          <div className="h-px flex-1" style={{ background: "var(--pa-hint)" }} />
          <span style={{ fontSize: 10, color: "var(--pa-muted)" }}>or paste below</span>
          <div className="h-px flex-1" style={{ background: "var(--pa-hint)" }} />
        </div>

        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value.slice(0, MAX))}
          className="w-full resize-none font-mono outline-none"
          style={{
            minHeight: 80,
            background: "var(--pa-hint)",
            border: "1px solid var(--pa-card-border)",
            borderRadius: 8,
            padding: "8px 12px",
            fontSize: 11,
            color: "var(--pa-text)",
          }}
          onFocus={(e) => {
            e.currentTarget.style.borderColor = "var(--pa-acc1)";
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = "var(--pa-card-border)";
          }}
        />

        <div className="mt-2 flex justify-between text-[10px]">
          <span style={{ color: len > 20 ? "var(--pa-acc2)" : "var(--pa-muted)" }}>
            {len > 20 ? "Ready to analyze" : "Start typing..."}
          </span>
          <span style={{ color: "var(--pa-muted)" }}>
            {len} / {MAX}
          </span>
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          {CHIPS.map((c) => (
            <button
              key={c.label}
              type="button"
              onClick={() => setContent((content + c.text).slice(0, MAX))}
              className="transition-colors"
              style={{
                fontSize: 10,
                padding: "3px 9px",
                borderRadius: 20,
                border: "1px solid var(--pa-hint)",
                color: "var(--pa-muted)",
                background: "transparent",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "var(--pa-acc1)";
                e.currentTarget.style.color = "var(--pa-acc1)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "var(--pa-hint)";
                e.currentTarget.style.color = "var(--pa-muted)";
              }}
            >
              {c.label}
            </button>
          ))}
        </div>

        {error ? (
          <div className="mt-2" style={{ fontSize: 11, color: "var(--pa-acc3)" }}>
            {error}
          </div>
        ) : null}

        <AnalyzerProviderSelect
          providers={providers}
          value={analyzerProvider}
          onChange={onAnalyzerProviderChange}
          disabled={isAnalyzing}
        />

        <div className="mt-3">
          <ButtonGradient
            fullWidth
            disabled={!can}
            onClick={onAnalyze}
            className="rounded-[10px] py-2 text-xs"
          >
            {isAnalyzing ? (
              <span className="inline-flex items-center justify-center gap-2">
                <Spinner size="sm" /> Analyzing...
              </span>
            ) : (
              "Analyze prompt"
            )}
          </ButtonGradient>
        </div>
      </div>
    </Card>
  );
}
