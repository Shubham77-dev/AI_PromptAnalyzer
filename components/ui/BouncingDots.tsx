"use client";

const DOTS = [
  { color: "#7F77DD", delayMs: 0 },
  { color: "#AFA9EC", delayMs: 150 },
  { color: "#CECBF6", delayMs: 300 },
] as const;

export function BouncingDots() {
  return (
    <span className="inline-flex items-center gap-1" aria-label="Loading">
      {DOTS.map((d) => (
        <span
          key={d.delayMs}
          className="h-[7px] w-[7px] rounded-full"
          style={{
            backgroundColor: d.color,
            animation: "bounce 1s ease-in-out infinite",
            animationDelay: `${d.delayMs}ms`,
          }}
        />
      ))}
    </span>
  );
}

