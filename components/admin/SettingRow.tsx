import type { ReactNode } from "react";

export interface SettingRowProps {
  title: string;
  sub?: string;
  right: ReactNode;
}

export function SettingRow({ title, sub, right }: Readonly<SettingRowProps>) {
  return (
    <div className="pa-srow">
      <div className="min-w-0">
        <div style={{ fontSize: 12, color: "var(--pa-text)" }}>
          {title}
        </div>
        {sub ? (
          <div className="mt-0.5 text-[10px] leading-snug" style={{ color: "var(--pa-muted)" }}>
            {sub}
          </div>
        ) : null}
      </div>
      <div className="shrink-0">{right}</div>
    </div>
  );
}
