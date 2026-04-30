"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { requireAuth } from "@/app/_lib/auth-guard";
import { toast } from "sonner";
import { Spinner } from "@/components/ui/Spinner";

type PublishResponse = {
  success?: boolean;
  status?: "PUBLISHED" | "UNDER_REVIEW";
  message?: string;
  error?: string;
};

export function PublishButton({
  promptId,
  disabled,
}: Readonly<{
  promptId: string;
  disabled: boolean;
}>) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPublishing, setIsPublishing] = useState(false);
  const [isPending, startTransition] = useTransition();

  async function publish() {
    // Prevent duplicate clicks
    if (isPublishing || isPending) return;

    setError(null);

    const didRun = await requireAuth(
      async () => {
        try {
          setIsPublishing(true);

          const res = await fetch("/api/publish", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ promptId }),
          });

          const body = (await res.json().catch(() => null)) as PublishResponse | null;

          // Handle API errors
          if (!res.ok) {
            const errorMsg = body?.error || body?.message || "Failed to publish prompt. Please try again";
            setError(errorMsg);
            toast.error(errorMsg);
            return;
          }

          // Handle successful response
          const status = body?.status;
          const message = body?.message;

          if (status === "PUBLISHED") {
            toast.success(message || "Prompt published successfully");
          } else if (status === "UNDER_REVIEW") {
            toast.warning(message || "Prompt sent for admin review due to low score");
          } else {
            // Fallback (should not happen with correct API)
            toast.success("Prompt published successfully");
          }

          // Refresh UI to reflect changes
          startTransition(() => router.refresh());
        } catch (err) {
          const errorMsg = "Failed to publish prompt. Please try again";
          setError(errorMsg);
          toast.error(errorMsg);
          console.error("Publish error:", err);
        } finally {
          setIsPublishing(false);
        }
      },
      { router },
    );

    if (!didRun) return;
  }

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={publish}
        disabled={disabled || isPending || isPublishing}
        className="rounded-md bg-zinc-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-60"
      >
        {isPublishing ? (
          <span className="inline-flex items-center gap-2">
            <Spinner size="sm" />
            Publishing…
          </span>
        ) : (
          "Publish"
        )}
      </button>
      {error ? <span className="text-xs text-red-600">{error}</span> : null}
    </div>
  );
}

