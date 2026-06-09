"use client";

import { useEffect, useState } from "react";
import { LogoOrb } from "@/components/ui/LogoOrb";

const MESSAGES = [
  "Loading your workspace...",
  "Connecting to Supabase...",
  "Fetching prompt library...",
  "Almost ready...",
] as const;

export default function RouteLoading() {
  const [i, setI] = useState(0);
  useEffect(() => {
    const id = globalThis.setInterval(() => setI((v) => (v + 1) % MESSAGES.length), 2000);
    return () => globalThis.clearInterval(id);
  }, []);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-0" style={{ background: "var(--pa-bg)" }}>
      <div className="relative" style={{ width: 80, height: 80 }}>
        <div
          className="absolute rounded-full"
          style={{ width: 80, height: 80, border: "1px solid var(--pa-card-border)" }}
        />
        <div
          className="absolute rounded-full"
          style={{
            width: 80,
            height: 80,
            border: "2px solid transparent",
            borderTopColor: "var(--pa-acc1)",
            animation: "pa-spin 1s linear infinite",
          }}
        />
        <div
          className="absolute rounded-full"
          style={{
            width: 80,
            height: 80,
            border: "2px solid transparent",
            borderTopColor: "var(--pa-acc3)",
            animation: "pa-spin 1.4s linear infinite reverse",
            opacity: 0.6,
          }}
        />
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
          <LogoOrb size={44} radius={12} floating={false} />
        </div>
      </div>
      <div className="mt-5 text-lg font-medium" style={{ color: "var(--pa-text)" }}>
        PromptAnalyzer
      </div>
      <div className="mb-6 mt-1 text-xs" style={{ color: "var(--pa-muted)" }}>
        {MESSAGES[i]}
      </div>
      <div className="h-[3px] w-[200px] overflow-hidden rounded" style={{ background: "var(--pa-hint)" }}>
        <div
          className="h-full rounded"
          style={{
            background: "var(--pa-grad)",
            animation: "pa-pgrow 2.5s ease infinite",
          }}
        />
      </div>
      <div className="mt-8 flex w-[240px] flex-col gap-2.5">
        <div className="pa-card flex items-center justify-between gap-2 rounded-[10px] px-3 py-2.5">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full" style={{ background: "var(--pa-acc2)" }} />
            <span className="text-[11px]" style={{ color: "var(--pa-text)" }}>
              Loading authentication...
            </span>
          </div>
          <svg width={12} height={12} viewBox="0 0 12 12" aria-hidden>
            <path d="M2 6l2.5 2.5L10 3" stroke="var(--pa-acc2)" strokeWidth={1.3} strokeLinecap="round" fill="none" />
          </svg>
        </div>
        <div className="pa-card flex items-center gap-2 rounded-[10px] px-3 py-2.5">
          <span
            className="h-2 w-2 rounded-full"
            style={{
              background: "var(--pa-hint)",
              border: "1.5px solid var(--pa-hint)",
              borderTopColor: "var(--pa-acc1)",
              animation: "pa-spin 0.65s linear infinite",
            }}
          />
          <span className="text-[11px]" style={{ color: "var(--pa-text)" }}>
            Fetching your data...
          </span>
        </div>
        <div className="pa-card flex items-center gap-2 rounded-[10px] px-3 py-2.5 opacity-40">
          <span className="h-2 w-2 rounded-full" style={{ background: "var(--pa-hint)" }} />
          <span className="text-[11px]" style={{ color: "var(--pa-muted)" }}>
            Setting up workspace...
          </span>
        </div>
      </div>
    </div>
  );
}
