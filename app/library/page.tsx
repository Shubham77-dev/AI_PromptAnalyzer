import { prisma } from "@/lib/prisma";
import { LibraryBrowseClient } from "@/components/library/LibraryBrowseClient";
import type { LibraryPrompt } from "@/components/library/PromptCard";
import { PageMeta } from "@/components/layout/PageMeta";
import { GlowLine } from "@/components/ui/GlowLine";

export default async function LibraryPage({
  searchParams,
}: Readonly<{ searchParams: { q?: string } }>) {
  const { q } = searchParams;
  const query = (q || "").trim();

  const prompts = await prisma.prompt
    .findMany({
      where: {
        status: "PUBLISHED",
        moderationStatus: "APPROVED",
        ...(query
          ? {
              content: {
                contains: query,
                mode: "insensitive",
              },
            }
          : {}),
      },
      orderBy: { createdAt: "desc" },
      take: 50,
      include: {
        user: { select: { email: true } },
        analysis: true,
        stats: true,
      },
    })
    .catch(() => null);

  const data: LibraryPrompt[] =
    prompts?.map((p) => ({
      id: p.id,
      content: p.content,
      createdAt: p.createdAt.toISOString(),
      user: { email: p.user.email },
      analysis: p.analysis
        ? {
            accuracy: p.analysis.accuracy,
            clarity: p.analysis.clarity,
            suggestions: p.analysis.suggestions,
          }
        : null,
      stats: p.stats ? { likes: p.stats.likes } : null,
    })) ?? [];

  return (
    <div className="mx-auto w-full max-w-5xl">
      <PageMeta title="Prompt library" />
      {prompts === null ? (
        <div className="rounded-xl p-5" style={{ border: "1px solid var(--pa-card-border)", background: "var(--pa-card)" }}>
          <span style={{ fontSize: 11, color: "var(--pa-muted)" }}>
            Database not reachable. Start Postgres, check your DATABASE_URL, and run npm run db:migrate.
          </span>
        </div>
      ) : (
        <>
          <GlowLine />
          <LibraryBrowseClient prompts={data} />
        </>
      )}
    </div>
  );
}
