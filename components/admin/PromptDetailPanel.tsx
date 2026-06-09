import { prisma } from "@/lib/prisma";
import { SeeMoreText } from "@/components/ui/SeeMoreText";
import { PublishToggle } from "@/components/admin/PublishToggle";
import { ScoreBadge } from "@/components/admin/ScoreBadge";
import { adminRemovePrompt } from "@/app/admin/actions";
import { adminRejectPrompt } from "@/app/admin/review/actions";
import { effectiveDisplayScore } from "@/lib/prompt-display-score";
export async function PromptDetailPanel({
  promptId,
  closeHref,
}: Readonly<{
  promptId: string;
  closeHref: string;
}>) {
  const prompt = await prisma.prompt.findUnique({
    where: { id: promptId },
    select: {
      id: true,
      content: true,
      status: true,
      moderationStatus: true,
      flagged: true,
      reason: true,
      score: true,
      flags: true,
      createdAt: true,
      updatedAt: true,
      userId: true,
      user: { select: { email: true } },
      analysis: { select: { accuracy: true, clarity: true, suggestions: true } },
      stats: { select: { likes: true, usage: true } },
    },
  });

  if (!prompt) {
    return (
      <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-black/10">
        <div className="flex items-center justify-between gap-3">
          <div className="text-sm font-semibold text-gray-900">Prompt not found</div>
          <a
            href={closeHref}
            className="rounded-lg border border-black/10 bg-white px-2.5 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50"
          >
            Close
          </a>
        </div>
      </div>
    );
  }

  const score = effectiveDisplayScore(prompt);

  return (    <div className="fixed inset-0 z-50 bg-black/40 p-4 md:p-6">
      <div className="mx-auto w-full max-w-4xl rounded-xl bg-white p-5 shadow-xl ring-1 ring-black/10">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="text-base font-semibold text-gray-900">{prompt.user.email}</div>
            <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-gray-500">
              <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 font-semibold text-gray-700 ring-1 ring-black/10">
                status: {prompt.status}
              </span>
              <span
                className={[
                  "inline-flex items-center rounded-full px-2 py-0.5 font-semibold ring-1",
                  prompt.moderationStatus === "APPROVED"
                    ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
                    : prompt.moderationStatus === "PENDING"
                      ? "bg-amber-50 text-amber-800 ring-amber-200"
                      : "bg-red-50 text-red-700 ring-red-200",
                ].join(" ")}
              >
                moderation: {prompt.moderationStatus}
              </span>
              <ScoreBadge score={score} />              <span className="inline-flex items-center rounded-full bg-white px-2 py-0.5 font-semibold text-gray-700 ring-1 ring-black/10">
                likes: {prompt.stats?.likes ?? 0}
              </span>
              <span className="inline-flex items-center rounded-full bg-white px-2 py-0.5 font-semibold text-gray-700 ring-1 ring-black/10">
                usage: {prompt.stats?.usage ?? 0}
              </span>
            </div>
          </div>

          <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
            <a
              href={closeHref}
              className="rounded-lg border border-black/10 bg-white px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
            >
              Close
            </a>

            <PublishToggle
              promptId={prompt.id}
              status={prompt.status}
              size="md"
            />
            {prompt.moderationStatus === "PENDING" ? (
              <form action={adminRejectPrompt}>
                <input type="hidden" name="promptId" value={prompt.id} />
                <button
                  type="submit"
                  className="rounded-lg bg-red-600 px-3 py-2 text-sm font-semibold text-white hover:bg-red-700"
                >
                  Reject
                </button>
              </form>
            ) : null}

            <form action={adminRemovePrompt}>
              <input type="hidden" name="promptId" value={prompt.id} />
              <button
                type="submit"
                className="rounded-lg bg-gray-900 px-3 py-2 text-sm font-semibold text-white hover:bg-black"
              >
                Remove
              </button>
            </form>
          </div>
        </div>

        {prompt.reason ? (
          <div className="mt-3 text-xs font-semibold text-red-700">Reason: {prompt.reason}</div>
        ) : null}

        <SeeMoreText
          text={prompt.content}
          collapsedMaxHeightPx={280}
          className="mt-4"
          contentClassName="rounded-lg bg-gray-50 p-4 text-sm text-gray-800 ring-1 ring-black/5"
          buttonClassName="!text-gray-700"
          buttonStyle={{ color: "#374151" }}
        />

        {prompt.flags?.length ? (
          <div className="mt-3 text-xs text-gray-600">
            <span className="font-semibold">Flags:</span> {prompt.flags.slice(0, 10).join(", ")}
          </div>
        ) : null}

        {prompt.analysis ? (
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <div className="rounded-lg bg-white p-3 ring-1 ring-black/10">
              <div className="text-[11px] font-semibold text-gray-600">Accuracy</div>
              <div className="mt-0.5 text-sm font-semibold text-gray-900">{prompt.analysis.accuracy}</div>
            </div>
            <div className="rounded-lg bg-white p-3 ring-1 ring-black/10">
              <div className="text-[11px] font-semibold text-gray-600">Clarity</div>
              <div className="mt-0.5 text-sm font-semibold text-gray-900">{prompt.analysis.clarity}</div>
            </div>
            <div className="rounded-lg bg-white p-3 ring-1 ring-black/10">
              <div className="text-[11px] font-semibold text-gray-600">Suggestions</div>
              <SeeMoreText
                text={prompt.analysis.suggestions}
                collapsedMaxHeightPx={120}
                className="mt-0.5"
                contentClassName="whitespace-pre-wrap text-xs text-gray-800"
                buttonClassName="!text-gray-700"
                buttonStyle={{ color: "#374151" }}
              />
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

