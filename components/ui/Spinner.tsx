"use client";

const SIZES = {
  sm: { px: 18, border: 1.5 },
  md: { px: 28, border: 2 },
  lg: { px: 40, border: 2.5 },
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
        borderColor: "#EEEDFE",
        borderTopColor: "#7F77DD",
        animation: "spin 0.7s linear infinite",
      }}
    />
  );
}

