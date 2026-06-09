"use client";

import { useEffect, useMemo, useState } from "react";
import { FilterTag } from "@/components/ui/FilterTag";
import { SearchBar } from "@/components/ui/SearchBar";
import { PromptCard, type LibraryPrompt } from "@/components/library/PromptCard";
import { PromptCardSkeleton } from "@/components/library/PromptCardSkeleton";
import {
  enrichLibraryPrompts,
  getSearchSuggestions,
  searchPrompts,
  type ScoredLibraryPrompt,
  type SearchSuggestion,
} from "@/lib/library-search";

type ScoreFilter = "all" | "high" | "mid" | "low";
type SortKey = "recent" | "liked" | "score";

function RemovableFilterTag({ label, onRemove }: Readonly<{ label: string; onRemove: () => void }>) {
  return (
    <span
      className="inline-flex items-center gap-1 font-medium"
      style={{
        fontSize: 10,
        padding: "3px 10px",
        borderRadius: 20,
        border: "1px solid var(--pa-acc1)",
        color: "var(--pa-acc1)",
        background: "color-mix(in srgb, var(--pa-acc1) 10%, transparent)",
      }}
    >
      {label}
      <button
        type="button"
        aria-label={`Remove ${label} filter`}
        onClick={onRemove}
        className="border-0 bg-transparent"
        style={{ fontSize: 12, lineHeight: 1, color: "var(--pa-acc1)", cursor: "pointer" }}
      >
        ×
      </button>
    </span>
  );
}

export function LibraryBrowseClient({ prompts }: Readonly<{ prompts: LibraryPrompt[] }>) {
  const [q, setQ] = useState("");
  const [debouncedQ, setDebouncedQ] = useState("");
  const [filterTags, setFilterTags] = useState<string[]>([]);
  const [scoreFilter, setScoreFilter] = useState<ScoreFilter>("all");
  const [sortKey, setSortKey] = useState<SortKey>("recent");
  const [hydrated, setHydrated] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const enriched = useMemo(() => enrichLibraryPrompts(prompts), [prompts]);

  useEffect(() => {
    const id = globalThis.requestAnimationFrame(() => setHydrated(true));
    return () => globalThis.cancelAnimationFrame(id);
  }, []);

  useEffect(() => {
    const timer = globalThis.setTimeout(() => setDebouncedQ(q.trim()), 300);
    return () => globalThis.clearTimeout(timer);
  }, [q]);

  const suggestions = useMemo(
    () => (showSuggestions && q.trim().length >= 2 ? getSearchSuggestions(q, enriched) : []),
    [showSuggestions, q, enriched],
  );

  const searched = useMemo(() => {
    const hasSearch = debouncedQ.length > 0 || filterTags.length > 0;
    const base = hasSearch ? searchPrompts(debouncedQ, enriched, filterTags) : enriched;

    const byScore = base.filter((p) => {
      const score = p.analysis?.accuracy ?? 0;
      if (scoreFilter === "high") return score >= 80;
      if (scoreFilter === "mid") return score >= 50 && score <= 79;
      if (scoreFilter === "low") return score < 50;
      return true;
    });

    return [...byScore].sort((a, b) => {
      const aScored = a as ScoredLibraryPrompt;
      const bScored = b as ScoredLibraryPrompt;
      if (hasSearch && aScored.searchScore !== bScored.searchScore) {
        return (bScored.searchScore ?? 0) - (aScored.searchScore ?? 0);
      }
      if (sortKey === "liked") return (b.stats?.likes ?? 0) - (a.stats?.likes ?? 0);
      if (sortKey === "score") return (b.analysis?.accuracy ?? 0) - (a.analysis?.accuracy ?? 0);
      return +new Date(b.createdAt) - +new Date(a.createdAt);
    });
  }, [enriched, debouncedQ, filterTags, scoreFilter, sortKey]);

  function addFilterTag(value: string) {
    const v = value.trim();
    if (!v || filterTags.some((t) => t.toLowerCase() === v.toLowerCase())) return;
    setFilterTags((prev) => [...prev, v]);
    setQ("");
    setShowSuggestions(false);
  }

  function applySuggestion(s: SearchSuggestion) {
    addFilterTag(s.filterValue);
  }

  const hasActiveSearch = debouncedQ.length > 0 || filterTags.length > 0;
  const resultLabel = hasActiveSearch
    ? `Showing ${searched.length} result${searched.length === 1 ? "" : "s"} for "${debouncedQ || filterTags.join(", ")}"`
    : `Showing ${searched.length} result${searched.length === 1 ? "" : "s"}`;

  return (
    <div>
      <div className="relative">
        <SearchBar
          placeholder="Search by keyword, tech stack, role, or goal..."
          value={q}
          onChange={(v) => {
            setQ(v);
            setShowSuggestions(true);
          }}
          onClear={() => setShowSuggestions(false)}
        />
        {suggestions.length > 0 ? (
          <div
            className="absolute z-20 mt-1 w-full overflow-hidden rounded-xl"
            style={{ background: "var(--pa-card)", border: "1px solid var(--pa-card-border)" }}
          >
            {suggestions.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => applySuggestion(s)}
                className="flex w-full items-center gap-2 border-0 px-3 py-2 text-left"
                style={{
                  background: "transparent",
                  borderBottom: "1px solid var(--pa-card-border)",
                  fontSize: 11,
                  color: "var(--pa-text)",
                  cursor: "pointer",
                }}
              >
                <span>{s.icon}</span>
                <span style={{ color: "var(--pa-muted)" }}>{s.category}:</span>
                <span>{s.label}</span>
              </button>
            ))}
          </div>
        ) : null}
      </div>

      {filterTags.length > 0 ? (
        <div className="mt-2 flex flex-wrap items-center gap-2">
          {filterTags.map((tag) => (
            <RemovableFilterTag key={tag} label={tag} onRemove={() => setFilterTags((prev) => prev.filter((t) => t !== tag))} />
          ))}
          <button
            type="button"
            onClick={() => setFilterTags([])}
            className="border-0 bg-transparent"
            style={{ fontSize: 10, color: "var(--pa-acc1)", cursor: "pointer" }}
          >
            Clear all
          </button>
        </div>
      ) : null}

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
        {resultLabel}
      </div>

      <div className="flex flex-col gap-2.5">
        {!hydrated
          ? [0, 1, 2].map((i) => <PromptCardSkeleton key={i} />)
          : searched.length
            ? searched.map((p) => (
                <PromptCard
                  key={p.id}
                  prompt={p}
                  matchReasons={(p as ScoredLibraryPrompt).matchReasons}
                  onAddFilterTag={addFilterTag}
                />
              ))
            : hasActiveSearch
              ? (
                  <div
                    className="pa-card-transition rounded-xl p-6 text-center"
                    style={{ border: "1px solid var(--pa-card-border)", background: "var(--pa-card)" }}
                  >
                    <div style={{ fontSize: 28, marginBottom: 8 }}>🔍</div>
                    <p style={{ fontSize: 13, fontWeight: 600, color: "var(--pa-text)" }}>
                      No prompts found for &ldquo;{debouncedQ || filterTags.join(", ")}&rdquo;
                    </p>
                    <p className="mt-2" style={{ fontSize: 11, color: "var(--pa-muted)", lineHeight: 1.6 }}>
                      Try searching for:
                      <br />
                      • A technology: React, Node.js, Python
                      <br />
                      • A goal: login, dashboard, API
                      <br />
                      • A role: frontend, backend, full stack
                    </p>
                  </div>
                )
              : (
                  <div className="pa-card-transition rounded-xl p-5" style={{ border: "1px solid var(--pa-card-border)", background: "var(--pa-card)" }}>
                    <span style={{ fontSize: 11, color: "var(--pa-muted)" }}>No published prompts yet.</span>
                  </div>
                )}
      </div>
    </div>
  );
}
