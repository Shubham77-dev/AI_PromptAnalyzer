import { AppShell } from "@/components/layout/AppShell";
import DashboardPageSkeleton from "@/components/skeletons/DashboardPageSkeleton";

export default function Loading() {
  return (
    <AppShell title="Dashboard">
      <div className="mx-auto w-full max-w-5xl">
        <DashboardPageSkeleton />
      </div>
    </AppShell>
  );
}

