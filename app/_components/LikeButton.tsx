"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { requireAuth } from "@/app/_lib/auth-guard";
import { Heart } from "lucide-react";

export function LikeButton({
  promptId,
  initialLikes,
}: Readonly<{
  promptId: string;
  initialLikes: number;
}>) {
  const router = useRouter();
  const [likes, setLikes] = useState(initialLikes);
  const [liked, setLiked] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  async function like() {
    setError(null);
    const didRun = await requireAuth(
      async () => {
        const res = await fetch("/api/like", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ promptId }),
        });

        if (res.status === 401) {
          setError("Please login to continue");
          return;
        }

        if (!res.ok) {
          const body = (await res.json().catch(() => null)) as { error?: string } | null;
          setError(body?.error || "Like failed");
          return;
        }

        const body = (await res.json()) as { likes: number; liked?: boolean };
        setLikes(body.likes);
        setLiked(typeof body.liked === "boolean" ? body.liked : true);
        startTransition(() => router.refresh());
      },
      { router },
    );
    if (!didRun) return;
  }

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={like}
        disabled={isPending}
        className={[
          "inline-flex items-center gap-2 rounded-md border border-zinc-200 px-3 py-1.5 text-sm font-medium disabled:opacity-60",
          liked ? "bg-[#FBEAF0] text-[#993556] border-[#FBEAF0]" : "bg-white hover:bg-zinc-50",
        ].join(" ")}
      >
        <Heart className="h-4 w-4" fill={liked ? "currentColor" : "none"} />
        <span className="tabular-nums">{likes}</span>
      </button>
      {error ? <span className="text-xs text-red-600">{error}</span> : null}
    </div>
  );
}

