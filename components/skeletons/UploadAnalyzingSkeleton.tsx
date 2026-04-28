"use client";

import { SkeletonBlock } from "@/components/ui/SkeletonBlock";

export function UploadAnalyzingSkeleton() {
  return (
    <div className="mt-4 grid gap-4 md:grid-cols-3">
      <div className="rounded-xl border border-zinc-200 p-4">
        <div className="text-xs font-medium uppercase tracking-wide text-zinc-500">Score</div>
        <div className="mt-2">
          <SkeletonBlock width="64px" height="28px" rounded="sm" />
        </div>
      </div>

      <div className="rounded-xl border border-zinc-200 p-4">
        <div className="text-xs font-medium uppercase tracking-wide text-zinc-500">Issues</div>
        <div className="mt-3 grid gap-2">
          <SkeletonBlock width="90%" height="10px" />
          <SkeletonBlock width="75%" height="10px" />
          <SkeletonBlock width="80%" height="10px" />
        </div>
      </div>

      <div className="rounded-xl border border-zinc-200 p-4 md:col-span-1">
        <div className="text-xs font-medium uppercase tracking-wide text-zinc-500">Suggestions</div>
        <div className="mt-3 grid gap-2">
          <SkeletonBlock width="88%" height="10px" />
          <SkeletonBlock width="70%" height="10px" />
          <SkeletonBlock width="84%" height="10px" />
        </div>
      </div>

      <div className="rounded-xl border border-zinc-200 p-4 md:col-span-3">
        <div className="flex items-center justify-between gap-3">
          <div className="text-xs font-medium uppercase tracking-wide text-zinc-500">
            Improved prompt
          </div>
          <SkeletonBlock width="56px" height="30px" rounded="lg" />
        </div>
        <div className="mt-2">
          <SkeletonBlock width="100%" height="90px" rounded="lg" />
        </div>
      </div>
    </div>
  );
}

export default UploadAnalyzingSkeleton;

