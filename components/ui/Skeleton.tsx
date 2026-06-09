export interface SkeletonProps {
  width?: string | number;
  height?: string | number;
  rounded?: "default" | "full";
  className?: string;
}

export function Skeleton({
  width = "100%",
  height = 12,
  rounded = "default",
  className = "",
}: Readonly<SkeletonProps>) {
  const w = typeof width === "number" ? `${width}px` : width;
  const h = typeof height === "number" ? `${height}px` : height;
  return (
    <div
      className={`pa-shimmer ${className}`.trim()}
      style={{
        width: w,
        height: h,
        borderRadius: rounded === "full" ? 20 : 6,
        backgroundColor: "rgba(127,119,221,.09)",
      }}
    />
  );
}
