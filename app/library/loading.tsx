import { GlowLine } from "@/components/ui/GlowLine";
import { PromptCardSkeleton } from "@/components/library/PromptCardSkeleton";
import { Skeleton } from "@/components/ui/Skeleton";

export default function LibraryLoading() {
  return (
    <div className="mx-auto w-full max-w-5xl">
      <GlowLine />
      <Skeleton width="100%" height={40} className="mb-3" />
      <div className="mb-2 flex gap-2">
        <Skeleton width={48} height={22} rounded="full" />
        <Skeleton width={100} height={22} rounded="full" />
        <Skeleton width={80} height={22} rounded="full" />
      </div>
      <div className="flex flex-col gap-2.5">
        <PromptCardSkeleton />
        <PromptCardSkeleton />
        <PromptCardSkeleton />
      </div>
    </div>
  );
}
