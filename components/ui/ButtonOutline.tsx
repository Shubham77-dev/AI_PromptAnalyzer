"use client";

import Link from "next/link";
import type { CSSProperties, ReactNode } from "react";

const outlineStyle: CSSProperties = {
  background: "transparent",
  border: "1px solid var(--pa-sb-border)",
  color: "var(--pa-muted)",
  borderRadius: 8,
  padding: "5px 12px",
  fontSize: 11,
};

export interface ButtonOutlineProps {
  children: ReactNode;
  href?: string;
  onClick?: () => void;
  className?: string;
  type?: "button" | "submit";
  disabled?: boolean;
}

export function ButtonOutline({
  children,
  href,
  onClick,
  className = "",
  type = "button",
  disabled,
}: Readonly<ButtonOutlineProps>) {
  const cls = `pa-btn-outline pa-btn-transition inline-flex items-center justify-center ${className}`;
  if (href && !disabled) {
    return (
      <Link href={href} className={cls} style={outlineStyle}>
        {children}
      </Link>
    );
  }
  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={cls}
      style={{
        ...outlineStyle,
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.6 : 1,
      }}
    >
      {children}
    </button>
  );
}
