import { AppShell } from "@/components/layout/AppShell";
import UploadPageSkeleton from "@/components/skeletons/UploadPageSkeleton";

export default function Loading() {
  return (
    <AppShell title="Analyze prompt">
      <div className="mx-auto w-full max-w-5xl">
        <UploadPageSkeleton />
      </div>
    </AppShell>
  );
}

