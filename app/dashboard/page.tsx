import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PublishButton } from "@/app/_components/PublishButton";

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/");

  const prompts = await prisma.prompt
    .findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      include: { analysis: true, stats: true },
    })
    .catch(() => null);

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-8">
      <div className="mb-6 flex items-end justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Dashboard</h1>
          <p className="mt-1 text-sm text-zinc-600">
            Your drafts and private AI ratings. Publish when you’re ready.
          </p>
        </div>
        <Link
          href="/upload"
          className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800"
        >
          New prompt
        </Link>
      </div>

      <div className="grid gap-4">
        {prompts === null ? (
          <div className="rounded-2xl border border-zinc-200 bg-white p-6 text-sm text-zinc-700">
            Database not reachable. Make sure Postgres is running and your
            <code className="mx-1 rounded bg-zinc-100 px-1 py-0.5">DATABASE_URL</code>
            is correct, then run
            <code className="mx-1 rounded bg-zinc-100 px-1 py-0.5">npm run db:migrate</code>.
          </div>
        ) : null}

        {prompts && prompts.length === 0 ? (
          <div className="rounded-2xl border border-zinc-200 bg-white p-6 text-sm text-zinc-600">
            No prompts yet. Create one from the upload page.
          </div>
        ) : null}

        {prompts?.map((p) => {
          const hasAnalysis = !!p.analysis;
          const isPublished = p.status === "PUBLISHED";
          return (
            <div key={p.id} className="rounded-2xl border border-zinc-200 bg-white p-6">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        isPublished
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-zinc-100 text-zinc-700"
                      }`}
                    >
                      {p.status.toLowerCase()}
                    </span>
                    <span className="text-xs text-zinc-500">
                      {new Date(p.createdAt).toLocaleString()}
                    </span>
                    {p.stats ? (
                      <span className="text-xs text-zinc-500">
                        Likes: {p.stats.likes}
                      </span>
                    ) : null}
                  </div>

                  <div className="mt-3 max-h-40 overflow-hidden whitespace-pre-wrap rounded-xl border border-zinc-200 bg-zinc-50 p-3 text-sm text-zinc-800">
                    {p.content}
                  </div>

                  <div className="mt-4 grid gap-3 sm:grid-cols-3">
                    <div className="rounded-xl border border-zinc-200 p-3">
                      <div className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                        Accuracy
                      </div>
                      <div className="mt-1 text-lg font-semibold">
                        {hasAnalysis ? p.analysis!.accuracy : "—"}
                      </div>
                    </div>
                    <div className="rounded-xl border border-zinc-200 p-3">
                      <div className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                        Clarity
                      </div>
                      <div className="mt-1 text-lg font-semibold">
                        {hasAnalysis ? p.analysis!.clarity : "—"}
                      </div>
                    </div>
                    <div className="rounded-xl border border-zinc-200 p-3">
                      <div className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                        Suggestions
                      </div>
                      <div className="mt-1 max-h-16 overflow-hidden text-sm text-zinc-700">
                        {hasAnalysis ? p.analysis!.suggestions : "Analyze before publishing."}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex shrink-0 flex-col items-end gap-2">
                  {isPublished ? (
                    <span className="text-xs text-zinc-500">Published</span>
                  ) : (
                    <PublishButton promptId={p.id} disabled={!hasAnalysis} />
                  )}
                  {!hasAnalysis && !isPublished ? (
                    <span className="text-xs text-amber-700">
                      You can’t publish without analysis.
                    </span>
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

