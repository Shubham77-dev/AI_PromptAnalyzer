"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Heart } from "lucide-react";
import { parseSuggestionsText } from "@/components/library/SuggestionsPanel";
import { requireAuth } from "@/app/_lib/auth-guard";
import { ScoreBar } from "@/components/ui/ScoreBar";
import { ScorePill } from "@/components/ui/ScorePill";
import { SuggestionItem } from "@/components/ui/SuggestionItem";
import { UserAvatar } from "@/components/ui/UserAvatar";

export interface LibraryPrompt {
  id: string;
  content: string;
  createdAt: string;
  user: { email: string };
  analysis: { accuracy: number; clarity: number; suggestions: string } | null;
  stats: { likes: number } | null;
}

function initials(email: string) {
  const name = email.split("@")[0] ?? email;
  const parts = name.split(/[._-]+/).filter(Boolean);
  const a = parts[0]?.[0] ?? name[0] ?? "U";
  const b = parts[1]?.[0] ?? name[1] ?? "";
  return (a + b).toUpperCase();
}

function barTone(score: number) {
  if (score >= 80) return "var(--pa-acc2)";
  if (score >= 50) return "var(--pa-acc4)";
  return "var(--pa-acc3)";
}

export function PromptCard({ prompt }: Readonly<{ prompt: LibraryPrompt }>) {
  const router = useRouter();
  const [likes, setLikes] = useState(prompt.stats?.likes ?? 0);
  const [liked, setLiked] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [copied, setCopied] = useState(false);
  const [likePending, setLikePending] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const date = useMemo(() => new Date(prompt.createdAt).toLocaleString(), [prompt.createdAt]);
  const av = useMemo(() => initials(prompt.user.email), [prompt.user.email]);
  const accuracy = prompt.analysis?.accuracy ?? 0;
  const clarity = prompt.analysis?.clarity ?? 0;
  const isLong = prompt.content.trim().length > 260;
  const parsed = useMemo(
    () => (prompt.analysis?.suggestions ? parseSuggestionsText(prompt.analysis.suggestions) : null),
    [prompt.analysis?.suggestions],
  );

  async function onCopy() {
    await globalThis.navigator?.clipboard?.writeText(prompt.content);
    setCopied(true);
    globalThis.setTimeout(() => setCopied(false), 1500);
  }

  async function onLike() {
    if (likePending) return;
    setLikePending(true);
    const didRun = await requireAuth(
      async () => {
        const res = await fetch("/api/like", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ promptId: prompt.id }),
        });
        if (!res.ok) return;
        const body = (await res.json().catch(() => null)) as { likes?: number; liked?: boolean } | null;
        if (typeof body?.likes === "number") setLikes(body.likes);
        if (typeof body?.liked === "boolean") setLiked(body.liked);
        else setLiked(true);
        router.refresh();
      },
      { router },
    );
    if (!didRun) return;
    setLikePending(false);
  }

  const rows =
    parsed && showSuggestions
      ? [
          ...parsed.issues.map((t) => ({ key: `i-${t}`, type: "warn" as const, title: "Issue", desc: t })),
          ...parsed.suggestions.map((t) => ({ key: `s-${t}`, type: "tip" as const, title: "Tip", desc: t })),
        ]
      : [];

  return (
    <div
      className="pa-card-transition flex flex-col rounded-xl p-3.5"
      style={{ border: "1px solid var(--pa-card-border)", background: "var(--pa-card)" }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = "var(--pa-acc1)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = "var(--pa-card-border)";
      }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <UserAvatar initials={av} size="sm" />
          <div className="min-w-0">
            <span className="block truncate" style={{ fontSize: 11, color: "var(--pa-muted)" }}>
              {prompt.user.email}
            </span>
            <span style={{ fontSize: 10, color: "var(--pa-muted)" }}>{date}</span>
          </div>
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1">
            <span style={{ fontSize: 10, color: "var(--pa-muted)" }}>Accuracy</span>
            <ScorePill value={accuracy} />
          </span>
          <span className="inline-flex items-center gap-1">
            <span style={{ fontSize: 10, color: "var(--pa-muted)" }}>Clarity</span>
            <ScorePill value={clarity} />
          </span>
        </div>
      </div>

      <div
        className="my-2 font-mono whitespace-pre-wrap"
        style={
          expanded
            ? {
                fontSize: 11,
                color: "var(--pa-muted)",
                lineHeight: 1.5,
                background: "var(--pa-bg)",
                padding: "8px 10px",
                borderRadius: 8,
              }
            : {
                fontSize: 11,
                color: "var(--pa-muted)",
                lineHeight: 1.5,
                background: "var(--pa-bg)",
                padding: "8px 10px",
                borderRadius: 8,
                display: "-webkit-box",
                WebkitBoxOrient: "vertical",
                WebkitLineClamp: 3,
                overflow: "hidden",
              }
        }
      >
        {prompt.content}
      </div>
      {isLong ? (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="self-start border-0 bg-transparent"
          style={{ fontSize: 10, color: "var(--pa-muted)" }}
        >
          {expanded ? "Show less" : "Read more"}
        </button>
      ) : null}

      <div className="grid gap-1">
        <ScoreBar label="Accuracy" value={accuracy} color={barTone(accuracy)} compact />
        <ScoreBar label="Clarity" value={clarity} color={barTone(clarity)} compact />
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onLike}
            disabled={likePending}
            className="inline-flex items-center gap-1 border-0 bg-transparent"
            style={{ color: liked ? "var(--pa-acc3)" : "var(--pa-muted)" }}
          >
            <Heart width={12} height={12} fill={liked ? "currentColor" : "none"} />
            <span className="tabular-nums" style={{ fontSize: 11 }}>
              {likes}
            </span>
          </button>
          <button
            type="button"
            onClick={() => setShowSuggestions((v) => !v)}
            className="border-0 bg-transparent"
            style={{ fontSize: 10, color: "var(--pa-muted)" }}
          >
            View suggestions {showSuggestions ? "▴" : "▾"}
          </button>
        </div>
        <button
          type="button"
          onClick={onCopy}
          className="border-0 font-medium"
          style={{
            fontSize: 11,
            borderRadius: 6,
            padding: "4px 10px",
            background: copied ? "color-mix(in srgb, var(--pa-acc2) 10%, transparent)" : "var(--pa-hint)",
            color: copied ? "var(--pa-acc2)" : "var(--pa-acc1)",
          }}
        >
          {copied ? "Copied!" : "Copy"}
        </button>
      </div>

      {showSuggestions && parsed ? (
        <div className="mt-2 overflow-hidden rounded-lg" style={{ border: "1px solid var(--pa-card-border)" }}>
          {rows.map((r, idx) => (
            <SuggestionItem
              key={r.key}
              type={r.type}
              title={r.title}
              desc={r.desc}
              hideBorder={idx === rows.length - 1}
            />
          ))}
          {parsed.improvedPrompt ? (
            <div className="p-3" style={{ background: "var(--pa-hint)" }}>
              <div style={{ fontSize: 9, textTransform: "uppercase", color: "var(--pa-muted)" }}>
                Improved prompt
              </div>
              <pre
                className="mt-1 whitespace-pre-wrap font-mono"
                style={{ fontSize: 11, color: "var(--pa-muted)" }}
              >
                {parsed.improvedPrompt}
              </pre>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
