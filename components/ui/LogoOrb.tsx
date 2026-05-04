export interface LogoOrbProps {
  size: number;
  radius?: number;
  className?: string;
  floating?: boolean;
}

export function LogoOrb({ size, radius, className = "", floating = true }: Readonly<LogoOrbProps>) {
  const r = radius ?? Math.round(size * 0.28);
  const s = Math.max(10, Math.round(size * 0.55));
  const motion = floating ? "pa-float-orb" : "";
  return (
    <span
      className={`inline-grid place-items-center ${motion} ${className}`.trim()}
      style={{
        width: size,
        height: size,
        borderRadius: r,
        background: "var(--pa-grad)",
      }}
      aria-hidden
    >
      <svg width={s} height={s} viewBox="0 0 16 16" aria-hidden>
        <path d="M8 2l1.8 4H14l-3.4 2.4 1.3 4L8 10l-3.9 2.4 1.3-4L2 6h4.2z" fill="white" />
      </svg>
    </span>
  );
}
