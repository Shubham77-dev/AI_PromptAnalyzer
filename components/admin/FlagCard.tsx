import type { ReactNode } from "react";

export interface FlagCardProps {
  title: string;
  subtitle?: string;
  contentPreview: string;
  meta?: ReactNode;
  actions?: ReactNode;
}

function truncate(s: string, max = 260) {
  const t = s.trim();
  if (t.length <= max) return t;
  return t.slice(0, Math.max(0, max - 1)).trimEnd() + "…";
}

export function FlagCard({ title, subtitle, contentPreview, meta, actions }: Readonly<FlagCardProps>) {
  return (
    <div className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-red-200">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <div className="truncate text-sm font-semibold text-gray-900">{title}</div>
            <span className="inline-flex items-center rounded-full bg-red-50 px-2 py-0.5 text-[11px] font-semibold text-red-700 ring-1 ring-red-200">
              Review
            </span>
          </div>
          {subtitle ? <div className="mt-0.5 text-xs text-gray-500">{subtitle}</div> : null}
        </div>
        {actions ? <div className="shrink-0">{actions}</div> : null}
      </div>

      <div className="mt-3 whitespace-pre-wrap text-sm text-gray-700">{truncate(contentPreview)}</div>
      {meta ? <div className="mt-3 text-xs text-gray-500">{meta}</div> : null}
    </div>
  );
}

