import { PageMeta } from "@/components/layout/PageMeta";
import DashboardPageSkeleton from "@/components/skeletons/DashboardPageSkeleton";

export default function Loading() {
  return (
    <div className="mx-auto w-full max-w-5xl">
      <PageMeta title="Dashboard" />
      <DashboardPageSkeleton />
    </div>
  );
}

