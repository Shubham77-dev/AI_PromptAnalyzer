import type { ReactNode } from "react";

export interface DangerZoneProps {
  children: ReactNode;
}

export function DangerZone({ children }: Readonly<DangerZoneProps>) {
  return (
    <div className="overflow-hidden rounded-xl" style={{ border: "1px solid color-mix(in srgb, var(--pa-acc3) 35%, transparent)" }}>
      <div className="px-3.5 py-2.5 text-[10px] font-medium uppercase tracking-wide" style={{ background: "rgba(255,107,53,.12)", color: "var(--pa-acc4)" }}>
        Danger zone
      </div>
      <div>{children}</div>
    </div>
  );
}
