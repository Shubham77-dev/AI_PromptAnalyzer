export function LandingFeatures() {
  return (
    <div className="mx-auto grid w-full max-w-[560px] grid-cols-1 gap-3 sm:grid-cols-3">
      <div className="pa-card p-4 text-left">
        <div
          className="grid h-9 w-9 place-items-center rounded-[10px]"
          style={{
            background: "color-mix(in srgb, var(--pa-acc1) 15%, transparent)",
            border: "1px solid color-mix(in srgb, var(--pa-acc1) 30%, transparent)",
          }}
        >
          <svg width={18} height={18} viewBox="0 0 18 18" aria-hidden>
            <circle cx="9" cy="9" r="7" stroke="var(--pa-acc1)" strokeWidth={1.4} fill="none" />
            <path d="M7 9l1.5 1.5L11.5 7" stroke="var(--pa-acc1)" strokeWidth={1.4} strokeLinecap="round" fill="none" />
          </svg>
        </div>
        <div className="mt-3 text-xs font-medium" style={{ color: "var(--pa-text)" }}>
          AI scoring
        </div>
        <p className="mt-1 text-[10px] leading-snug" style={{ color: "var(--pa-muted)" }}>
          Accuracy and clarity scored 0–100 with breakdown
        </p>
      </div>
      <div className="pa-card p-4 text-left">
        <div
          className="grid h-9 w-9 place-items-center rounded-[10px]"
          style={{
            background: "color-mix(in srgb, var(--pa-acc2) 15%, transparent)",
            border: "1px solid color-mix(in srgb, var(--pa-acc2) 30%, transparent)",
          }}
        >
          <svg width={18} height={18} viewBox="0 0 18 18" aria-hidden>
            <path d="M3 5h12M3 8h12M3 11h8" stroke="var(--pa-acc2)" strokeWidth={1.4} strokeLinecap="round" fill="none" />
          </svg>
        </div>
        <div className="mt-3 text-xs font-medium" style={{ color: "var(--pa-text)" }}>
          Smart suggestions
        </div>
        <p className="mt-1 text-[10px] leading-snug" style={{ color: "var(--pa-muted)" }}>
          Actionable fixes with an improved prompt preview
        </p>
      </div>
      <div className="pa-card p-4 text-left">
        <div
          className="grid h-9 w-9 place-items-center rounded-[10px]"
          style={{
            background: "color-mix(in srgb, var(--pa-acc3) 15%, transparent)",
            border: "1px solid color-mix(in srgb, var(--pa-acc3) 30%, transparent)",
          }}
        >
          <svg width={18} height={18} viewBox="0 0 18 18" aria-hidden>
            <path d="M3 4h12M3 8h12M3 12h8" stroke="var(--pa-acc3)" strokeWidth={1.4} strokeLinecap="round" fill="none" />
          </svg>
        </div>
        <div className="mt-3 text-xs font-medium" style={{ color: "var(--pa-text)" }}>
          Public library
        </div>
        <p className="mt-1 text-[10px] leading-snug" style={{ color: "var(--pa-muted)" }}>
          Search, copy, and like top-rated prompts from others
        </p>
      </div>
    </div>
  );
}
