import type { SVGProps } from "react";

type G = Readonly<SVGProps<SVGSVGElement>>;

export function DashboardGlyph(props: G) {
  return (
    <svg width={14} height={14} viewBox="0 0 14 14" aria-hidden {...props}>
      <rect x="1" y="1" width="5" height="5" rx="1.5" fill="currentColor" opacity={0.9} />
      <rect x="8" y="1" width="5" height="5" rx="1.5" fill="currentColor" opacity={0.4} />
      <rect x="1" y="8" width="5" height="5" rx="1.5" fill="currentColor" opacity={0.4} />
      <rect x="8" y="8" width="5" height="5" rx="1.5" fill="currentColor" opacity={0.4} />
    </svg>
  );
}

export function AnalyzeGlyph(props: G) {
  return (
    <svg width={14} height={14} viewBox="0 0 14 14" fill="none" aria-hidden {...props}>
      <circle cx="7" cy="7" r="5.5" stroke="currentColor" strokeWidth={1.2} />
      <path d="M5 7l1.5 1.5L9.5 5" stroke="currentColor" strokeWidth={1.2} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function LibraryGlyph(props: G) {
  return (
    <svg width={14} height={14} viewBox="0 0 14 14" fill="none" aria-hidden {...props}>
      <path d="M2 3h10M2 6.5h10M2 10h6" stroke="currentColor" strokeWidth={1.2} strokeLinecap="round" />
    </svg>
  );
}

export function SettingsGlyph(props: G) {
  return (
    <svg width={14} height={14} viewBox="0 0 14 14" fill="none" aria-hidden {...props}>
      <circle cx="7" cy="7" r="2" stroke="currentColor" strokeWidth={1.2} />
      <path
        d="M7 1.5v1M7 11.5v1M1.5 7h1M11.5 7h1M3.1 3.1l.7.7M10.2 10.2l.7.7M3.1 10.9l.7-.7M10.2 3.8l.7-.7"
        stroke="currentColor"
        strokeWidth={1.2}
        strokeLinecap="round"
      />
    </svg>
  );
}
