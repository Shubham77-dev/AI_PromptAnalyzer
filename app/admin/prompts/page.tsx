import { PromptTable } from "@/components/admin/PromptTable";
import type { AdminPromptsSearchParams } from "@/components/admin/PromptTable";
import { PromptDetailPanel } from "@/components/admin/PromptDetailPanel";
import { AdminPromptsTopActions } from "@/components/admin/AdminPromptsTopActions";
import { PageMeta } from "@/components/layout/PageMeta";
import { z } from "zod";

export default async function AdminPromptsPage({
  searchParams,
}: Readonly<{
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}>) {
  const sp = await searchParams;
  const get = (k: string) => {
    const v = sp[k];
    return Array.isArray(v) ? v[0] : v;
  };

  const statusValue = get("status");
  const status: AdminPromptsSearchParams["status"] =
    statusValue === "PUBLISHED" || statusValue === "DRAFT" || statusValue === "UNDER_REVIEW" || statusValue === "all"
      ? statusValue
      : "all";

  const viewIdRaw = get("view");
  const viewId = viewIdRaw && z.string().uuid().safeParse(viewIdRaw).success ? viewIdRaw : null;

  const closeParams = new URLSearchParams();
  if (status !== "all") closeParams.set("status", status);
  const minScore = get("minScore");
  const maxScore = get("maxScore");
  const page = get("page");
  if (minScore) closeParams.set("minScore", minScore);
  if (maxScore) closeParams.set("maxScore", maxScore);
  if (page) closeParams.set("page", page);
  const closeHref = `/admin/prompts${closeParams.toString() ? `?${closeParams.toString()}` : ""}`;

  return (
    <div className="grid gap-4">
      <PageMeta title="Prompt moderation" actions={<AdminPromptsTopActions />} />

      {viewId ? <PromptDetailPanel promptId={viewId} closeHref={closeHref} /> : null}

      <PromptTable
        searchParams={{
          status,
          minScore: get("minScore"),
          maxScore: get("maxScore"),
          page: get("page"),
        }}
      />
    </div>
  );
}

