import { PageMeta } from "@/components/layout/PageMeta";
import UploadPageSkeleton from "@/components/skeletons/UploadPageSkeleton";

export default function Loading() {
  return (
    <div className="mx-auto w-full max-w-5xl">
      <PageMeta title="Analyze prompt" />
      <UploadPageSkeleton />
    </div>
  );
}

