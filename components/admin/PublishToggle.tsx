"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { ButtonOutline } from "@/components/ui/ButtonOutline";

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
  const [confirmPublishOpen, setConfirmPublishOpen] = useState(false);
  const isPublished = status === "PUBLISHED";

  const classes = useMemo(() => {
    const base = "inline-flex items-center justify-center font-semibold pa-btn-transition";
    const padding = size === "md" ? "px-3 py-2 text-sm" : "px-2.5 py-1.5 text-xs";
    return [base, padding].join(" ");
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
          else setConfirmPublishOpen(true);
        }}
        className={classes}
        title={title}
        style={{
          borderRadius: 8,
          border: "1px solid var(--pa-card-border)",
          background: isPublished
            ? "color-mix(in srgb, var(--pa-acc4) 14%, transparent)"
            : "color-mix(in srgb, var(--pa-acc2) 14%, transparent)",
          color: isPublished ? "var(--pa-acc4)" : "var(--pa-acc2)",
          opacity: isDisabled ? 0.6 : 1,
          cursor: isDisabled ? "not-allowed" : "pointer",
        }}
      >
        {busy ? "Working…" : isPublished ? "Unpublish" : "Publish"}
      </button>

      {confirmPublishOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "var(--pa-overlay)" }}>
          <Card className="w-full max-w-md">
            <div className="p-5">
              <div className="text-sm font-semibold" style={{ color: "var(--pa-text)" }}>
                Publish this prompt to the public library?
              </div>
              <div className="mt-4 flex items-center justify-end gap-2">
                <ButtonOutline type="button" onClick={() => setConfirmPublishOpen(false)} disabled={busy}>
                  Cancel
                </ButtonOutline>
                <button
                  type="button"
                  className="pa-btn-transition rounded-lg px-3 py-2 text-sm font-semibold text-white"
                  style={{ background: "var(--pa-acc2)" }}
                  onClick={() => {
                    setConfirmPublishOpen(false);
                    void doPublish();
                  }}
                  disabled={busy}
                >
                  Yes, publish
                </button>
              </div>
            </div>
          </Card>
        </div>
      ) : null}

      {confirmUnpublishOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "var(--pa-overlay)" }}>
          <Card className="w-full max-w-md">
            <div className="p-5">
              <div className="text-sm font-semibold" style={{ color: "var(--pa-text)" }}>
                Unpublish prompt?
              </div>
              <div className="mt-1 text-sm" style={{ color: "var(--pa-muted)" }}>
              This will remove the prompt from the public library. You can publish it again later.
              </div>

              <div className="mt-4 flex items-center justify-end gap-2">
                <ButtonOutline type="button" onClick={() => setConfirmUnpublishOpen(false)} disabled={busy}>
                  Cancel
                </ButtonOutline>
                <button
                  type="button"
                  className="pa-btn-transition"
                  style={{
                    borderRadius: 8,
                    border: "1px solid color-mix(in srgb, var(--pa-acc4) 35%, transparent)",
                    background: "color-mix(in srgb, var(--pa-acc4) 16%, transparent)",
                    padding: "6px 12px",
                    fontSize: 11,
                    fontWeight: 600,
                    color: "var(--pa-acc4)",
                    opacity: busy ? 0.6 : 1,
                    cursor: busy ? "not-allowed" : "pointer",
                  }}
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
          </Card>
        </div>
      ) : null}
    </>
  );
}

