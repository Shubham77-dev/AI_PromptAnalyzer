import Link from "next/link";
import { LogoOrb } from "@/components/ui/LogoOrb";

export function LandingHero() {
  return (
    <section className="relative flex flex-1 flex-col items-center justify-center px-4 py-10 text-center">
      <div
        className="pointer-events-none absolute"
        style={{
          width: 320,
          height: 320,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(123,92,240,.1), transparent 70%)",
        }}
      />
      <LogoOrb size={64} radius={18} className="relative" />
      <h1 className="relative mt-6 text-[26px] font-medium leading-tight" style={{ color: "var(--pa-text)" }}>
        Analyze. Improve.
        <br />
        <span className="pa-grad-text">Ship better prompts.</span>
      </h1>
      <p className="relative mx-auto mb-6 mt-3 max-w-[340px] text-[13px] leading-relaxed" style={{ color: "var(--pa-muted)" }}>
        AI-powered scoring and suggestions to make every prompt you write more accurate, clear, and effective.
      </p>
      <div className="relative flex flex-wrap items-center justify-center gap-2">
        <Link
          href="/upload"
          className="pa-btn-grad inline-flex items-center justify-center rounded-[10px] px-[22px] py-[9px] text-[13px]"
        >
          Start analyzing
        </Link>
        <Link
          href="/library"
          className="pa-btn-out inline-flex items-center justify-center rounded-[10px] px-[18px] py-[9px] text-[13px]"
        >
          Browse library
        </Link>
      </div>
    </section>
  );
}
