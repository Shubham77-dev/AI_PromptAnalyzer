"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type PublishToggleProps = {
  promptId: string;
  status: "DRAFT" | "PUBLISHED" | "UNDER_REVIEW";
  disabled?: boolean;
  disabledReason?: string;
  size?: "sm" | "md";
};

export function PublishToggle({
  promptId,
  status,
  disabled,
  disabledReason,
  size = "sm",
}: Readonly<PublishToggleProps>) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [confirmUnpublishOpen, setConfirmUnpublishOpen] = useState(false);
  const isPublished = status === "PUBLISHED";

  const classes = useMemo(() => {
    const base =
      "inline-flex items-center justify-center rounded-lg font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-60";
    const padding = size === "md" ? "px-3 py-2 text-sm" : "px-2.5 py-1.5 text-xs";
    const colors = isPublished ? "bg-amber-600 text-white hover:bg-amber-700" : "bg-emerald-600 text-white hover:bg-emerald-700";
    return [base, padding, colors].join(" ");
  }, [isPublished, size]);

  async function patch(url: string) {
    const res = await fetch(url, { method: "PATCH" });
    const json = await res.json().catch(() => null);
    if (!res.ok) {
      const message = json?.error || json?.message || "Request failed";
      throw new Error(message);
    }
    return json;
  }

  async function doPublish() {
    setBusy(true);
    try {
      await patch(`/api/admin/prompts/${encodeURIComponent(promptId)}/publish`);
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  async function doUnpublish() {
    setBusy(true);
    try {
      await patch(`/api/admin/prompts/${encodeURIComponent(promptId)}/unpublish`);
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  const isDisabled = Boolean(disabled || busy);
  const title = disabled ? disabledReason ?? "Not allowed" : isPublished ? "Unpublish prompt" : "Publish prompt";

  return (
    <>
      <button
        type="button"
        disabled={isDisabled}
        onClick={() => {
          if (isPublished) setConfirmUnpublishOpen(true);
          else void doPublish();
        }}
        className={classes}
        title={title}
      >
        {busy ? "Working…" : isPublished ? "Unpublished" : "Published"}
      </button>

      {confirmUnpublishOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-5 shadow-xl ring-1 ring-black/10">
            <div className="text-sm font-semibold text-gray-900">Unpublish prompt?</div>
            <div className="mt-1 text-sm text-gray-600">
              This will remove the prompt from the public library. You can publish it again later.
            </div>

            <div className="mt-4 flex items-center justify-end gap-2">
              <button
                type="button"
                className="rounded-lg border border-black/10 bg-white px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                onClick={() => setConfirmUnpublishOpen(false)}
                disabled={busy}
              >
                Cancel
              </button>
              <button
                type="button"
                className="rounded-lg bg-amber-600 px-3 py-2 text-sm font-semibold text-white hover:bg-amber-700 disabled:cursor-not-allowed disabled:opacity-60"
                onClick={() => {
                  setConfirmUnpublishOpen(false);
                  void doUnpublish();
                }}
                disabled={busy}
              >
                Yes, unpublish
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

