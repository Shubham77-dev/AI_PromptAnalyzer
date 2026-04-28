"use client";

import { SkeletonBlock } from "@/components/ui/SkeletonBlock";

export function SidebarSkeleton() {
  return (
    <aside className="fixed left-0 top-0 z-20 flex h-screen w-10 flex-col border-r-[0.5px] border-black/10 bg-white md:w-[220px]">
      <div className="flex h-[52px] items-center gap-2 border-b-[0.5px] border-black/10 px-3">
        <SkeletonBlock width="10px" height="10px" rounded="full" />
        <div className="hidden md:block">
          <SkeletonBlock width="120px" height="10px" />
        </div>
      </div>

      <div className="flex-1 p-2">
        <div className="grid gap-1">
          {["1", "2", "3", "4"].map((k) => (
            <div key={k} className="flex items-center gap-2 rounded-lg px-2.5 py-2">
              <SkeletonBlock width="16px" height="16px" rounded="sm" />
              <div className="hidden md:block">
                <SkeletonBlock width="110px" height="10px" />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-auto border-t-[0.5px] border-black/10 p-2">
        <div className="flex items-center gap-2 rounded-lg px-2 py-2">
          <SkeletonBlock width="26px" height="26px" rounded="full" />
          <div className="hidden md:block">
            <SkeletonBlock width="120px" height="10px" />
          </div>
        </div>
      </div>
    </aside>
  );
}

export default SidebarSkeleton;

