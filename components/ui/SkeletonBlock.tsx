"use client";

export type SkeletonRounded = "sm" | "md" | "lg" | "full";

export interface SkeletonBlockProps {
  width?: string;
  height?: string;
  rounded?: SkeletonRounded;
}

const ROUNDED: Record<SkeletonRounded, string> = {
  sm: "rounded-[4px]",
  md: "rounded-[6px]",
  lg: "rounded-[12px]",
  full: "rounded-full",
};

export function SkeletonBlock({
  width = "100%",
  height = "12px",
  rounded = "md",
}: Readonly<SkeletonBlockProps>) {
  return (
    <div
      className={["pa-shimmer", ROUNDED[rounded]].join(" ")}
      style={{ width, height }}
      aria-hidden="true"
    />
  );
}

