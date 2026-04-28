"use client";

export type ScoreTone = "green" | "amber" | "red";

function toneForScore(score: number): ScoreTone {
  if (score >= 80) return "green";
  if (score >= 50) return "amber";
  return "red";
}

const TONE_CLASSES: Record<ScoreTone, string> = {
  green: "bg-[#EAF3DE] text-[#27500A] border-[#EAF3DE]",
  amber: "bg-[#FAEEDA] text-[#633806] border-[#FAEEDA]",
  red: "bg-[#FCEBEB] text-[#791F1F] border-[#FCEBEB]",
};

export function ScorePill({ label, score }: Readonly<{ label: string; score: number }>) {
  const tone = toneForScore(score);
  return (
    <span
      className={[
        "inline-flex items-center rounded-lg border-[0.5px] px-2 py-1 text-xs font-medium",
        TONE_CLASSES[tone],
      ].join(" ")}
    >
      {label} {score}
    </span>
  );
}

