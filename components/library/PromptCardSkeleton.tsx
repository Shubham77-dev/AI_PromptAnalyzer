import { Skeleton } from "@/components/ui/Skeleton";

export function PromptCardSkeleton() {
  return (
    <div
      className="pa-card-transition flex flex-col gap-3 rounded-xl p-3.5"
      style={{ border: "1px solid var(--pa-card-border)", background: "var(--pa-card)" }}
    >
      <div className="flex items-center gap-2">
        <Skeleton width={28} height={28} rounded="full" />
        <Skeleton width="40%" height={10} />
        <Skeleton width={36} height={18} rounded="full" className="ml-auto" />
      </div>
      <Skeleton width="100%" height={60} />
      <Skeleton width="100%" height={6} />
      <Skeleton width="100%" height={6} />
      <div className="flex gap-2">
        <Skeleton width={72} height={28} rounded="full" />
        <Skeleton width={96} height={28} rounded="full" />
      </div>
    </div>
  );
}
