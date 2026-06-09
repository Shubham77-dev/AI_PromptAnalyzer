import type { SVGProps } from "react";

type G = Readonly<SVGProps<SVGSVGElement>>;

export function EmailIcon(props: G) {
  return (
    <svg width={14} height={14} viewBox="0 0 14 14" fill="none" aria-hidden {...props}>
      <path
        d="M2 4l5 3 5-3M2 4h10v7H2V4z"
        stroke="currentColor"
        strokeWidth={1.1}
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function LockIcon(props: G) {
  return (
    <svg width={14} height={14} viewBox="0 0 14 14" fill="none" aria-hidden {...props}>
      <rect x="2" y="6" width="10" height="7" rx="1.5" stroke="currentColor" strokeWidth={1.1} />
      <path d="M4 6V4a3 3 0 016 0v2" stroke="currentColor" strokeWidth={1.1} strokeLinecap="round" />
    </svg>
  );
}

export function EyeIcon(props: G) {
  return (
    <svg width={14} height={14} viewBox="0 0 14 14" fill="none" aria-hidden {...props}>
      <path
        d="M1.5 7C3 4 5 2.5 7 2.5S11 4 12.5 7C11 10 9 11.5 7 11.5S3 10 1.5 7z"
        stroke="currentColor"
        strokeWidth={1.1}
      />
      <circle cx="7" cy="7" r="2" stroke="currentColor" strokeWidth={1.1} />
    </svg>
  );
}

export function ArrowRightIcon(props: G) {
  return (
    <svg width={14} height={14} viewBox="0 0 14 14" fill="none" aria-hidden {...props}>
      <path d="M3 7h8M8 4l3 3-3 3" stroke="currentColor" strokeWidth={1.3} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
