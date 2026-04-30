"use client";

import { useEffect, useMemo, useState } from "react";
import { PromptCard, type LibraryPrompt } from "@/components/library/PromptCard";

type ScoreFilter = "all" | "high" | "mid" | "low";
type SortKey = "recent" | "liked" | "score";

const SKELETON_KEYS = ["a", "b", "c", "d", "e", "f"];

function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4 text-gray-400" aria-hidden="true">
      <path
        d="M10.5 3a7.5 7.5 0 105.05 13.05l3.7 3.7 1.06-1.06-3.7-3.7A7.5 7.5 0 0010.5 3zm0 1.5a6 6 0 110 12 6 6 0 010-12z"
        fill="currentColor"
      />
    </svg>
  );
}

function tagClass(active: boolean) {
  return [
    "rounded-lg border-[0.5px] px-3 py-2 text-sm font-medium",
    active
      ? "bg-[#EEEDFE] text-[#3C3489] border-[#EEEDFE]"
      : "bg-white text-gray-700 border-gray-200/70 hover:bg-gray-50",
  ].join(" ");
}

export function SearchAndFilters({ prompts }: Readonly<{ prompts: LibraryPrompt[] }>) {
  const [hydrated, setHydrated] = useState(false);
  const [q, setQ] = useState("");
  const [scoreFilter, setScoreFilter] = useState<ScoreFilter>("all");
  const [sortKey, setSortKey] = useState<SortKey>("recent");

  useEffect(() => {
    const id = globalThis.setTimeout(() => setHydrated(true), 0);
    return () => globalThis.clearTimeout(id);
  }, []);

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    const base = query
      ? prompts.filter((p) => {
          const s = `${p.content}\n${p.analysis?.suggestions ?? ""}`.toLowerCase();
          return s.includes(query);
        })
      : prompts;

    const byScore = base.filter((p) => {
      const score = p.analysis?.accuracy ?? 0;
      if (scoreFilter === "high") return score >= 80;
      if (scoreFilter === "mid") return score >= 50 && score <= 79;
      if (scoreFilter === "low") return score < 50;
      return true;
    });

    const sorted = [...byScore].sort((a, b) => {
      if (sortKey === "liked") return (b.stats?.likes ?? 0) - (a.stats?.likes ?? 0);
      if (sortKey === "score") return (b.analysis?.accuracy ?? 0) - (a.analysis?.accuracy ?? 0);
      return +new Date(b.createdAt) - +new Date(a.createdAt);
    });

    return sorted;
  }, [prompts, q, scoreFilter, sortKey]);

  return (
    <div className="mt-5">
      <div className="flex flex-col gap-3 rounded-xl border-[0.5px] border-gray-200/70 bg-white p-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1">
            <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2">
              <SearchIcon />
            </div>
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search prompts and suggestions…"
              className="w-full rounded-lg border-[0.5px] border-gray-200/70 bg-white py-2 pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-[#EEEDFE]"
            />
          </div>

          <select
            value={sortKey}
            onChange={(e) => setSortKey(e.target.value as SortKey)}
            className="rounded-lg border-[0.5px] border-gray-200/70 bg-white px-3 py-2 text-sm text-gray-700 outline-none"
          >
            <option value="recent">Most recent</option>
            <option value="liked">Most liked</option>
            <option value="score">Highest score</option>
          </select>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-2">
            <button onClick={() => setScoreFilter("all")} className={tagClass(scoreFilter === "all")}>
              All
            </button>
            <button onClick={() => setScoreFilter("high")} className={tagClass(scoreFilter === "high")}>
              High score (80+)
            </button>
            <button onClick={() => setScoreFilter("mid")} className={tagClass(scoreFilter === "mid")}>
              Mid (50–79)
            </button>
            <button onClick={() => setScoreFilter("low")} className={tagClass(scoreFilter === "low")}>
              Needs work (&lt;50)
            </button>
          </div>

          <div className="text-sm text-gray-500">Showing {filtered.length} result(s)</div>
        </div>
      </div>

      <div className="mt-4 grid gap-4">
        {(() => {
          if (hydrated === false) {
            return SKELETON_KEYS.map((k) => (
              <div
                key={`skeleton-${k}`}
                className="h-[220px] animate-pulse rounded-xl border-[0.5px] border-gray-200/70 bg-white"
              />
            ));
          }

          if (filtered.length > 0) return filtered.map((p) => <PromptCard key={p.id} prompt={p} />);

          return (
            <div className="rounded-xl border-[0.5px] border-gray-200/70 bg-white p-5 text-sm text-gray-600">
              No published prompts yet.
            </div>
          );
        })()}
      </div>
    </div>
  );
}

