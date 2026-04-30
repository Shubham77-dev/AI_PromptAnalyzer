import type { ReactNode } from "react";

export type StatCardTone = "neutral" | "good" | "warn" | "bad";

export interface StatCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon?: ReactNode;
  tone?: StatCardTone;
}

function toneClasses(tone: StatCardTone) {
  switch (tone) {
    case "good":
      return {
        ring: "ring-emerald-200",
        icon: "bg-emerald-50 text-emerald-700 ring-emerald-200",
      };
    case "warn":
      return {
        ring: "ring-amber-200",
        icon: "bg-amber-50 text-amber-700 ring-amber-200",
      };
    case "bad":
      return {
        ring: "ring-red-200",
        icon: "bg-red-50 text-red-700 ring-red-200",
      };
    default:
      return {
        ring: "ring-black/10",
        icon: "bg-[#EEEDFE] text-[#534AB7] ring-black/10",
      };
  }
}

export function StatCard({
  title,
  value,
  description,
  icon,
  tone = "neutral",
}: Readonly<StatCardProps>) {
  const t = toneClasses(tone);
  return (
    <div className={["rounded-xl bg-white p-4 shadow-sm ring-1", t.ring].join(" ")}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-xs font-medium text-gray-500">{title}</div>
          <div className="mt-1 text-2xl font-semibold text-gray-900">{value}</div>
          {description ? (
            <div className="mt-1 text-xs text-gray-500">{description}</div>
          ) : null}
        </div>
        {icon ? (
          <div className={["grid h-9 w-9 place-items-center rounded-lg ring-1", t.icon].join(" ")}>
            {icon}
          </div>
        ) : null}
      </div>
    </div>
  );
}

