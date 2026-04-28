"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { getAuthToken, requireAuth } from "@/app/_lib/auth-guard";

export function DeleteButton({ promptId }: Readonly<{ promptId: string }>) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  async function onDelete() {
    setError(null);
    const ok = globalThis.confirm("Are you sure you want to delete this prompt?");
    if (!ok) return;

    const didRun = await requireAuth(
      async () => {
        const token = getAuthToken();
        if (!token) {
          setError("Missing auth token. Please sign in again.");
          return;
        }

        const res = await fetch("/api/prompt", {
          method: "DELETE",
          headers: {
            "content-type": "application/json",
            authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ promptId }),
        });

        if (!res.ok) {
          const body = (await res.json().catch(() => null)) as { error?: string } | null;
          setError(body?.error || "Delete failed");
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
        onClick={onDelete}
        disabled={isPending}
        className="rounded-md border border-red-200 bg-white px-3 py-1.5 text-sm font-medium text-red-700 hover:bg-red-50 disabled:opacity-60"
      >
        {isPending ? "Deleting…" : "Delete"}
      </button>
      {error ? <span className="text-xs text-red-600">{error}</span> : null}
    </div>
  );
}

