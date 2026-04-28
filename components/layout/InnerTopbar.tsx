"use client";

import type { ReactNode } from "react";

export interface InnerTopbarProps {
  title: string;
  actions?: ReactNode;
}

export function InnerTopbar({ title, actions }: Readonly<InnerTopbarProps>) {
  return (
    <div className="sticky top-0 z-10 h-[52px] border-b-[0.5px] border-black/10 bg-white">
      <div className="flex h-full items-center justify-between gap-3 px-4">
        <div className="text-[15px] font-medium text-gray-900">{title}</div>
        <div className="flex items-center gap-2">{actions}</div>
      </div>
    </div>
  );
}

