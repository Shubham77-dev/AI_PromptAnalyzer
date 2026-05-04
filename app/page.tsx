import { prisma } from "@/lib/prisma";
import { HomeLanding } from "@/components/landing/HomeLanding";
import type { LandingStatPack } from "@/components/landing/LandingStats";

const FALLBACK: LandingStatPack = {
  analyses: "34.8k",
  prompts: "2,140",
  users: "1,284",
  avg: "71.4",
};

function fmtK(n: number) {
  if (!Number.isFinite(n)) return FALLBACK.analyses;
  if (n >= 1000) {
    const t = (n / 1000).toFixed(1);
    return `${t.endsWith(".0") ? t.slice(0, -2) : t}k`;
  }
  return String(Math.round(n));
}

function fmtInt(n: number) {
  if (!Number.isFinite(n)) return "0";
  return new Intl.NumberFormat("en-US").format(Math.round(n));
}

export default async function Home() {
  let stats = FALLBACK;
  try {
    const [analysisCount, publishedCount, userCount, avgRow] = await Promise.all([
      prisma.promptAnalysis.count(),
      prisma.prompt.count({ where: { status: "PUBLISHED" } }),
      prisma.user.count(),
      prisma.prompt.aggregate({ where: { score: { not: null } }, _avg: { score: true } }),
    ]);
    const avg = avgRow._avg.score;
    stats = {
      analyses: fmtK(analysisCount),
      prompts: fmtInt(publishedCount),
      users: fmtInt(userCount),
      avg: typeof avg === "number" && Number.isFinite(avg) ? avg.toFixed(1) : FALLBACK.avg,
    };
  } catch {
    stats = FALLBACK;
  }

  return <HomeLanding stats={stats} />;
}
