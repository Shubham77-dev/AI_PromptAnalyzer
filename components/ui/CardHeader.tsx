import type { ReactNode } from "react";

export interface CardHeaderProps {
  title: string;
  right?: ReactNode;
}

export function CardHeader({ title, right }: Readonly<CardHeaderProps>) {
  return (
    <div
      className="flex items-center justify-between gap-2"
      style={{
        padding: "11px 14px",
        borderBottom: "1px solid var(--pa-card-border)",
      }}
    >
      <span
        style={{
          fontSize: 10,
          fontWeight: 500,
          textTransform: "uppercase",
          letterSpacing: "0.4px",
          color: "var(--pa-muted)",
        }}
      >
        {title}
      </span>
      {right ? <div className="float-right">{right}</div> : null}
    </div>
  );
}
