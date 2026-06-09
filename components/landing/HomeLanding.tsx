import { LandingTopNav } from "@/components/landing/LandingTopNav";
import { LandingHero } from "@/components/landing/LandingHero";
import { LandingFeatures } from "@/components/landing/LandingFeatures";
import { LandingStats, type LandingStatPack } from "@/components/landing/LandingStats";

export function HomeLanding({ stats }: Readonly<{ stats: LandingStatPack }>) {
  return (
    <div className="flex min-h-screen flex-col" style={{ background: "var(--pa-bg)" }}>
      <LandingTopNav />
      <main className="flex flex-1 flex-col">
        <LandingHero />
        <div className="mx-auto w-full px-4 pb-12">
          <LandingFeatures />
          <LandingStats stats={stats} />
        </div>
      </main>
    </div>
  );
}
