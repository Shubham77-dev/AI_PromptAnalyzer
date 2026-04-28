"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Heart } from "lucide-react";
import { ScorePill } from "@/components/library/ScorePill";
import { ScoreBar } from "@/components/library/ScoreBar";
import { SuggestionsPanel } from "@/components/library/SuggestionsPanel";
import { requireAuth } from "@/app/_lib/auth-guard";

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

export function PromptCard({ prompt }: Readonly<{ prompt: LibraryPrompt }>) {
  const router = useRouter();
  const [likes, setLikes] = useState(prompt.stats?.likes ?? 0);
  const [liked, setLiked] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [copied, setCopied] = useState(false);
  const [likePending, setLikePending] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const date = useMemo(() => new Date(prompt.createdAt).toLocaleString(), [prompt.createdAt]);
  const avatar = useMemo(() => initials(prompt.user.email), [prompt.user.email]);

  const accuracy = prompt.analysis?.accuracy ?? 0;
  const clarity = prompt.analysis?.clarity ?? 0;
  const isLong = prompt.content.trim().length > 260;

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
        const body = (await res.json().catch(() => null)) as
          | { likes?: number; liked?: boolean }
          | null;
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

  return (
    <div className="rounded-xl border-[0.5px] border-gray-200/70 bg-white p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#7F77DD] text-xs font-medium text-white">
            {avatar}
          </div>
          <div className="min-w-0 text-sm text-gray-700">
            <span className="truncate">{prompt.user.email}</span>
            <span className="mx-2 text-gray-400">•</span>
            <span className="text-gray-500">{date}</span>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <ScorePill label="Accuracy" score={accuracy} />
          <ScorePill label="Clarity" score={clarity} />
        </div>
      </div>

      <div className="mt-4">
        <div
          className="rounded-lg border-[0.5px] border-gray-200/70 bg-gray-100 px-3 py-2.5 font-mono text-[12px] text-gray-800 whitespace-pre-wrap"
          style={
            expanded
              ? undefined
              : {
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
            className="mt-2 text-xs font-medium text-gray-500 hover:text-gray-900"
          >
            {expanded ? "Show less" : "Read more"}
          </button>
        ) : null}
      </div>

      <div className="mt-3 grid gap-2">
        <ScoreBar label="Accuracy" score={accuracy} />
        <ScoreBar label="Clarity" score={clarity} />
      </div>

      <div className="mt-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <button
            onClick={onLike}
            disabled={likePending}
            className={[
              "inline-flex items-center gap-2 rounded-lg border-[0.5px] px-3 py-2 text-sm font-medium",
              liked ? "bg-[#FBEAF0] text-[#993556] border-[#FBEAF0]" : "bg-white text-gray-700 border-gray-200/70",
              likePending ? "opacity-60" : "hover:bg-gray-50",
            ].join(" ")}
          >
            <Heart className="h-4 w-4" fill={liked ? "currentColor" : "none"} />
            <span className="tabular-nums">{likes}</span>
          </button>

          <button
            onClick={() => setShowSuggestions((v) => !v)}
            className="rounded-lg border-[0.5px] border-gray-200/70 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            View suggestions {showSuggestions ? "▴" : "▾"}
          </button>
        </div>

        <button
          onClick={onCopy}
          className={[
            "rounded-lg border-[0.5px] px-3 py-2 text-sm font-medium",
            copied
              ? "border-[#1D9E75] bg-[#EAF3DE] text-[#27500A]"
              : "border-[#EEEDFE] bg-[#EEEDFE] text-[#534AB7] hover:opacity-90",
          ].join(" ")}
        >
          {copied ? "Copied!" : "Copy"}
        </button>
      </div>

      {showSuggestions && prompt.analysis?.suggestions ? (
        <SuggestionsPanel suggestionsText={prompt.analysis.suggestions} />
      ) : null}
    </div>
  );
}

