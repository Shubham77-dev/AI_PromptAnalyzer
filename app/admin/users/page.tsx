import { UserTable } from "@/components/admin/UserTable";
import type { AdminUsersSearchParams } from "@/components/admin/UserTable";
import { UserDetailPanel } from "@/components/admin/UserDetailPanel";
import { z } from "zod";

export default async function AdminUsersPage({
  searchParams,
}: Readonly<{
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}>) {
  const sp = await searchParams;
  const get = (k: string) => {
    const v = sp[k];
    return Array.isArray(v) ? v[0] : v;
  };

  const viewIdRaw = get("view");
  const viewId = viewIdRaw && z.string().uuid().safeParse(viewIdRaw).success ? viewIdRaw : null;

  const planValue = get("plan");
  const plan: AdminUsersSearchParams["plan"] =
    planValue === "FREE" || planValue === "PRO" || planValue === "ENTERPRISE" || planValue === "all"
      ? planValue
      : "all";

  const statusValue = get("status");
  const status: AdminUsersSearchParams["status"] =
    statusValue === "ACTIVE" || statusValue === "SUSPENDED" || statusValue === "all" ? statusValue : "all";

  const closeParams = new URLSearchParams();
  const q = get("q");
  if (q) closeParams.set("q", q);
  if (plan !== "all") closeParams.set("plan", plan);
  if (status !== "all") closeParams.set("status", status);
  const page = get("page");
  if (page) closeParams.set("page", page);
  const closeHref = `/admin/users${closeParams.toString() ? `?${closeParams.toString()}` : ""}`;

  return (
    <div className="grid gap-4">
      <div>
        <div className="text-lg font-semibold text-gray-900">Users</div>
        <div className="text-sm text-gray-500">Manage roles, plans, and access.</div>
      </div>

      {viewId ? <UserDetailPanel userId={viewId} closeHref={closeHref} /> : null}

      <UserTable
        searchParams={{
          q: get("q"),
          plan,
          status,
          page: get("page"),
        }}
      />
    </div>
  );
}

