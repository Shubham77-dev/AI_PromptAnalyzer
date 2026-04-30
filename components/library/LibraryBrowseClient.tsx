"use client";

import { useEffect, useMemo, useState } from "react";
import { FilterTag } from "@/components/ui/FilterTag";
import { SearchBar } from "@/components/ui/SearchBar";
import { PromptCard, type LibraryPrompt } from "@/components/library/PromptCard";
import { PromptCardSkeleton } from "@/components/library/PromptCardSkeleton";

type ScoreFilter = "all" | "high" | "mid" | "low";
type SortKey = "recent" | "liked" | "score";

export function LibraryBrowseClient({ prompts }: Readonly<{ prompts: LibraryPrompt[] }>) {
  const [q, setQ] = useState("");
  const [scoreFilter, setScoreFilter] = useState<ScoreFilter>("all");
  const [sortKey, setSortKey] = useState<SortKey>("recent");
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const id = globalThis.requestAnimationFrame(() => setHydrated(true));
    return () => globalThis.cancelAnimationFrame(id);
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

    return [...byScore].sort((a, b) => {
      if (sortKey === "liked") return (b.stats?.likes ?? 0) - (a.stats?.likes ?? 0);
      if (sortKey === "score") return (b.analysis?.accuracy ?? 0) - (a.analysis?.accuracy ?? 0);
      return +new Date(b.createdAt) - +new Date(a.createdAt);
    });
  }, [prompts, q, scoreFilter, sortKey]);

  return (
    <div>
      <SearchBar placeholder="Search prompts..." value={q} onChange={setQ} />
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <FilterTag label="All" active={scoreFilter === "all"} onClick={() => setScoreFilter("all")} />
        <FilterTag label="High score (80+)" active={scoreFilter === "high"} onClick={() => setScoreFilter("high")} />
        <FilterTag label="Mid (50–79)" active={scoreFilter === "mid"} onClick={() => setScoreFilter("mid")} />
        <FilterTag label="Needs work (<50)" active={scoreFilter === "low"} onClick={() => setScoreFilter("low")} />
        <select
          value={sortKey}
          onChange={(e) => setSortKey(e.target.value as SortKey)}
          className="ml-auto"
          style={{
            background: "var(--pa-card)",
            border: "1px solid var(--pa-card-border)",
            borderRadius: 8,
            padding: "5px 10px",
            fontSize: 11,
            color: "var(--pa-muted)",
            outline: "none",
          }}
        >
          <option value="recent">Most recent</option>
          <option value="liked">Most liked</option>
          <option value="score">Highest score</option>
        </select>
      </div>
      <div className="mb-2.5 mt-2" style={{ fontSize: 10, color: "var(--pa-muted)" }}>
        Showing {filtered.length} result(s)
      </div>
      <div className="flex flex-col gap-2.5">
        {!hydrated
          ? [0, 1, 2].map((i) => <PromptCardSkeleton key={i} />)
          : filtered.length
            ? filtered.map((p) => <PromptCard key={p.id} prompt={p} />)
            : (
                <div className="pa-card-transition rounded-xl p-5" style={{ border: "1px solid var(--pa-card-border)", background: "var(--pa-card)" }}>
                  <span style={{ fontSize: 11, color: "var(--pa-muted)" }}>No published prompts yet.</span>
                </div>
              )}
      </div>
    </div>
  );
}
