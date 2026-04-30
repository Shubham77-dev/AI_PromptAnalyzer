"use client";

import { useRef } from "react";
import { ButtonGradient } from "@/components/ui/ButtonGradient";
import { Card } from "@/components/ui/Card";
import { CardHeader } from "@/components/ui/CardHeader";
import { Spinner } from "@/components/ui/Spinner";

const MAX = 20_000;

const CHIPS: { label: string; text: string }[] = [
  { label: "+ Role", text: "You are a " },
  { label: "+ Task", text: "Your task is to " },
  { label: "+ Format", text: "Return the result as " },
  { label: "+ Tone", text: "Use a professional tone. " },
  { label: "+ Example", text: "\nExample:\nInput: ...\nOutput: ...\n\n" },
];

function UploadOrb() {
  return (
    <div
      className="mx-auto grid h-10 w-10 place-items-center rounded-xl pa-float-orb"
      style={{ backgroundImage: "var(--pa-grad)" }}
    >
      <svg width={20} height={20} viewBox="0 0 20 20" aria-hidden>
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
}: Readonly<{
  content: string;
  setContent: (s: string) => void;
  onAnalyze: () => void;
  isAnalyzing: boolean;
  error: string | null;
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
      <CardHeader title="Upload file" />
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
            borderRadius: 12,
            padding: 24,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = "var(--pa-acc1)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = "var(--pa-hint)";
          }}
        >
          <UploadOrb />
          <div className="mt-3 font-medium" style={{ fontSize: 13, color: "var(--pa-text)" }}>
            Drop file or browse
          </div>
          <div className="mt-1" style={{ fontSize: 11, color: "var(--pa-muted)" }}>
            Plain text, markdown, or JSON
          </div>
          <div className="mt-3 flex flex-wrap justify-center gap-2">
            {[".txt", ".md", ".json"].map((x) => (
              <span
                key={x}
                style={{
                  fontSize: 10,
                  padding: "2px 8px",
                  borderRadius: 20,
                  border: "1px solid var(--pa-hint)",
                  color: "var(--pa-muted)",
                }}
              >
                {x}
              </span>
            ))}
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
            minHeight: 100,
            background: "var(--pa-hint)",
            border: "1px solid var(--pa-card-border)",
            borderRadius: 10,
            padding: "10px 12px",
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

        <div className="mt-2 flex justify-between" style={{ fontSize: 10, color: "var(--pa-muted)" }}>
          <span style={{ color: len > 20 ? "var(--pa-acc2)" : "var(--pa-muted)" }}>
            {len > 20 ? "Ready to analyze" : "\u00a0"}
          </span>
          <span>
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
                padding: "4px 10px",
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

        <div className="mt-4">
          <ButtonGradient fullWidth disabled={!can} onClick={onAnalyze}>
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
