"use client";

import { SkeletonBlock } from "@/components/ui/SkeletonBlock";

export function UploadPageSkeleton() {
  return (
    <div className="grid gap-6 md:grid-cols-2">
      <div className="grid gap-4">
        <SkeletonBlock width="100%" height="90px" rounded="lg" />
        <SkeletonBlock width="100%" height="110px" rounded="lg" />
        <SkeletonBlock width="140px" height="36px" rounded="lg" />
      </div>

      <div className="grid gap-4">
        <div className="rounded-xl border-[0.5px] border-black/10 bg-white p-5">
          <SkeletonBlock width="120px" height="12px" />
          <div className="mt-4 flex items-center gap-3">
            <SkeletonBlock width="44px" height="44px" rounded="full" />
            <div className="grid flex-1 gap-3">
              {["a", "b", "c"].map((k) => (
                <div key={k} className="flex items-center gap-3">
                  <SkeletonBlock width="56px" height="10px" />
                  <SkeletonBlock width="100%" height="3px" rounded="full" />
                  <SkeletonBlock width="22px" height="10px" />
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="rounded-xl border-[0.5px] border-black/10 bg-white p-5">
          <SkeletonBlock width="120px" height="12px" />
          <div className="mt-4 grid gap-3">
            {["1", "2"].map((k) => (
              <div key={k} className="flex items-start gap-3">
                <SkeletonBlock width="16px" height="16px" rounded="full" />
                <div className="grid flex-1 gap-2">
                  <SkeletonBlock width="80%" height="10px" />
                  <SkeletonBlock width="60%" height="10px" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default UploadPageSkeleton;

