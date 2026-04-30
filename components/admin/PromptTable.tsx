import { prisma } from "@/lib/prisma";
import { adminRemovePrompt, adminUnpublishPrompt } from "@/app/admin/actions";

export type AdminPromptsSearchParams = {
  status?: "PUBLISHED" | "DRAFT" | "UNDER_REVIEW" | "all";
  minScore?: string;
  maxScore?: string;
  page?: string;
};

function truncate(s: string, max = 140) {
  const t = s.trim();
  if (t.length <= max) return t;
  return t.slice(0, Math.max(0, max - 1)).trimEnd() + "…";
}

function parsePage(page: string | undefined) {
  const n = Number(page ?? "1");
  if (!Number.isFinite(n) || n < 1) return 1;
  return Math.floor(n);
}

function parseScore(v: string | undefined) {
  if (!v) return null;
  const n = Number(v);
  if (!Number.isFinite(n)) return null;
  return Math.max(0, Math.min(100, n));
}

export async function PromptTable({ searchParams }: Readonly<{ searchParams: AdminPromptsSearchParams }>) {
  const pageSize = 20;
  const page = parsePage(searchParams.page);
  const status = searchParams.status ?? "all";
  const minScore = parseScore(searchParams.minScore);
  const maxScore = parseScore(searchParams.maxScore);

  const where = {
    ...(status !== "all" ? { status } : null),
    ...(minScore != null || maxScore != null
      ? {
          score: {
            ...(minScore != null ? { gte: minScore } : null),
            ...(maxScore != null ? { lte: maxScore } : null),
          },
        }
      : null),
  };

  const [total, prompts] = await Promise.all([
    prisma.prompt.count({ where }),
    prisma.prompt.findMany({
      where,
      orderBy: { updatedAt: "desc" },
      take: pageSize,
      skip: (page - 1) * pageSize,
      select: {
        id: true,
        content: true,
        status: true,
        score: true,
        flagged: true,
        user: { select: { email: true } },
        analysis: { select: { accuracy: true, clarity: true } },
        stats: { select: { likes: true } },
      },
    }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className="rounded-xl bg-white shadow-sm ring-1 ring-black/10">
      <div className="border-b border-black/5 p-4">
        <form className="grid gap-3 md:flex md:flex-wrap md:items-end" action="/admin/prompts" method="GET">
          <div className="md:w-auto">
            <div className="text-xs font-medium text-gray-600">Status</div>
            <select
              name="status"
              defaultValue={status}
              className="mt-1 w-full rounded-lg border border-black/10 bg-white px-3 py-2 text-sm outline-none focus:border-red-300 focus:ring-2 focus:ring-red-100 md:w-auto"
            >
              <option value="all">All</option>
              <option value="PUBLISHED">Published</option>
              <option value="UNDER_REVIEW">Under review</option>
              <option value="DRAFT">Draft</option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3 md:flex md:items-end">
            <div className="min-w-0">
              <div className="text-xs font-medium text-gray-600">Min score</div>
              <input
                name="minScore"
                inputMode="numeric"
                defaultValue={searchParams.minScore ?? ""}
                className="mt-1 w-full rounded-lg border border-black/10 bg-white px-3 py-2 text-sm outline-none focus:border-red-300 focus:ring-2 focus:ring-red-100 md:w-[120px]"
                placeholder="0"
              />
            </div>
            <div className="min-w-0">
              <div className="text-xs font-medium text-gray-600">Max score</div>
              <input
                name="maxScore"
                inputMode="numeric"
                defaultValue={searchParams.maxScore ?? ""}
                className="mt-1 w-full rounded-lg border border-black/10 bg-white px-3 py-2 text-sm outline-none focus:border-red-300 focus:ring-2 focus:ring-red-100 md:w-[120px]"
                placeholder="100"
              />
            </div>
          </div>
          <button
            type="submit"
            className="rounded-lg bg-red-600 px-3 py-2 text-sm font-semibold text-white hover:bg-red-700"
          >
            Apply
          </button>
          <div className="text-xs text-gray-500 md:ml-auto">
            {total} prompts • page {page} / {totalPages}
          </div>
        </form>
      </div>

      {/* Mobile-first: cards. Desktop: table. */}
      <div className="grid gap-3 p-4 md:hidden">
        {prompts.map((p) => {
          const accuracy = p.analysis?.accuracy ?? null;
          const clarity = p.analysis?.clarity ?? null;
          const likes = p.stats?.likes ?? 0;
          return (
            <div key={p.id} className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-black/10">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="truncate text-sm font-semibold text-gray-900">{p.user.email}</div>
                  <div className="mt-1 flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-semibold text-gray-700 ring-1 ring-black/10">
                      {p.status}
                    </span>
                    {p.flagged ? (
                      <span className="inline-flex items-center rounded-full bg-red-50 px-2 py-0.5 text-[11px] font-semibold text-red-700 ring-1 ring-red-200">
                        flagged
                      </span>
                    ) : null}
                    <span className="inline-flex items-center rounded-full bg-white px-2 py-0.5 text-[11px] font-semibold text-gray-700 ring-1 ring-black/10">
                      likes: {likes}
                    </span>
                  </div>
                </div>
                <a
                  className="shrink-0 rounded-lg border border-black/10 bg-white px-2.5 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50"
                  href={`/admin/prompts?view=${encodeURIComponent(p.id)}`}
                >
                  View
                </a>
              </div>

              <div className="mt-3 max-h-36 overflow-hidden whitespace-pre-wrap break-words text-sm leading-6 text-gray-800">
                {truncate(p.content, 320)}
              </div>

              <div className="mt-3 grid grid-cols-3 gap-2">
                <div className="rounded-lg bg-gray-50 px-3 py-2">
                  <div className="text-[11px] font-semibold text-gray-600">Accuracy</div>
                  <div className="mt-0.5 text-sm font-semibold text-gray-900">{accuracy ?? "—"}</div>
                </div>
                <div className="rounded-lg bg-gray-50 px-3 py-2">
                  <div className="text-[11px] font-semibold text-gray-600">Clarity</div>
                  <div className="mt-0.5 text-sm font-semibold text-gray-900">{clarity ?? "—"}</div>
                </div>
                <div className="rounded-lg bg-gray-50 px-3 py-2">
                  <div className="text-[11px] font-semibold text-gray-600">Score</div>
                  <div className="mt-0.5 text-sm font-semibold text-gray-900">
                    {typeof p.score === "number" && Number.isFinite(p.score) ? Math.round(p.score) : "—"}
                  </div>
                </div>
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-2">
                <form action={adminUnpublishPrompt} className="flex-1">
                  <input type="hidden" name="promptId" value={p.id} />
                  <button
                    type="submit"
                    className="w-full rounded-lg bg-amber-600 px-3 py-2 text-sm font-semibold text-white hover:bg-amber-700"
                  >
                    Unpublish
                  </button>
                </form>
                <form action={adminRemovePrompt} className="flex-1">
                  <input type="hidden" name="promptId" value={p.id} />
                  <button
                    type="submit"
                    className="w-full rounded-lg bg-red-600 px-3 py-2 text-sm font-semibold text-white hover:bg-red-700"
                  >
                    Remove
                  </button>
                </form>
              </div>
            </div>
          );
        })}
        {prompts.length === 0 ? (
          <div className="rounded-xl bg-white p-6 text-center text-sm text-gray-500 shadow-sm ring-1 ring-black/10">
            No prompts found.
          </div>
        ) : null}
      </div>

      <div className="hidden overflow-auto md:block">
        <table className="min-w-[1100px] w-full text-left text-sm">
          <thead className="bg-gray-50 text-xs font-semibold text-gray-600">
            <tr>
              <th className="px-4 py-3">Preview</th>
              <th className="px-4 py-3">Author</th>
              <th className="px-4 py-3">Accuracy</th>
              <th className="px-4 py-3">Clarity</th>
              <th className="px-4 py-3">Likes</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-black/5">
            {prompts.map((p) => {
              const accuracy = p.analysis?.accuracy ?? null;
              const clarity = p.analysis?.clarity ?? null;
              const likes = p.stats?.likes ?? 0;
              return (
                <tr key={p.id} className="hover:bg-gray-50/60">
                  <td className="px-4 py-3 text-gray-800">{truncate(p.content)}</td>
                  <td className="px-4 py-3">{p.user.email}</td>
                  <td className="px-4 py-3">{accuracy ?? "—"}</td>
                  <td className="px-4 py-3">{clarity ?? "—"}</td>
                  <td className="px-4 py-3">{likes}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-semibold text-gray-700 ring-1 ring-black/10">
                        {p.status}
                      </span>
                      {p.flagged ? (
                        <span className="inline-flex items-center rounded-full bg-red-50 px-2 py-0.5 text-[11px] font-semibold text-red-700 ring-1 ring-red-200">
                          flagged
                        </span>
                      ) : null}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <a
                        className="rounded-lg border border-black/10 bg-white px-2.5 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50"
                        href={`/admin/prompts?view=${encodeURIComponent(p.id)}`}
                      >
                        View
                      </a>
                      <form action={adminUnpublishPrompt}>
                        <input type="hidden" name="promptId" value={p.id} />
                        <button
                          type="submit"
                          className="rounded-lg bg-amber-600 px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-amber-700"
                        >
                          Unpublish
                        </button>
                      </form>
                      <form action={adminRemovePrompt}>
                        <input type="hidden" name="promptId" value={p.id} />
                        <button
                          type="submit"
                          className="rounded-lg bg-red-600 px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-red-700"
                        >
                          Remove
                        </button>
                      </form>
                    </div>
                  </td>
                </tr>
              );
            })}
            {prompts.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-sm text-gray-500">
                  No prompts found.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between gap-2 border-t border-black/5 p-4 text-sm">
        <a
          className={[
            "rounded-lg border border-black/10 bg-white px-3 py-2 text-sm font-semibold",
            page <= 1 ? "pointer-events-none opacity-50" : "hover:bg-gray-50",
          ].join(" ")}
          href={`/admin/prompts?${new URLSearchParams({
            status: status,
            minScore: searchParams.minScore ?? "",
            maxScore: searchParams.maxScore ?? "",
            page: String(Math.max(1, page - 1)),
          }).toString()}`}
        >
          Prev
        </a>
        <a
          className={[
            "rounded-lg border border-black/10 bg-white px-3 py-2 text-sm font-semibold",
            page >= totalPages ? "pointer-events-none opacity-50" : "hover:bg-gray-50",
          ].join(" ")}
          href={`/admin/prompts?${new URLSearchParams({
            status: status,
            minScore: searchParams.minScore ?? "",
            maxScore: searchParams.maxScore ?? "",
            page: String(Math.min(totalPages, page + 1)),
          }).toString()}`}
        >
          Next
        </a>
      </div>
    </div>
  );
}

