"use client";

import { Skeleton } from "@/components/ui/Skeleton";

function StatSk() {
  return (
    <div className="rounded-xl p-4" style={{ border: "1px solid var(--pa-card-border)", background: "var(--pa-card)" }}>
      <Skeleton width="90px" height={10} />
      <div className="mt-3">
        <Skeleton width={60} height={24} />
      </div>
      <div className="mt-3">
        <Skeleton width={140} height={10} />
      </div>
    </div>
  );
}

export function DashboardPageSkeleton() {
  return (
    <div className="grid gap-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatSk />
        <StatSk />
        <StatSk />
        <StatSk />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl p-5" style={{ border: "1px solid var(--pa-card-border)", background: "var(--pa-card)" }}>
          <Skeleton width={120} height={12} />
          <div className="mt-4 grid gap-3">
            {["1", "2", "3", "4"].map((k) => (
              <div key={k} className="flex items-center gap-3">
                <Skeleton width={8} height={8} rounded="full" />
                <Skeleton width="65%" height={10} />
                <Skeleton width={64} height={10} />
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl p-5" style={{ border: "1px solid var(--pa-card-border)", background: "var(--pa-card)" }}>
          <Skeleton width={120} height={12} />
          <div className="mt-4 flex items-center gap-4">
            <Skeleton width={84} height={84} rounded="full" />
            <div className="grid flex-1 gap-3">
              {["a", "b", "c", "d"].map((k) => (
                <div key={k} className="flex items-center gap-3">
                  <Skeleton width={56} height={10} />
                  <Skeleton width="100%" height={3} rounded="full" />
                  <Skeleton width={22} height={10} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default DashboardPageSkeleton;
