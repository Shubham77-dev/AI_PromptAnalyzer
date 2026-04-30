import { UserTable } from "@/components/admin/UserTable";
import type { AdminUsersSearchParams } from "@/components/admin/UserTable";

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

  const planValue = get("plan");
  const plan: AdminUsersSearchParams["plan"] =
    planValue === "FREE" || planValue === "PRO" || planValue === "ENTERPRISE" || planValue === "all"
      ? planValue
      : "all";

  const statusValue = get("status");
  const status: AdminUsersSearchParams["status"] =
    statusValue === "ACTIVE" || statusValue === "SUSPENDED" || statusValue === "all" ? statusValue : "all";

  return (
    <div className="grid gap-4">
      <div>
        <div className="text-lg font-semibold text-gray-900">Users</div>
        <div className="text-sm text-gray-500">Manage roles, plans, and access.</div>
      </div>
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

