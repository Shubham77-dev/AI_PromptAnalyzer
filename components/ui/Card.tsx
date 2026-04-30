import type { ReactNode } from "react";

export interface CardProps {
  children: ReactNode;
  className?: string;
}

export function Card({ children, className = "" }: Readonly<CardProps>) {
  return (
    <div
      className={`pa-card-transition overflow-hidden ${className}`}
      style={{
        background: "var(--pa-card)",
        border: "1px solid var(--pa-card-border)",
        borderRadius: 12,
      }}
    >
      {children}
    </div>
  );
}
