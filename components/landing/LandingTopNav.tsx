import Link from "next/link";
import { LogoOrb } from "@/components/ui/LogoOrb";

export function LandingTopNav() {
  return (
    <header
      className="flex h-12 items-center justify-between border-b px-4"
      style={{ background: "var(--pa-sidebar)", borderColor: "var(--pa-sb-border)" }}
    >
      <Link href="/" className="flex items-center gap-2">
        <LogoOrb size={26} radius={8} />
        <span className="text-[13px] font-medium" style={{ color: "var(--pa-text)" }}>
          PromptAnalyzer
        </span>
      </Link>
      <div className="flex items-center gap-2">
        <Link href="/library" className="pa-btn-out text-[11px]">
          Browse library
        </Link>
        <Link href="/login" className="pa-btn-grad text-[11px]">
          Sign in
        </Link>
      </div>
    </header>
  );
}
