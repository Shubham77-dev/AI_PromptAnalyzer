export function IconWarn({ className }: Readonly<{ className?: string }>) {
  return (
    <svg viewBox="0 0 20 20" className={className} width={12} height={12} aria-hidden>
      <path
        d="M10 3L3 16h14L10 3zm0 9v1"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function IconTip({ className }: Readonly<{ className?: string }>) {
  return (
    <svg viewBox="0 0 20 20" className={className} width={12} height={12} aria-hidden>
      <path
        d="M8 4h7v7H8V4zM4 8h3v9H4V8z"
        fill="currentColor"
      />
    </svg>
  );
}

export function IconOk({ className }: Readonly<{ className?: string }>) {
  return (
    <svg viewBox="0 0 20 20" className={className} width={12} height={12} aria-hidden>
      <path
        d="M5 10l3 3 7-7"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
