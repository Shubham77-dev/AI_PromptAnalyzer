import { PageMeta } from "@/components/layout/PageMeta";
import LibraryPageSkeleton from "@/components/skeletons/LibraryPageSkeleton";

export default function Loading() {
  return (
    <div className="mx-auto w-full max-w-5xl">
      <PageMeta title="Public prompt library" />
      <LibraryPageSkeleton />
    </div>
  );
}

