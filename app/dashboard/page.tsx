import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { DeleteButton } from "@/app/_components/DeleteButton";
import { SuggestionClamp } from "@/app/_components/SuggestionClamp";
import { RequireLoginGate } from "@/components/layout/RequireLoginGate";
import { PageMeta } from "@/components/layout/PageMeta";

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) return <RequireLoginGate />;

  const isAdmin = user.role === "ADMIN";

  const prompts = await prisma.prompt
    .findMany({
      where: isAdmin
        ? {
            OR: [{ status: "UNDER_REVIEW" }, { moderationStatus: "PENDING" }],
          }
        : { userId: user.id },
      orderBy: { createdAt: "desc" },
      include: isAdmin
        ? { analysis: true, stats: true, user: { select: { email: true } } }
        : { analysis: true, stats: true },
    })
    .catch(() => null);

  return (
    <div className="mx-auto w-full max-w-5xl">
      <PageMeta
        title="Dashboard"
        actions={
          <button className="rounded-lg border-[0.5px] border-black/10 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50">
            Export
          </button>
        }
      />

      <div className="mb-6 flex items-end justify-between gap-4">
        <div>
          <h1 className="text-xl font-medium text-gray-900">Dashboard</h1>
          <p className="mt-1 text-sm text-gray-600">
            {isAdmin
              ? "Admin view: prompts needing moderation and recent drafts."
              : "Your saved prompts and AI ratings."}
          </p>
        </div>
        {isAdmin ? null : (
          <Link
            href="/upload"
            className="rounded-lg bg-[#EEEDFE] px-4 py-2 text-sm font-medium text-[#534AB7] hover:opacity-90"
          >
            New prompt
          </Link>
        )}
      </div>

      <div className="grid gap-4">
        {prompts === null ? (
          <div className="rounded-xl border-[0.5px] border-black/10 bg-white p-6 text-sm text-gray-700">
            Database not reachable. Make sure Postgres is running and your{" "}
            <code className="mx-1 rounded bg-gray-100 px-1 py-0.5">DATABASE_URL</code>{" "}
            is correct, then run{" "}
            <code className="mx-1 rounded bg-gray-100 px-1 py-0.5">npm run db:migrate</code>.
          </div>
        ) : null}

        {prompts?.length === 0 ? (
          <div className="rounded-xl border-[0.5px] border-black/10 bg-white p-6 text-sm text-gray-600">
            {isAdmin ? "No prompts waiting for review." : "No prompts yet. Create one from the upload page."}
          </div>
        ) : null}

        {prompts?.map((p) => {
          const hasAnalysis = !!p.analysis;
          const moderation = p.moderationStatus;
          const isPublished = moderation === "APPROVED" && p.status === "PUBLISHED";
          const isPending = moderation === "PENDING";
          const isRejected = moderation === "REJECTED";
          return (
            <div key={p.id} className="rounded-xl border-[0.5px] border-black/10 bg-white p-6">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-700">
                      {moderation.toLowerCase()}
                    </span>
                    {isAdmin && "user" in p ? (
                      <span className="text-xs text-gray-500">
                        Owner: {(p as { user?: { email?: string } }).user?.email ?? "—"}
                      </span>
                    ) : null}
                    <span className="text-xs text-gray-500">
                      {new Date(p.createdAt).toLocaleString()}
                    </span>
                    {p.stats ? (
                      <span className="text-xs text-gray-500">Likes: {p.stats.likes}</span>
                    ) : null}
                  </div>

                  <div className="mt-3 max-h-40 overflow-hidden whitespace-pre-wrap rounded-xl border-[0.5px] border-black/10 bg-gray-50 p-3 text-sm text-gray-800">
                    {p.content}
                  </div>

                  <div className="mt-4 grid gap-3 sm:grid-cols-3">
                    <div className="rounded-xl border-[0.5px] border-black/10 p-3">
                      <div className="text-xs font-medium uppercase tracking-wide text-gray-500">
                        Accuracy
                      </div>
                      <div className="mt-1 text-lg font-medium">
                        {hasAnalysis ? p.analysis!.accuracy : "—"}
                      </div>
                    </div>
                    <div className="rounded-xl border-[0.5px] border-black/10 p-3">
                      <div className="text-xs font-medium uppercase tracking-wide text-gray-500">
                        Clarity
                      </div>
                      <div className="mt-1 text-lg font-medium">
                        {hasAnalysis ? p.analysis!.clarity : "—"}
                      </div>
                    </div>
                    <div className="rounded-xl border-[0.5px] border-black/10 p-3">
                      <div className="text-xs font-medium uppercase tracking-wide text-gray-500">
                        Suggestions
                      </div>
                      <SuggestionClamp
                        text={hasAnalysis ? p.analysis!.suggestions : null}
                        placeholder="Analyze before publishing."
                      />
                    </div>
                  </div>
                </div>

                <div className="flex shrink-0 flex-col items-end gap-2">
                  {isPublished ? <span className="text-xs text-gray-500">Published</span> : null}
                  {isPending ? <span className="text-xs font-medium text-amber-700">In review</span> : null}
                  {isRejected ? <span className="text-xs font-medium text-red-700">Rejected</span> : null}
                  <DeleteButton promptId={p.id} />
                  {!hasAnalysis && !isPublished ? (
                    <span className="text-xs text-gray-500">Analysis not saved for this prompt.</span>
                  ) : null}
                  {isAdmin && (isPending || p.status === "UNDER_REVIEW") ? (
                    <Link
                      href="/admin/review"
                      className="text-xs font-medium text-blue-700 hover:underline"
                    >
                      Review queue →
                    </Link>
                  ) : null}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

