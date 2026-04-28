"use client";

import { SkeletonBlock } from "@/components/ui/SkeletonBlock";

function CardSkeleton() {
  return (
    <div className="rounded-xl border-[0.5px] border-black/10 bg-white p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <SkeletonBlock width="22px" height="22px" rounded="full" />
          <div className="grid gap-2">
            <SkeletonBlock width="160px" height="10px" />
            <SkeletonBlock width="120px" height="10px" />
          </div>
        </div>
        <div className="flex gap-2">
          <SkeletonBlock width="86px" height="22px" rounded="full" />
          <SkeletonBlock width="86px" height="22px" rounded="full" />
        </div>
      </div>

      <div className="mt-4">
        <SkeletonBlock width="100%" height="60px" rounded="lg" />
      </div>

      <div className="mt-4 grid gap-3">
        {["Accuracy", "Clarity"].map((k) => (
          <div key={k} className="flex items-center gap-3">
            <SkeletonBlock width="56px" height="10px" />
            <SkeletonBlock width="100%" height="3px" rounded="full" />
            <SkeletonBlock width="22px" height="10px" />
          </div>
        ))}
      </div>

      <div className="mt-5 flex items-center justify-between gap-4">
        <div className="flex gap-2">
          <SkeletonBlock width="86px" height="34px" rounded="lg" />
          <SkeletonBlock width="140px" height="34px" rounded="lg" />
        </div>
        <SkeletonBlock width="72px" height="34px" rounded="lg" />
      </div>
    </div>
  );
}

export function LibraryPageSkeleton() {
  return (
    <div className="grid gap-4">
      <SkeletonBlock width="100%" height="36px" rounded="lg" />
      <div className="flex flex-wrap gap-2">
        {["a", "b", "c", "d"].map((k) => (
          <SkeletonBlock key={k} width="120px" height="30px" rounded="full" />
        ))}
      </div>
      <div className="grid gap-4">
        <CardSkeleton />
        <CardSkeleton />
        <CardSkeleton />
      </div>
    </div>
  );
}

export default LibraryPageSkeleton;

