"use client";

import { useEffect } from "react";
import type { QualityAnalyzerId, QualityAnalyzerProviderOption } from "@/components/upload/uploadTypes";

const PROVIDER_ORDER: QualityAnalyzerId[] = ["local", "auto", "openai", "ollama"];

function orderedProviders(providers: QualityAnalyzerProviderOption[]): QualityAnalyzerProviderOption[] {
  const map = new Map(providers.map((p) => [p.id, p]));
  return PROVIDER_ORDER.map((id) => map.get(id)).filter(Boolean) as QualityAnalyzerProviderOption[];
}

function statusLabel(provider: QualityAnalyzerProviderOption): string {
  if (provider.id === "local") return "Always available";
  if (provider.available) return "Ready";
  return "API key required";
}

function statusColor(provider: QualityAnalyzerProviderOption): string {
  if (provider.id === "local" || provider.available) return "var(--pa-acc2)";
  return "var(--pa-muted)";
}

export function AnalyzerProviderSelect({
  providers,
  value,
  onChange,
  disabled,
}: Readonly<{
  providers: QualityAnalyzerProviderOption[];
  value: QualityAnalyzerId;
  onChange: (id: QualityAnalyzerId) => void;
  disabled?: boolean;
}>) {
  const sorted = orderedProviders(providers);
  const selected = sorted.find((p) => p.id === value) ?? sorted[0];

  useEffect(() => {
    const current = providers.find((p) => p.id === value);
    if (current && !current.available && current.id !== "local") {
      onChange("local");
    }
  }, [providers, value, onChange]);

  function select(id: QualityAnalyzerId) {
    if (disabled) return;
    const provider = sorted.find((p) => p.id === id);
    if (!provider) return;
    if (!provider.available && provider.id !== "local") return;
    onChange(id);
  }

  const canSelect = (p: QualityAnalyzerProviderOption) => p.available || p.id === "local";

  return (
    <div className="mt-4">
      <div className="mb-3 flex items-center gap-2">
        <div className="h-px flex-1" style={{ background: "var(--pa-hint)" }} />
        <span
          style={{
            fontSize: 10,
            color: "var(--pa-muted)",
            textTransform: "uppercase",
            letterSpacing: "0.4px",
          }}
        >
          Analysis engine
        </span>
        <div className="h-px flex-1" style={{ background: "var(--pa-hint)" }} />
      </div>

      <div className="flex flex-wrap gap-2">
        {sorted.map((p) => {
          const active = p.id === value;
          const selectable = canSelect(p);
          return (
            <button
              key={p.id}
              type="button"
              disabled={disabled || !selectable}
              onClick={() => select(p.id)}
              className="inline-flex items-center gap-1.5 font-medium transition-colors"
              style={{
                fontSize: 10,
                padding: "5px 11px",
                borderRadius: 20,
                border: active ? "1px solid var(--pa-acc1)" : "1px solid var(--pa-card-border)",
                color: active ? "var(--pa-acc1)" : selectable ? "var(--pa-text)" : "var(--pa-muted)",
                background: active
                  ? "color-mix(in srgb, var(--pa-acc1) 12%, transparent)"
                  : "transparent",
                opacity: selectable ? 1 : 0.5,
                cursor: disabled || !selectable ? "not-allowed" : "pointer",
              }}
              onMouseEnter={(e) => {
                if (disabled || !selectable || active) return;
                e.currentTarget.style.borderColor = "var(--pa-acc1)";
                e.currentTarget.style.color = "var(--pa-acc1)";
              }}
              onMouseLeave={(e) => {
                if (active) return;
                e.currentTarget.style.borderColor = "var(--pa-card-border)";
                e.currentTarget.style.color = selectable ? "var(--pa-text)" : "var(--pa-muted)";
              }}
            >
              <span
                aria-hidden
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: "50%",
                  background: statusColor(p),
                  flexShrink: 0,
                }}
              />
              {p.label}
            </button>
          );
        })}
      </div>

      {selected ? (
        <div
          className="mt-2.5 rounded-lg"
          style={{
            padding: "9px 11px",
            background: "var(--pa-hint)",
            border: "1px solid var(--pa-card-border)",
            borderRadius: 8,
          }}
        >
          <div className="flex items-start justify-between gap-2">
            <p style={{ fontSize: 11, color: "var(--pa-text)", lineHeight: 1.5, margin: 0 }}>
              {selected.description}
            </p>
            <span
              className="shrink-0"
              style={{
                fontSize: 9,
                fontWeight: 600,
                padding: "2px 7px",
                borderRadius: 999,
                textTransform: "uppercase",
                letterSpacing: "0.3px",
                color: statusColor(selected),
                background: `color-mix(in srgb, ${statusColor(selected)} 14%, transparent)`,
              }}
            >
              {statusLabel(selected)}
            </span>
          </div>
          {selected.id === "auto" && selected.available ? (
            <p className="mt-1.5" style={{ fontSize: 10, color: "var(--pa-muted)", lineHeight: 1.45, margin: 0 }}>
              Tries OpenAI first, then Ollama, then local.
            </p>
          ) : null}
          {!selected.available && selected.id !== "local" ? (
            <p className="mt-1.5" style={{ fontSize: 10, color: "var(--pa-muted)", lineHeight: 1.45, margin: 0 }}>
              Add the API key to your server environment to enable this engine.
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
