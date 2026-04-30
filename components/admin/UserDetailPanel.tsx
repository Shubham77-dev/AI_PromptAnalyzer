import { prisma } from "@/lib/prisma";

function fmtDateTime(d: Date) {
  return d.toISOString().slice(0, 19).replace("T", " ");
}

export async function UserDetailPanel({
  userId,
  closeHref,
}: Readonly<{
  userId: string;
  closeHref: string;
}>) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, role: true, status: true, plan: true, createdAt: true },
  });

  if (!user) {
    return (
      <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-black/10">
        <div className="flex items-center justify-between gap-3">
          <div className="text-sm font-semibold text-gray-900">User not found</div>
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

  const [promptTotal, promptPublished, promptDrafts, promptUnderReview, likesGiven] = await Promise.all([
    prisma.prompt.count({ where: { userId: user.id } }),
    prisma.prompt.count({ where: { userId: user.id, status: "PUBLISHED" } }),
    prisma.prompt.count({ where: { userId: user.id, status: "DRAFT" } }),
    prisma.prompt.count({ where: { userId: user.id, status: "UNDER_REVIEW" } }),
    prisma.like.count({ where: { userId: user.id } }),
  ]);

  return (
    <div className="fixed inset-0 z-50 bg-black/40 p-4 md:p-6">
      <div className="mx-auto w-full max-w-2xl rounded-xl bg-white p-5 shadow-xl ring-1 ring-black/10">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="truncate text-base font-semibold text-gray-900">{user.email}</div>
            <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-gray-500">
              <span className="inline-flex items-center rounded-full bg-white px-2 py-0.5 font-semibold text-gray-700 ring-1 ring-black/10">
                role: {user.role}
              </span>
              <span className="inline-flex items-center rounded-full bg-white px-2 py-0.5 font-semibold text-gray-700 ring-1 ring-black/10">
                plan: {user.plan}
              </span>
              <span
                className={[
                  "inline-flex items-center rounded-full px-2 py-0.5 font-semibold ring-1",
                  user.status === "ACTIVE"
                    ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
                    : "bg-red-50 text-red-700 ring-red-200",
                ].join(" ")}
              >
                status: {user.status}
              </span>
              <span className="inline-flex items-center rounded-full bg-white px-2 py-0.5 font-semibold text-gray-700 ring-1 ring-black/10">
                joined: {fmtDateTime(user.createdAt)}
              </span>
            </div>
          </div>

          <a
            href={closeHref}
            className="shrink-0 rounded-lg border border-black/10 bg-white px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
          >
            Close
          </a>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl bg-gray-50 p-4 ring-1 ring-black/5">
            <div className="text-xs font-semibold text-gray-600">Prompts</div>
            <div className="mt-1 text-2xl font-semibold text-gray-900">{promptTotal}</div>
            <div className="mt-2 grid grid-cols-3 gap-2 text-xs text-gray-600">
              <div className="rounded-lg bg-white px-3 py-2 ring-1 ring-black/5">
                <div className="font-semibold text-gray-900">{promptPublished}</div>
                <div>Published</div>
              </div>
              <div className="rounded-lg bg-white px-3 py-2 ring-1 ring-black/5">
                <div className="font-semibold text-gray-900">{promptDrafts}</div>
                <div>Drafts</div>
              </div>
              <div className="rounded-lg bg-white px-3 py-2 ring-1 ring-black/5">
                <div className="font-semibold text-gray-900">{promptUnderReview}</div>
                <div>Review</div>
              </div>
            </div>
          </div>

          <div className="rounded-xl bg-gray-50 p-4 ring-1 ring-black/5">
            <div className="text-xs font-semibold text-gray-600">Engagement</div>
            <div className="mt-1 text-2xl font-semibold text-gray-900">{likesGiven}</div>
            <div className="mt-1 text-xs text-gray-600">Likes given</div>
          </div>
        </div>
      </div>
    </div>
  );
}

