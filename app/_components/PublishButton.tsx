"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { requireAuth } from "@/app/_lib/auth-guard";

export function PublishButton({
  promptId,
  disabled,
}: Readonly<{
  promptId: string;
  disabled: boolean;
}>) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  async function publish() {
    setError(null);
    const didRun = await requireAuth(
      async () => {
        const res = await fetch("/api/publish", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ promptId }),
        });

        if (!res.ok) {
          const body = (await res.json().catch(() => null)) as { error?: string } | null;
          setError(body?.error || "Publish failed");
          return;
        }

        startTransition(() => router.refresh());
      },
      { router },
    );
    if (!didRun) return;
  }

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={publish}
        disabled={disabled || isPending}
        className="rounded-md bg-zinc-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-60"
      >
        Publish
      </button>
      {error ? <span className="text-xs text-red-600">{error}</span> : null}
    </div>
  );
}

