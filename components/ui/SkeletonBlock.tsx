export interface SkeletonBlockProps {
  className?: string;
  height?: number | string;
  width?: number | string;
  rounded?: "none" | "sm" | "md" | "lg" | "full";
}

function borderRadius(rounded?: SkeletonBlockProps["rounded"]) {
  switch (rounded) {
    case "none":
      return 0;
    case "sm":
      return 6;
    case "md":
      return 8;
    case "lg":
      return 12;
    case "full":
      return 9999;
    default:
      return 6;
  }
}

export function SkeletonBlock({
  className = "",
  height = 12,
  width = "100%",
  rounded,
}: Readonly<SkeletonBlockProps>) {
  return (
    <div
      className={`pa-shimmer overflow-hidden ${className}`.trim()}
      style={{
        height,
        width,
        borderRadius: borderRadius(rounded),
        backgroundColor: "color-mix(in srgb, var(--pa-acc1) 10%, transparent)",
      }}
    />
  );
}
