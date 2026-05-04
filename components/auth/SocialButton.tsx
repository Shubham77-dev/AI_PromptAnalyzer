"use client";

import type { ReactNode } from "react";

export interface SocialButtonProps {
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  icon?: ReactNode;
}

export function SocialButton({ children, onClick, disabled, icon }: Readonly<SocialButtonProps>) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="pa-btn-out flex w-full items-center justify-center gap-2 rounded-[10px] px-2 py-2 text-xs disabled:opacity-60"
    >
      {icon}
      {children}
    </button>
  );
}
