import { AppShell } from "@/components/layout/AppShell";
import LibraryPageSkeleton from "@/components/skeletons/LibraryPageSkeleton";

export default function Loading() {
  return (
    <AppShell title="Public prompt library">
      <div className="mx-auto w-full max-w-5xl">
        <LibraryPageSkeleton />
      </div>
    </AppShell>
  );
}

