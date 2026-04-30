"use client";

import type { ReactNode } from "react";
import type { DefaultSort } from "@/components/settings/settingsDraft";
import { Toggle } from "@/components/ui/Toggle";

export interface PreferencesSectionProps {
  autoSave: boolean;
  scoreBreakdown: boolean;
  showImprovedPrompt: boolean;
  defaultSort: DefaultSort;
  compactView: boolean;
  monospacePreview: boolean;
  onAutoSave: (v: boolean) => void;
  onScoreBreakdown: (v: boolean) => void;
  onShowImprovedPrompt: (v: boolean) => void;
  onDefaultSort: (v: DefaultSort) => void;
  onCompactView: (v: boolean) => void;
  onMonospacePreview: (v: boolean) => void;
}

const SORT_OPTIONS: { value: DefaultSort; label: string }[] = [
  { value: "recent", label: "Most recent" },
  { value: "score", label: "Highest score" },
  { value: "title", label: "Title (A–Z)" },
];

export function PreferencesSection({
  autoSave,
  scoreBreakdown,
  showImprovedPrompt,
  defaultSort,
  compactView,
  monospacePreview,
  onAutoSave,
  onScoreBreakdown,
  onShowImprovedPrompt,
  onDefaultSort,
  onCompactView,
  onMonospacePreview,
}: Readonly<PreferencesSectionProps>) {
  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-base font-medium text-gray-900">Preferences</h2>
        <p className="mt-1 text-sm text-gray-600">Editor behavior and library display.</p>
      </div>

      <div className="space-y-4 rounded-xl border-[0.5px] border-black/10 bg-white p-5">
        <Row
          label="Auto-save drafts while typing"
          description="Saves to your device session periodically."
        >
          <Toggle checked={autoSave} onChange={onAutoSave} aria-label="Auto-save drafts" />
        </Row>
        <Row
          label="Score breakdown"
          description="Show clarity, usefulness, and safety sub-scores."
        >
          <Toggle checked={scoreBreakdown} onChange={onScoreBreakdown} aria-label="Score breakdown" />
        </Row>
        <Row
          label="Show improved prompt"
          description="Expand the AI rewrite panel by default after analysis."
        >
          <Toggle
            checked={showImprovedPrompt}
            onChange={onShowImprovedPrompt}
            aria-label="Show improved prompt"
          />
        </Row>
        <div className="flex flex-col gap-2 border-t border-black/5 pt-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="text-sm font-medium text-gray-900">Default library sort</div>
            <p className="text-xs text-gray-500">Applies to your dashboard and library views.</p>
          </div>
          <select
            value={defaultSort}
            onChange={(e) => onDefaultSort(e.target.value as DefaultSort)}
            className="rounded-lg border-[0.5px] border-black/10 bg-white px-3 py-2 text-sm outline-none ring-[#534AB7]/25 focus:ring-2"
          >
            {SORT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
        <Row label="Compact view" description="Tighter rows and smaller typography in lists.">
          <Toggle checked={compactView} onChange={onCompactView} aria-label="Compact view" />
        </Row>
        <Row
          label="Monospace preview"
          description="Use monospace font for prompt previews."
        >
          <Toggle checked={monospacePreview} onChange={onMonospacePreview} aria-label="Monospace preview" />
        </Row>
      </div>
    </div>
  );
}

function Row({
  label,
  description,
  children,
}: Readonly<{ label: string; description: string; children: ReactNode }>) {
  return (
    <div className="flex flex-col gap-3 border-b border-black/5 pb-4 last:border-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <div className="text-sm font-medium text-gray-900">{label}</div>
        <p className="text-xs text-gray-500">{description}</p>
      </div>
      {children}
    </div>
  );
}
