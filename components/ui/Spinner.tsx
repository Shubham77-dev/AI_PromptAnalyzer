"use client";

const SIZES = {
  sm: { px: 14, border: 1.5 },
  md: { px: 20, border: 2 },
  lg: { px: 36, border: 2.5 },
} as const;

export type SpinnerSize = keyof typeof SIZES;

export function Spinner({ size = "md" }: Readonly<{ size?: SpinnerSize }>) {
  const s = SIZES[size];
  return (
    <span
      aria-label="Loading"
      className="inline-block rounded-full"
      style={{
        width: s.px,
        height: s.px,
        borderWidth: s.border,
        borderStyle: "solid",
        borderColor: "var(--pa-hint)",
        borderTopColor: "var(--pa-acc1)",
        animation: "pa-spin 0.65s linear infinite",
      }}
    />
  );
}
