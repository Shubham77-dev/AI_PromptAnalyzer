"use client";

import { Skeleton } from "@/components/ui/Skeleton";

export function SidebarSkeleton() {
  return (
    <aside className="fixed left-0 top-0 z-20 flex h-screen w-10 flex-col border-r border-[var(--pa-sb-border)] bg-[var(--pa-sidebar)] md:w-[220px]">
      <div className="flex h-[52px] items-center gap-2 border-b border-[var(--pa-sb-border)] px-3">
        <Skeleton width={10} height={10} rounded="full" />
        <div className="hidden md:block">
          <Skeleton width={120} height={10} />
        </div>
      </div>

      <div className="flex-1 p-2">
        <div className="grid gap-1">
          {["1", "2", "3", "4"].map((k) => (
            <div key={k} className="flex items-center gap-2 rounded-lg px-2.5 py-2">
              <Skeleton width={16} height={16} rounded="full" />
              <div className="hidden md:block">
                <Skeleton width={110} height={10} />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-auto border-t border-[var(--pa-sb-border)] p-2">
        <div className="flex items-center gap-2 rounded-lg px-2 py-2">
          <Skeleton width={26} height={26} rounded="full" />
          <div className="hidden md:block">
            <Skeleton width={120} height={10} />
          </div>
        </div>
      </div>
    </aside>
  );
}

export default SidebarSkeleton;
