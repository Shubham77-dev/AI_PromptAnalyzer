export interface ScoreBarProps {
  label: string;
  value: number;
  color: string;
  compact?: boolean;
}

export function ScoreBar({ label, value, color, compact }: Readonly<ScoreBarProps>) {
  const w = Math.max(0, Math.min(100, value));
  const pad = compact ? "2px 0" : "4px 14px";
  return (
    <div className="flex items-center gap-2" style={{ padding: pad, gap: 8 }}>
      <span
        className="shrink-0"
        style={{ fontSize: 11, color: "var(--pa-muted)", width: compact ? 52 : 58 }}
      >
        {label}
      </span>
      <div
        className="min-w-0 flex-1 overflow-hidden rounded"
        style={{ height: 4, background: "var(--pa-hint)" }}
      >
        <div
          style={{
            height: 4,
            borderRadius: 4,
            background: color,
            width: `${w}%`,
            transformOrigin: "left center",
            animation: "pa-bar 0.9s ease forwards",
          }}
        />
      </div>
      <span
        className="shrink-0 text-right tabular-nums"
        style={{ fontSize: 11, color: "var(--pa-text)", width: 22 }}
      >
        {w}
      </span>
    </div>
  );
}
