import type { ReactNode } from "react";

export interface DangerZoneProps {
  children: ReactNode;
}

export function DangerZone({ children }: Readonly<DangerZoneProps>) {
  return (
    <div className="pa-danger-zone overflow-hidden rounded-xl">
      <div className="pa-danger-zone__header px-3.5 py-2.5 text-[10px] font-medium uppercase tracking-wide">
        Danger zone
      </div>
      <div>{children}</div>
    </div>
  );
}
