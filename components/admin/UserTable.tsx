import { prisma } from "@/lib/prisma";
import { adminSetUserRole, adminSuspendUser } from "@/app/admin/actions";

export type AdminUsersSearchParams = {
  q?: string;
  plan?: "FREE" | "PRO" | "ENTERPRISE" | "all";
  status?: "ACTIVE" | "SUSPENDED" | "all";
  page?: string;
};

function initials(email: string) {
  const name = email.split("@")[0] ?? email;
  const a = name[0] ?? "U";
  const b = name[1] ?? "";
  return (a + b).toUpperCase();
}

function parsePage(page: string | undefined) {
  const n = Number(page ?? "1");
  if (!Number.isFinite(n) || n < 1) return 1;
  return Math.floor(n);
}

function fmtDate(d: Date) {
  return d.toISOString().slice(0, 10);
}

export async function UserTable({ searchParams }: Readonly<{ searchParams: AdminUsersSearchParams }>) {
  const pageSize = 20;
  const page = parsePage(searchParams.page);
  const q = (searchParams.q ?? "").trim().toLowerCase();
  const plan = searchParams.plan ?? "all";
  const status = searchParams.status ?? "all";

  const where = {
    ...(q ? { email: { contains: q, mode: "insensitive" as const } } : null),
    ...(plan !== "all" ? { plan } : null),
    ...(status !== "all" ? { status } : null),
  };

  const [total, users] = await Promise.all([
    prisma.user.count({ where }),
    prisma.user.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: pageSize,
      skip: (page - 1) * pageSize,
      select: { id: true, email: true, role: true, plan: true, status: true, createdAt: true },
    }),
  ]);

  const ids = users.map((u) => u.id);
  const counts = ids.length
    ? await prisma.prompt.groupBy({
        by: ["userId"],
        _count: { _all: true },
        where: { userId: { in: ids } },
      })
    : [];

  const countByUserId = new Map<string, number>(counts.map((c) => [c.userId, c._count._all]));
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className="rounded-xl bg-white shadow-sm ring-1 ring-black/10">
      <div className="border-b border-black/5 p-4">
        <form className="flex flex-wrap items-end gap-3" action="/admin/users" method="GET">
          <div className="min-w-[240px]">
            <div className="text-xs font-medium text-gray-600">Search email</div>
            <input
              name="q"
              defaultValue={searchParams.q ?? ""}
              placeholder="user@company.com"
              className="mt-1 w-full rounded-lg border border-black/10 bg-white px-3 py-2 text-sm outline-none focus:border-red-300 focus:ring-2 focus:ring-red-100"
            />
          </div>
          <div>
            <div className="text-xs font-medium text-gray-600">Plan</div>
            <select
              name="plan"
              defaultValue={plan}
              className="mt-1 rounded-lg border border-black/10 bg-white px-3 py-2 text-sm outline-none focus:border-red-300 focus:ring-2 focus:ring-red-100"
            >
              <option value="all">All</option>
              <option value="FREE">Free</option>
              <option value="PRO">Pro</option>
              <option value="ENTERPRISE">Enterprise</option>
            </select>
          </div>
          <div>
            <div className="text-xs font-medium text-gray-600">Status</div>
            <select
              name="status"
              defaultValue={status}
              className="mt-1 rounded-lg border border-black/10 bg-white px-3 py-2 text-sm outline-none focus:border-red-300 focus:ring-2 focus:ring-red-100"
            >
              <option value="all">All</option>
              <option value="ACTIVE">Active</option>
              <option value="SUSPENDED">Suspended</option>
            </select>
          </div>
          <button
            type="submit"
            className="rounded-lg bg-red-600 px-3 py-2 text-sm font-semibold text-white hover:bg-red-700"
          >
            Apply
          </button>
          <div className="ml-auto text-xs text-gray-500">
            {total} users • page {page} / {totalPages}
          </div>
        </form>
      </div>

      <div className="overflow-auto">
        <table className="min-w-[980px] w-full text-left text-sm">
          <thead className="bg-gray-50 text-xs font-semibold text-gray-600">
            <tr>
              <th className="px-4 py-3">User</th>
              <th className="px-4 py-3">Plan</th>
              <th className="px-4 py-3">Prompts</th>
              <th className="px-4 py-3">Joined</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-black/5">
            {users.map((u) => {
              const promptCount = countByUserId.get(u.id) ?? 0;
              return (
                <tr key={u.id} className="hover:bg-gray-50/60">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="grid h-9 w-9 place-items-center rounded-full bg-red-50 text-xs font-semibold text-red-700 ring-1 ring-red-200">
                        {initials(u.email)}
                      </div>
                      <div className="min-w-0">
                        <div className="truncate font-medium text-gray-900">{u.email}</div>
                        <div className="text-xs text-gray-500">{u.role}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">{u.plan}</td>
                  <td className="px-4 py-3">{promptCount}</td>
                  <td className="px-4 py-3">{fmtDate(u.createdAt)}</td>
                  <td className="px-4 py-3">
                    <span
                      className={[
                        "inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1",
                        u.status === "ACTIVE"
                          ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
                          : "bg-red-50 text-red-700 ring-red-200",
                      ].join(" ")}
                    >
                      {u.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <a
                        className="rounded-lg border border-black/10 bg-white px-2.5 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50"
                        href={`/admin/users?view=${encodeURIComponent(u.id)}`}
                      >
                        View
                      </a>

                      <form action={adminSetUserRole}>
                        <input type="hidden" name="userId" value={u.id} />
                        <select
                          name="role"
                          defaultValue={u.role}
                          className="rounded-lg border border-black/10 bg-white px-2 py-1.5 text-xs font-semibold text-gray-700 outline-none focus:border-red-300 focus:ring-2 focus:ring-red-100"
                        >
                          <option value="USER">USER</option>
                          <option value="ADMIN">ADMIN</option>
                        </select>
                        <button
                          type="submit"
                          className="ml-2 rounded-lg bg-gray-900 px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-black"
                        >
                          Save role
                        </button>
                      </form>

                      <form action={adminSuspendUser}>
                        <input type="hidden" name="userId" value={u.id} />
                        <button
                          type="submit"
                          className="rounded-lg bg-red-600 px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-red-700"
                        >
                          Suspend
                        </button>
                      </form>
                    </div>
                  </td>
                </tr>
              );
            })}
            {users.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-sm text-gray-500">
                  No users found.
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
          href={`/admin/users?${new URLSearchParams({
            q: searchParams.q ?? "",
            plan: plan,
            status: status,
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
          href={`/admin/users?${new URLSearchParams({
            q: searchParams.q ?? "",
            plan: plan,
            status: status,
            page: String(Math.min(totalPages, page + 1)),
          }).toString()}`}
        >
          Next
        </a>
      </div>
    </div>
  );
}

