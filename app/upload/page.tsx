import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { RequireLoginGate } from "@/components/layout/RequireLoginGate";
import { PageMeta } from "@/components/layout/PageMeta";
import { UploadWorkspace } from "@/components/upload/UploadWorkspace";
import { UploadHistoryAction } from "@/components/upload/UploadHistoryAction";
import type { RecentPromptRow } from "@/components/upload/uploadTypes";

export default async function UploadPage() {
  const user = await getCurrentUser();
  if (!user) return <RequireLoginGate />;

  const rows = await prisma.prompt
    .findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 5,
      include: { analysis: true },
    })
    .catch(() => []);

  const recent: RecentPromptRow[] = rows.map((p) => ({
    id: p.id,
    content: p.content,
    createdAt: p.createdAt.toISOString(),
    score:
      p.analysis != null ? Math.round((p.analysis.accuracy + p.analysis.clarity) / 2) : p.score != null
        ? Math.round(p.score)
        : null,
  }));

  return (
    <div className="mx-auto w-full max-w-6xl">
      <PageMeta title="Analyze prompt" actions={<UploadHistoryAction />} />
      <UploadWorkspace recent={recent} />
    </div>
  );
}
