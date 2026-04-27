"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

export function LikeButton({
  promptId,
  initialLikes,
}: Readonly<{
  promptId: string;
  initialLikes: number;
}>) {
  const router = useRouter();
  const [likes, setLikes] = useState(initialLikes);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  async function like() {
    setError(null);
    const res = await fetch("/api/like", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ promptId }),
    });

    if (res.status === 401) {
      setError("Sign in to like.");
      return;
    }

    if (!res.ok) {
      const body = (await res.json().catch(() => null)) as { error?: string } | null;
      setError(body?.error || "Like failed");
      return;
    }

    const body = (await res.json()) as { likes: number };
    setLikes(body.likes);
    startTransition(() => router.refresh());
  }

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={like}
        disabled={isPending}
        className="rounded-md border border-zinc-200 bg-white px-3 py-1.5 text-sm font-medium hover:bg-zinc-50 disabled:opacity-60"
      >
        Like · {likes}
      </button>
      {error ? <span className="text-xs text-red-600">{error}</span> : null}
    </div>
  );
}

