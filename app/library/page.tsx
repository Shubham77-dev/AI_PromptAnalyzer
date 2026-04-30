import { prisma } from "@/lib/prisma";
import { SearchAndFilters } from "@/components/library/SearchAndFilters";
import type { LibraryPrompt } from "@/components/library/PromptCard";
import { PageMeta } from "@/components/layout/PageMeta";

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
      <PageMeta title="Public prompt library" />
      {prompts === null ? (
        <div className="rounded-xl border-[0.5px] border-black/10 bg-white p-5 text-sm text-gray-700">
          Database not reachable. Start Postgres, check your{" "}
          <code className="rounded bg-gray-100 px-1 py-0.5">DATABASE_URL</code>, and run{" "}
          <code className="rounded bg-gray-100 px-1 py-0.5">npm run db:migrate</code>.
        </div>
      ) : (
        <SearchAndFilters prompts={data} />
      )}
    </div>
  );
}

