"use client";

import { useEffect, useState } from "react";
import { Spinner } from "@/components/ui/Spinner";
import { ProgressBar } from "@/components/ui/ProgressBar";

const MESSAGES = [
  "Checking clarity and structure...",
  "Scoring accuracy...",
  "Generating suggestions...",
  "Almost done...",
] as const;

export function AnalyzingLoader() {
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    const t = globalThis.setInterval(() => setIdx((v) => (v + 1) % MESSAGES.length), 1500);
    return () => globalThis.clearInterval(t);
  }, []);

  return (
    <div className="rounded-xl border-[0.5px] border-black/10 bg-white p-5">
      <div className="flex items-start gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#EEEDFE]">
          <Spinner size="sm" />
        </div>
        <div className="min-w-0">
          <div className="text-xs font-medium text-[#534AB7]">Analyzing prompt</div>
          <div className="mt-1 text-sm text-gray-600">{MESSAGES[idx]}</div>
          <div className="mt-3">
            <ProgressBar animated />
          </div>
        </div>
      </div>
    </div>
  );
}

export default AnalyzingLoader;

