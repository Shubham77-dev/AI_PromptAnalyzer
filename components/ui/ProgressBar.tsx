"use client";

export interface ProgressBarProps {
  animated?: boolean;
  value?: number;
}

export function ProgressBar({ animated = false, value }: Readonly<ProgressBarProps>) {
  const hasValue = typeof value === "number";
  const v = hasValue ? Math.max(0, Math.min(100, value)) : undefined;
  const width = hasValue ? `${v}%` : "72%";

  return (
    <div className="h-[3px] w-full overflow-hidden rounded-[4px] bg-[#EEEDFE]">
      <div
        className="h-full rounded-[4px] bg-[#7F77DD]"
        style={
          animated
            ? { width, animation: "pa-progress 1.4s ease-in-out infinite" }
            : { width }
        }
      />
      <style>{`@keyframes pa-progress{0%{transform:translateX(-100%)}50%{transform:translateX(0)}100%{transform:translateX(-100%)}}`}</style>
    </div>
  );
}

