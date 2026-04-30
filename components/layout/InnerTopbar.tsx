"use client";

import type { ReactNode } from "react";

export interface InnerTopbarProps {
  title: string;
  actions?: ReactNode;
}

export function InnerTopbar({ title, actions }: Readonly<InnerTopbarProps>) {
  return (
    <div className="pa-transition sticky top-0 z-10 h-[52px] border-b border-[var(--pa-card-border)] bg-[var(--pa-card)]">
      <div className="flex h-full items-center justify-between gap-3 px-4">
        <div className="text-[15px] font-medium" style={{ color: "var(--pa-text)" }}>
          {title}
        </div>
        <div className="flex items-center gap-2">{actions}</div>
      </div>
    </div>
  );
}

