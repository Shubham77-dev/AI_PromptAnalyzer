"use client";

export type PlanChoice = "FREE" | "PRO";

export interface PlanSelectorProps {
  value: PlanChoice;
  onChange: (p: PlanChoice) => void;
}

export function PlanSelector({ value, onChange }: Readonly<PlanSelectorProps>) {
  return (
    <div className="grid grid-cols-2 gap-2">
      <button
        type="button"
        onClick={() => onChange("FREE")}
        className="rounded-lg p-2.5 text-left transition-colors"
        style={{
          border: value === "FREE" ? "2px solid var(--pa-acc1)" : "1px solid var(--pa-card-border)",
          background: value === "FREE" ? "color-mix(in srgb, var(--pa-acc1) 8%, transparent)" : "transparent",
        }}
      >
        <div className="text-[11px] font-medium" style={{ color: "var(--pa-acc1)" }}>
          Free
        </div>
        <div className="mt-0.5 text-[10px]" style={{ color: "var(--pa-muted)" }}>
          10 analyses/day
        </div>
      </button>
      <button
        type="button"
        onClick={() => onChange("PRO")}
        className="rounded-lg p-2.5 text-left transition-colors"
        style={{
          border: value === "PRO" ? "2px solid var(--pa-acc1)" : "1px solid var(--pa-card-border)",
          background: value === "PRO" ? "color-mix(in srgb, var(--pa-acc1) 8%, transparent)" : "transparent",
        }}
      >
        <div className="text-[11px] font-medium" style={{ color: "var(--pa-text)" }}>
          Pro <span style={{ fontSize: 9, color: "var(--pa-acc4)" }}>$9/mo</span>
        </div>
        <div className="mt-0.5 text-[10px]" style={{ color: "var(--pa-muted)" }}>
          Unlimited · Library
        </div>
      </button>
    </div>
  );
}
