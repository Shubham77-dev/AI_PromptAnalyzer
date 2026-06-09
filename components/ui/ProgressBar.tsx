"use client";

export interface ProgressBarProps {
  value: number; // 0-100
}

export function ProgressBar({ value }: Readonly<ProgressBarProps>) {
  const clampedValue = Math.max(0, Math.min(100, value));

  return (
    <div
      className="w-full h-2 rounded-full overflow-hidden"
      style={{
        background: "var(--pa-card-border)",
      }}
    >
      <div
        className="h-full transition-all duration-300 ease-out rounded-full"
        style={{
          width: `${clampedValue}%`,
          background: "var(--pa-grad)",
        }}
      />
    </div>
  );
}