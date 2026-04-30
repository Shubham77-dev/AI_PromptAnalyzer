import { prisma } from "@/lib/prisma";
import { PageMeta } from "@/components/layout/PageMeta";
import { PublishToggle } from "@/components/admin/PublishToggle";
import { adminRejectPrompt } from "./actions";

function scoreFor(p: { score: number | null; analysis: { accuracy: number } | null }) {
  if (typeof p.score === "number" && Number.isFinite(p.score)) return Math.round(p.score);
  return p.analysis?.accuracy ?? null;
}

export default async function AdminReviewPage() {
  const prompts = await prisma.prompt.findMany({
    where: {
      moderationStatus: "PENDING",
    },
    orderBy: { updatedAt: "desc" },
    take: 50,
    select: {
      id: true,
      content: true,
      flags: true,
      reason: true,
      score: true,
      status: true,
      moderationStatus: true,
      updatedAt: true,
      user: { select: { email: true } },
      analysis: { select: { accuracy: true } },
    },
  });

  return (
    <div className="grid gap-4">
      <PageMeta title="Review queue" />

      <div className="text-sm text-gray-600">
        Pending prompts require admin approval. You can publish if score is at least 50.
      </div>

      <div className="grid gap-3">
        {prompts.map((p) => {
          const score = scoreFor(p);
          const canApprove = typeof score === "number" && score >= 50;
          return (
            <div key={p.id} className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-black/10">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-sm font-semibold text-gray-900">{p.user.email}</div>
                  <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-gray-500">
                    <span className="inline-flex items-center rounded-full bg-amber-50 px-2 py-0.5 font-semibold text-amber-800 ring-1 ring-amber-200">
                      {p.moderationStatus}
                    </span>
                    <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 font-semibold text-gray-700 ring-1 ring-black/10">
                      status: {p.status}
                    </span>
                    <span className="inline-flex items-center rounded-full bg-white px-2 py-0.5 font-semibold text-gray-700 ring-1 ring-black/10">
                      score: {score ?? "—"}
                    </span>
                    <span className="inline-flex items-center rounded-full bg-white px-2 py-0.5 font-semibold text-gray-700 ring-1 ring-black/10">
                      updated: {p.updatedAt.toISOString().slice(0, 19).replace("T", " ")}
                    </span>
                  </div>
                </div>

                <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
                  <PublishToggle
                    promptId={p.id}
                    status={p.status}
                    size="md"
                    disabled={!canApprove}
                    disabledReason="Publish requires score ≥ 50"
                  />
                  <form action={adminRejectPrompt}>
                    <input type="hidden" name="promptId" value={p.id} />
                    <button
                      type="submit"
                      className="rounded-lg bg-red-600 px-3 py-2 text-sm font-semibold text-white hover:bg-red-700"
                    >
                      Reject
                    </button>
                  </form>
                </div>
              </div>

              <div className="mt-3 whitespace-pre-wrap rounded-lg bg-gray-50 p-3 text-sm text-gray-800 ring-1 ring-black/5">
                {p.content}
              </div>

              {(p.flags?.length || p.reason) && (
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  {p.flags?.length ? (
                    <span className="inline-flex items-center rounded-full bg-white px-2 py-0.5 text-[11px] font-semibold text-gray-700 ring-1 ring-black/10">
                      flags: {p.flags.slice(0, 6).join(", ")}
                    </span>
                  ) : null}
                  {p.reason ? (
                    <span className="inline-flex items-center rounded-full bg-red-50 px-2 py-0.5 text-[11px] font-semibold text-red-700 ring-1 ring-red-200">
                      {p.reason}
                    </span>
                  ) : null}
                </div>
              )}
            </div>
          );
        })}

        {prompts.length === 0 ? (
          <div className="rounded-xl bg-white p-6 text-sm text-gray-500 shadow-sm ring-1 ring-black/10">
            No prompts waiting for review.
          </div>
        ) : null}
      </div>
    </div>
  );
}

