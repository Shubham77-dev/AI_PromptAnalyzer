"use client";

import { Spinner } from "@/components/ui/Spinner";

const STEPS = [
  "Read",
  "Score clarity",
  "Score accuracy",
  "Generate suggestions",
  "Build improved prompt",
] as const;

export interface AnalysisStepsProps {
  currentStep: 1 | 2 | 3 | 4 | 5;
}

export function AnalysisSteps({ currentStep }: Readonly<AnalysisStepsProps>) {
  return (
    <div className="mt-3">
      {STEPS.map((label, i) => {
        const n = (i + 1) as 1 | 2 | 3 | 4 | 5;
        const done = n < currentStep;
        const active = n === currentStep;
        return (
          <div
            key={label}
            className="mb-1 flex items-center gap-2 rounded-lg"
            style={{ padding: "7px 10px", background: "var(--pa-hint)" }}
          >
            <span
              className="grid shrink-0 place-items-center overflow-hidden rounded-full text-[11px]"
              style={{
                width: 18,
                height: 18,
                background: done
                  ? "var(--pa-acc2)"
                  : active
                    ? "var(--pa-acc1)"
                    : "var(--pa-card-border)",
                color: done ? "#000" : active ? "var(--pa-text)" : "var(--pa-muted)",
              }}
            >
              {done ? "✓" : active ? <Spinner size="sm" /> : n}
            </span>
            <span
              style={{
                fontSize: 11,
                color: active ? "var(--pa-acc1)" : "var(--pa-muted)",
                fontWeight: active ? 500 : 400,
              }}
            >
              {label}
            </span>
          </div>
        );
      })}
    </div>
  );
}
