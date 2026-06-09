"use client";

import { Spinner } from "@/components/ui/Spinner";

export function FullPageLoader() {
  return (
    <div className="flex min-h-screen items-center justify-center" style={{ background: "var(--pa-bg)" }}>
      <div className="flex flex-col items-center gap-3">
        <div className="flex items-center gap-2 text-[15px] font-medium" style={{ color: "var(--pa-text)" }}>
          <span
            className="h-11 w-11 shrink-0 rounded-full pa-float-orb"
            style={{ backgroundImage: "var(--pa-grad)" }}
            aria-hidden
          />
          <span>PromptAnalyzer</span>
        </div>
        <Spinner size="lg" />
        <div style={{ fontSize: 12, color: "var(--pa-muted)" }}>Loading your workspace...</div>
      </div>
    </div>
  );
}

export default FullPageLoader;
