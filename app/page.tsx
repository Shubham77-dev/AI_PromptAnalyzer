import type { ReactNode } from "react";
import { ABOUT_MESSAGE } from "@/app/_lib/app-config";
import { PageMeta } from "@/components/layout/PageMeta";
import { ButtonGradient } from "@/components/ui/ButtonGradient";
import { ButtonOutline } from "@/components/ui/ButtonOutline";
import { Card } from "@/components/ui/Card";
import { GlowLine } from "@/components/ui/GlowLine";

export default function Home() {
  return (
    <div className="mx-auto w-full max-w-5xl">
      <PageMeta title="Home" actions={<ButtonGradient href="/upload">+ New analysis</ButtonGradient>} />

      <GlowLine />

      <div className="mb-10">
        <h1 className="pa-grad-text text-3xl font-medium leading-tight">
          Analyze. Improve. Ship better prompts.
        </h1>
        <p className="mt-3 max-w-2xl leading-relaxed" style={{ fontSize: 14, color: "var(--pa-muted)" }}>
          {ABOUT_MESSAGE} Upload prompts, get AI-powered analysis (accuracy/clarity + suggestions), keep
          private ratings in your dashboard, then publish to a searchable public library with likes and copy.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <ButtonGradient href="/upload">Start analyzing</ButtonGradient>
          <ButtonOutline href="/library">Browse library</ButtonOutline>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <FeatureCard
          title="AI scoring"
          desc="Accuracy and clarity scored out of 100"
          icon={<ScoreRingIcon />}
        />
        <FeatureCard
          title="Smart suggestions"
          desc="Actionable fixes with improved prompt preview"
          icon={<ListIcon />}
        />
        <FeatureCard
          title="Public library"
          desc="Search, copy, and like top-rated prompts"
          icon={<LibraryIcon />}
        />
      </div>
    </div>
  );
}

function FeatureCard({
  title,
  desc,
  icon,
}: Readonly<{ title: string; desc: string; icon: ReactNode }>) {
  return (
    <Card>
      <div className="p-5">
        <div
          className="grid h-10 w-10 place-items-center rounded-xl"
          style={{ backgroundImage: "var(--pa-grad)" }}
        >
          <span className="text-white">{icon}</span>
        </div>
        <div className="mt-4 font-medium" style={{ fontSize: 13, color: "var(--pa-text)" }}>
          {title}
        </div>
        <p className="mt-2" style={{ fontSize: 11, color: "var(--pa-muted)" }}>
          {desc}
        </p>
      </div>
    </Card>
  );
}

function ScoreRingIcon() {
  return (
    <svg width={20} height={20} viewBox="0 0 24 24" aria-hidden>
      <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="2" />
      <path d="M12 7v5l3 2" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function ListIcon() {
  return (
    <svg width={20} height={20} viewBox="0 0 24 24" aria-hidden>
      <path d="M6 7h14M6 12h14M6 17h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function LibraryIcon() {
  return (
    <svg width={20} height={20} viewBox="0 0 24 24" aria-hidden>
      <path
        d="M4 6h16v12H4V6zm3 3h10M7 12h7"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}
