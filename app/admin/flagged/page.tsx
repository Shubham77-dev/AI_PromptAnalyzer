import { prisma } from "@/lib/prisma";
import { FlagCard } from "@/components/admin/FlagCard";
import { PublishToggle } from "@/components/admin/PublishToggle";
import { adminIgnoreFlag, adminRemovePrompt, adminSuspendUser } from "@/app/admin/actions";

function scoreFor(p: { score: number | null; analysis: { accuracy: number } | null }) {
  if (typeof p.score === "number" && Number.isFinite(p.score)) return Math.round(p.score);
  return p.analysis?.accuracy ?? null;
}

export default async function AdminFlaggedPage() {
  const prompts = await prisma.prompt.findMany({
    where: {
      status: "PUBLISHED",
      OR: [{ flagged: true }, { score: { lt: 40 } }, { analysis: { accuracy: { lt: 40 } } }],
    },
    orderBy: [{ flagged: "desc" }, { updatedAt: "desc" }],
    take: 30,
    select: {
      id: true,
      content: true,
      flagged: true,
      reason: true,
      score: true,
      status: true,
      userId: true,
      user: { select: { email: true } },
      analysis: { select: { accuracy: true } },
      updatedAt: true,
    },
  });

  return (
    <div className="grid gap-4">
      <div>
        <div className="text-lg font-semibold text-gray-900">Flagged</div>
        <div className="text-sm text-gray-500">
          Prompts that are flagged or have a low score while published.
        </div>
      </div>

      <div className="grid gap-3">
        {prompts.map((p) => {
          const score = scoreFor(p);
          return (
            <FlagCard
              key={p.id}
              title={p.user.email}
              subtitle={
                p.flagged
                  ? `Flagged • ${p.updatedAt.toISOString().slice(0, 19).replace("T", " ")}`
                  : `Low score • ${p.updatedAt.toISOString().slice(0, 19).replace("T", " ")}`
              }
              contentPreview={p.content}
              meta={
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center rounded-full bg-white px-2 py-0.5 text-[11px] font-semibold text-gray-700 ring-1 ring-black/10">
                    status: {p.status}
                  </span>
                  <span className="inline-flex items-center rounded-full bg-white px-2 py-0.5 text-[11px] font-semibold text-gray-700 ring-1 ring-black/10">
                    score: {score ?? "—"}
                  </span>
                  {p.reason ? (
                    <span className="inline-flex items-center rounded-full bg-red-50 px-2 py-0.5 text-[11px] font-semibold text-red-700 ring-1 ring-red-200">
                      {p.reason}
                    </span>
                  ) : null}
                </div>
              }
              actions={
                <div className="flex flex-wrap items-center justify-end gap-2">
                  <form action={adminIgnoreFlag}>
                    <input type="hidden" name="promptId" value={p.id} />
                    <button
                      type="submit"
                      className="rounded-lg border border-black/10 bg-white px-2.5 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50"
                    >
                      Ignore
                    </button>
                  </form>
                  <PublishToggle promptId={p.id} status={p.status} />
                  <form action={adminSuspendUser}>
                    <input type="hidden" name="userId" value={p.userId} />
                    <button
                      type="submit"
                      className="rounded-lg bg-red-600 px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-red-700"
                    >
                      Suspend user
                    </button>
                  </form>
                  <form action={adminRemovePrompt}>
                    <input type="hidden" name="promptId" value={p.id} />
                    <button
                      type="submit"
                      className="rounded-lg bg-gray-900 px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-black"
                    >
                      Remove
                    </button>
                  </form>
                </div>
              }
            />
          );
        })}
        {prompts.length === 0 ? (
          <div className="rounded-xl bg-white p-6 text-sm text-gray-500 shadow-sm ring-1 ring-black/10">
            Nothing to review right now.
          </div>
        ) : null}
      </div>
    </div>
  );
}

