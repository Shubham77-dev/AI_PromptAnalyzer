import { prisma } from "@/lib/prisma";
import { LikeButton } from "@/app/_components/LikeButton";
import { CopyButton } from "@/app/_components/CopyButton";

export default async function LibraryPage({
  searchParams,
}: Readonly<{ searchParams: { q?: string } }>) {
  const { q } = searchParams;
  const query = (q || "").trim();

  const prompts = await prisma.prompt
    .findMany({
      where: {
        status: "PUBLISHED",
        ...(query
          ? {
              content: {
                contains: query,
                mode: "insensitive",
              },
            }
          : {}),
      },
      orderBy: { createdAt: "desc" },
      take: 50,
      include: {
        user: { select: { email: true } },
        analysis: true,
        stats: true,
      },
    })
    .catch(() => null);

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-8">
      <div className="mb-6">
        <h1 className="text-xl font-semibold tracking-tight">Public Prompt Library</h1>
        <p className="mt-1 text-sm text-zinc-600">
          Search and copy published prompts. Likes are limited to one per user.
        </p>
      </div>

      <form className="mb-5 rounded-2xl border border-zinc-200 bg-white p-4">
        <label htmlFor="library-search" className="text-sm font-medium">
          Search
        </label>
        <input
          id="library-search"
          name="q"
          defaultValue={query}
          placeholder="Try: 'summarize', 'SQL', 'tone', 'marketing'…"
          className="mt-2 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-zinc-900/10"
        />
        <div className="mt-3 text-xs text-zinc-500">
          Showing {prompts ? prompts.length : 0} result(s)
          {query ? ` for “${query}”` : ""}.
        </div>
      </form>

      <div className="grid gap-4">
        {prompts === null ? (
          <div className="rounded-2xl border border-zinc-200 bg-white p-6 text-sm text-zinc-700">
            Database not reachable. Start Postgres, check your
            <code className="mx-1 rounded bg-zinc-100 px-1 py-0.5">DATABASE_URL</code>,
            and run
            <code className="mx-1 rounded bg-zinc-100 px-1 py-0.5">npm run db:migrate</code>.
          </div>
        ) : null}

        {prompts?.map((p) => (
          <div key={p.id} className="rounded-2xl border border-zinc-200 bg-white p-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-500">
                  <span>{p.user.email}</span>
                  <span>•</span>
                  <span>{new Date(p.createdAt).toLocaleString()}</span>
                  {p.stats ? (
                    <>
                      <span>•</span>
                      <span>Likes: {p.stats.likes}</span>
                    </>
                  ) : null}
                </div>

                <div className="mt-3 whitespace-pre-wrap rounded-xl border border-zinc-200 bg-zinc-50 p-3 text-sm text-zinc-800">
                  {p.content}
                </div>

                {p.analysis ? (
                  <div className="mt-4 grid gap-3 sm:grid-cols-3">
                    <div className="rounded-xl border border-zinc-200 p-3">
                      <div className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                        Accuracy
                      </div>
                      <div className="mt-1 text-lg font-semibold">{p.analysis.accuracy}</div>
                    </div>
                    <div className="rounded-xl border border-zinc-200 p-3">
                      <div className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                        Clarity
                      </div>
                      <div className="mt-1 text-lg font-semibold">{p.analysis.clarity}</div>
                    </div>
                    <div className="rounded-xl border border-zinc-200 p-3">
                      <div className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                        Suggestions
                      </div>
                      <div className="mt-1 max-h-16 overflow-hidden text-sm text-zinc-700">
                        {p.analysis.suggestions}
                      </div>
                    </div>
                  </div>
                ) : null}
              </div>

              <div className="flex shrink-0 flex-col items-end gap-2">
                <CopyButton text={p.content} />
                <LikeButton promptId={p.id} initialLikes={p.stats?.likes ?? 0} />
              </div>
            </div>
          </div>
        ))}

        {prompts && prompts.length === 0 ? (
          <div className="rounded-2xl border border-zinc-200 bg-white p-6 text-sm text-zinc-600">
            No published prompts yet.
          </div>
        ) : null}
      </div>
    </div>
  );
}

