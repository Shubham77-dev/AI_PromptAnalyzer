"use client";

import { SkeletonBlock } from "@/components/ui/SkeletonBlock";

function StatCard() {
  return (
    <div className="rounded-xl border-[0.5px] border-black/10 bg-white p-5">
      <SkeletonBlock width="90px" height="10px" />
      <div className="mt-3">
        <SkeletonBlock width="60px" height="24px" rounded="sm" />
      </div>
      <div className="mt-3">
        <SkeletonBlock width="140px" height="10px" />
      </div>
    </div>
  );
}

export function DashboardPageSkeleton() {
  return (
    <div className="grid gap-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard />
        <StatCard />
        <StatCard />
        <StatCard />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl border-[0.5px] border-black/10 bg-white p-5">
          <SkeletonBlock width="120px" height="12px" />
          <div className="mt-4 grid gap-3">
            {["1", "2", "3", "4"].map((k) => (
              <div key={k} className="flex items-center gap-3">
                <SkeletonBlock width="8px" height="8px" rounded="full" />
                <SkeletonBlock width="65%" height="10px" />
                <SkeletonBlock width="64px" height="10px" />
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl border-[0.5px] border-black/10 bg-white p-5">
          <SkeletonBlock width="120px" height="12px" />
          <div className="mt-4 flex items-center gap-4">
            <SkeletonBlock width="84px" height="84px" rounded="full" />
            <div className="grid flex-1 gap-3">
              {["a", "b", "c", "d"].map((k) => (
                <div key={k} className="flex items-center gap-3">
                  <SkeletonBlock width="56px" height="10px" />
                  <SkeletonBlock width="100%" height="3px" rounded="full" />
                  <SkeletonBlock width="22px" height="10px" />
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

