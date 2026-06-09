import type { SVGProps } from "react";

type G = Readonly<SVGProps<SVGSVGElement>>;

export function ReportsGlyph(props: G) {
  return (
    <svg width={14} height={14} viewBox="0 0 14 14" fill="none" aria-hidden {...props}>
      <path d="M2 10V7M5 10V4M8 10V5M11 10V2" stroke="currentColor" strokeWidth={1.1} strokeLinecap="round" />
    </svg>
  );
}

export function UsersGlyph(props: G) {
  return (
    <svg width={14} height={14} viewBox="0 0 14 14" fill="none" aria-hidden {...props}>
      <circle cx="6.5" cy="4" r="2.2" stroke="currentColor" strokeWidth={1.2} />
      <path d="M1.5 11c0-2 2.2-3.5 5-3.5s5 1.5 5 3.5" stroke="currentColor" strokeWidth={1.2} strokeLinecap="round" />
    </svg>
  );
}

export function AllPromptsGlyph(props: G) {
  return (
    <svg width={14} height={14} viewBox="0 0 14 14" fill="none" aria-hidden {...props}>
      <path d="M2 3h9M2 6h9M2 9h6" stroke="currentColor" strokeWidth={1.2} strokeLinecap="round" />
    </svg>
  );
}

export function FlaggedGlyph(props: G) {
  return (
    <svg width={14} height={14} viewBox="0 0 14 14" fill="none" aria-hidden {...props}>
      <path
        d="M3 2v9M3 2h7l-1.5 3L10 8H3"
        stroke="currentColor"
        strokeWidth={1.2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function AppSettingsGlyph(props: G) {
  return (
    <svg width={14} height={14} viewBox="0 0 14 14" fill="none" aria-hidden {...props}>
      <circle cx="6.5" cy="6.5" r="2" stroke="currentColor" strokeWidth={1.2} />
      <path d="M6.5 1.5v1M6.5 11v1M1.5 6.5h1M11 6.5h1" stroke="currentColor" strokeWidth={1.2} strokeLinecap="round" />
    </svg>
  );
}
