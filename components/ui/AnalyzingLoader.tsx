"use client";

import { useEffect, useState } from "react";
import { Spinner } from "@/components/ui/Spinner";

const MESSAGES = [
  "Reading prompt text...",
  "Scoring clarity...",
  "Scoring accuracy...",
  "Generating suggestions...",
  "Building improved prompt...",
] as const;

export interface AnalyzingLoaderProps {
  message?: string;
}

export function AnalyzingLoader({ message }: Readonly<AnalyzingLoaderProps>) {
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    const t = globalThis.setInterval(() => setIdx((v) => (v + 1) % MESSAGES.length), 1500);
    return () => globalThis.clearInterval(t);
  }, []);

  const sub = message ?? MESSAGES[idx];

  return (
    <div
      className="text-center"
      style={{
        background: "linear-gradient(180deg, var(--pa-hint), var(--pa-card))",
        border: "1px solid var(--pa-acc1)",
        borderRadius: 12,
        padding: 16,
      }}
    >
      <div className="mx-auto grid h-11 w-11 place-items-center rounded-full" style={{ border: "2px solid var(--pa-hint)" }}>
        <Spinner size="md" />
      </div>
      <div className="mt-3 font-medium" style={{ fontSize: 13, color: "var(--pa-text)" }}>
        Analyzing your prompt
      </div>
      <div className="mt-1" style={{ fontSize: 12, color: "var(--pa-muted)" }}>
        {sub}
      </div>
      <div className="mt-4 overflow-hidden rounded" style={{ height: 4, background: "var(--pa-hint)" }}>
        <div
          style={{
            height: 4,
            backgroundImage: "var(--pa-grad)",
            animation: "pa-pgrow 5s ease forwards",
            transformOrigin: "left center",
          }}
        />
      </div>
      <div className="mt-2 flex justify-between" style={{ fontSize: 10, color: "var(--pa-acc1)" }}>
        <span>Progress</span>
        <span>100%</span>
      </div>
    </div>
  );
}

export default AnalyzingLoader;
