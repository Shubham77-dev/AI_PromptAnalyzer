"use client";

function barColor(score: number) {
  if (score >= 80) return "#1D9E75";
  if (score >= 50) return "#EF9F27";
  return "#E24B4A";
}

export function ScoreBar({ label, score }: Readonly<{ label: string; score: number }>) {
  return (
    <div className="flex items-center gap-3 text-xs text-gray-600">
      <div className="w-14 shrink-0">{label}</div>
      <div className="h-[3px] flex-1 overflow-hidden rounded-full bg-gray-200">
        <div
          className="h-full rounded-full"
          style={{ width: `${Math.max(0, Math.min(100, score))}%`, backgroundColor: barColor(score) }}
        />
      </div>
      <div className="w-7 shrink-0 text-right tabular-nums text-gray-700">{score}</div>
    </div>
  );
}

